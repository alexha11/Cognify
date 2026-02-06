"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var BillingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const stripe_1 = __importDefault(require("stripe"));
const prisma_1 = require("../../prisma");
const client_1 = require("@prisma/client");
let BillingService = BillingService_1 = class BillingService {
    configService;
    prisma;
    logger = new common_1.Logger(BillingService_1.name);
    stripe;
    constructor(configService, prisma) {
        this.configService = configService;
        this.prisma = prisma;
        const stripeKey = this.configService.get('app.stripeSecretKey', { infer: true });
        if (stripeKey) {
            this.stripe = new stripe_1.default(stripeKey);
        }
        else {
            this.logger.warn('Stripe secret key not configured');
            this.stripe = null;
        }
    }
    async createCheckoutSession(organizationId, plan, successUrl, cancelUrl) {
        if (!this.stripe) {
            throw new common_1.BadRequestException('Stripe not configured');
        }
        const organization = await this.prisma.organization.findUnique({
            where: { id: organizationId },
        });
        if (!organization) {
            throw new common_1.NotFoundException('Organization not found');
        }
        let customerId = organization.stripeCustomerId;
        if (!customerId) {
            const customer = await this.stripe.customers.create({
                name: organization.name,
                metadata: { organizationId },
            });
            customerId = customer.id;
            await this.prisma.organization.update({
                where: { id: organizationId },
                data: { stripeCustomerId: customerId },
            });
        }
        const priceId = plan === 'PRO'
            ? this.configService.get('app.stripePriceIdPro', { infer: true })
            : this.configService.get('app.stripePriceIdEnterprise', { infer: true });
        if (!priceId) {
            throw new common_1.BadRequestException('Price not configured for selected plan');
        }
        const session = await this.stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: {
                organizationId,
                plan,
            },
        });
        return {
            sessionId: session.id,
            url: session.url || '',
        };
    }
    async handleWebhook(payload, signature) {
        if (!this.stripe) {
            throw new common_1.BadRequestException('Stripe not configured');
        }
        const webhookSecret = this.configService.get('app.stripeWebhookSecret', { infer: true });
        if (!webhookSecret) {
            throw new common_1.BadRequestException('Webhook secret not configured');
        }
        let event;
        try {
            event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
        }
        catch (err) {
            this.logger.error('Webhook signature verification failed', err);
            throw new common_1.BadRequestException('Invalid signature');
        }
        switch (event.type) {
            case 'customer.subscription.created':
            case 'customer.subscription.updated':
                await this.handleSubscriptionUpdate(event.data.object);
                break;
            case 'customer.subscription.deleted':
                await this.handleSubscriptionDeleted(event.data.object);
                break;
            default:
                this.logger.log(`Unhandled event type: ${event.type}`);
        }
        return { received: true };
    }
    async handleSubscriptionUpdate(subscription) {
        const customerId = subscription.customer;
        const organization = await this.prisma.organization.findFirst({
            where: { stripeCustomerId: customerId },
        });
        if (!organization) {
            this.logger.warn(`No organization found for customer ${customerId}`);
            return;
        }
        const statusMap = {
            active: client_1.SubscriptionStatus.ACTIVE,
            canceled: client_1.SubscriptionStatus.CANCELED,
            past_due: client_1.SubscriptionStatus.PAST_DUE,
            trialing: client_1.SubscriptionStatus.TRIALING,
        };
        const status = statusMap[subscription.status] || client_1.SubscriptionStatus.ACTIVE;
        const priceId = subscription.items.data[0]?.price.id;
        let plan = client_1.Plan.PRO;
        if (priceId === this.configService.get('app.stripePriceIdEnterprise', { infer: true })) {
            plan = client_1.Plan.ENTERPRISE;
        }
        await this.prisma.subscription.upsert({
            where: { stripeSubscriptionId: subscription.id },
            create: {
                stripeSubscriptionId: subscription.id,
                stripePriceId: priceId || '',
                status,
                currentPeriodStart: new Date((subscription.items.data[0]?.current_period_start ?? Math.floor(Date.now() / 1000)) * 1000),
                currentPeriodEnd: new Date((subscription.items.data[0]?.current_period_end ?? Math.floor(Date.now() / 1000)) * 1000),
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
                organizationId: organization.id,
            },
            update: {
                status,
                currentPeriodStart: new Date((subscription.items.data[0]?.current_period_start ?? Math.floor(Date.now() / 1000)) * 1000),
                currentPeriodEnd: new Date((subscription.items.data[0]?.current_period_end ?? Math.floor(Date.now() / 1000)) * 1000),
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
            },
        });
        await this.prisma.organization.update({
            where: { id: organization.id },
            data: { plan },
        });
        this.logger.log(`Updated subscription for org ${organization.id} to ${plan}`);
    }
    async handleSubscriptionDeleted(subscription) {
        const existingSub = await this.prisma.subscription.findUnique({
            where: { stripeSubscriptionId: subscription.id },
        });
        if (!existingSub)
            return;
        await this.prisma.subscription.update({
            where: { stripeSubscriptionId: subscription.id },
            data: { status: client_1.SubscriptionStatus.CANCELED },
        });
        await this.prisma.organization.update({
            where: { id: existingSub.organizationId },
            data: { plan: client_1.Plan.FREE },
        });
        this.logger.log(`Subscription canceled for org ${existingSub.organizationId}`);
    }
    async getSubscriptionStatus(organizationId) {
        const subscription = await this.prisma.subscription.findFirst({
            where: { organizationId },
            orderBy: { createdAt: 'desc' },
        });
        const organization = await this.prisma.organization.findUnique({
            where: { id: organizationId },
        });
        return {
            plan: organization?.plan || client_1.Plan.FREE,
            subscription: subscription || null,
        };
    }
    async createPortalSession(organizationId, returnUrl) {
        if (!this.stripe) {
            throw new common_1.BadRequestException('Stripe not configured');
        }
        const organization = await this.prisma.organization.findUnique({
            where: { id: organizationId },
        });
        if (!organization?.stripeCustomerId) {
            throw new common_1.BadRequestException('No billing account found');
        }
        const session = await this.stripe.billingPortal.sessions.create({
            customer: organization.stripeCustomerId,
            return_url: returnUrl,
        });
        return { url: session.url };
    }
};
exports.BillingService = BillingService;
exports.BillingService = BillingService = BillingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_1.PrismaService])
], BillingService);
//# sourceMappingURL=billing.service.js.map