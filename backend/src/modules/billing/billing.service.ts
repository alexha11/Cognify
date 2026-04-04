import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../../prisma';
import { Plan, SubscriptionStatus } from '@prisma/client';
import { Config } from '../../config';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly stripe: Stripe;

  constructor(
    private readonly configService: ConfigService<Config>,
    private readonly prisma: PrismaService,
  ) {
    const stripeKey = this.configService.get('app.stripeSecretKey', {
      infer: true,
    });
    if (stripeKey) {
      this.stripe = new Stripe(stripeKey);
    } else {
      this.logger.warn('Stripe secret key not configured');
      this.stripe = null as unknown as Stripe;
    }
  }

  /**
   * Create Stripe checkout session for subscription
   */
  async createCheckoutSession(
    organizationId: string,
    plan: 'PRO' | 'ENTERPRISE',
    successUrl: string,
    cancelUrl: string,
  ): Promise<{ sessionId: string; url: string }> {
    if (!this.stripe) {
      throw new BadRequestException('Stripe not configured');
    }

    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Get or create Stripe customer
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

    // Get price ID based on plan
    const priceId =
      plan === 'PRO'
        ? this.configService.get('app.stripePriceIdPro', { infer: true })
        : this.configService.get('app.stripePriceIdEnterprise', {
            infer: true,
          });

    if (!priceId) {
      throw new BadRequestException('Price not configured for selected plan');
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

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(
    payload: Buffer,
    signature: string,
  ): Promise<{ received: boolean }> {
    if (!this.stripe) {
      throw new BadRequestException('Stripe not configured');
    }

    const webhookSecret = this.configService.get('app.stripeWebhookSecret', {
      infer: true,
    });
    if (!webhookSecret) {
      throw new BadRequestException('Webhook secret not configured');
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret,
      );
    } catch (err) {
      this.logger.error('Webhook signature verification failed', err);
      throw new BadRequestException('Invalid signature');
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

  /**
   * Handle subscription created/updated
   */
  private async handleSubscriptionUpdate(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    const customerId = subscription.customer as string;

    const organization = await this.prisma.organization.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (!organization) {
      this.logger.warn(`No organization found for customer ${customerId}`);
      return;
    }

    // Map Stripe status to our status
    const statusMap: Record<string, SubscriptionStatus> = {
      active: SubscriptionStatus.ACTIVE,
      canceled: SubscriptionStatus.CANCELED,
      past_due: SubscriptionStatus.PAST_DUE,
      trialing: SubscriptionStatus.TRIALING,
    };

    const status = statusMap[subscription.status] || SubscriptionStatus.ACTIVE;

    // Determine plan from price
    const priceId = subscription.items.data[0]?.price.id;
    let plan: Plan = Plan.PRO;
    if (
      priceId ===
      this.configService.get('app.stripePriceIdEnterprise', { infer: true })
    ) {
      plan = Plan.ENTERPRISE;
    }

    // Upsert subscription
    await this.prisma.subscription.upsert({
      where: { stripeSubscriptionId: subscription.id },
      create: {
        stripeSubscriptionId: subscription.id,
        stripePriceId: priceId || '',
        status,
        currentPeriodStart: new Date(
          (subscription.items.data[0]?.current_period_start ??
            Math.floor(Date.now() / 1000)) * 1000,
        ),
        currentPeriodEnd: new Date(
          (subscription.items.data[0]?.current_period_end ??
            Math.floor(Date.now() / 1000)) * 1000,
        ),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        organizationId: organization.id,
      },
      update: {
        status,
        currentPeriodStart: new Date(
          (subscription.items.data[0]?.current_period_start ??
            Math.floor(Date.now() / 1000)) * 1000,
        ),
        currentPeriodEnd: new Date(
          (subscription.items.data[0]?.current_period_end ??
            Math.floor(Date.now() / 1000)) * 1000,
        ),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });

    // Update organization plan
    await this.prisma.organization.update({
      where: { id: organization.id },
      data: { plan },
    });

    this.logger.log(
      `Updated subscription for org ${organization.id} to ${plan}`,
    );
  }

  /**
   * Handle subscription deleted
   */
  private async handleSubscriptionDeleted(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    const existingSub = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (!existingSub) return;

    // Update subscription status
    await this.prisma.subscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: { status: SubscriptionStatus.CANCELED },
    });

    // Downgrade organization to free
    await this.prisma.organization.update({
      where: { id: existingSub.organizationId },
      data: { plan: Plan.FREE },
    });

    this.logger.log(
      `Subscription canceled for org ${existingSub.organizationId}`,
    );
  }

  /**
   * Get subscription status for organization
   */
  async getSubscriptionStatus(
    organizationId: string,
  ): Promise<{ plan: Plan; subscription: any }> {
    const subscription = await this.prisma.subscription.findFirst({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });

    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    return {
      plan: organization?.plan || Plan.FREE,
      subscription: subscription || null,
    };
  }

  /**
   * Create customer portal session
   */
  async createPortalSession(
    organizationId: string,
    returnUrl: string,
  ): Promise<{ url: string }> {
    if (!this.stripe) {
      throw new BadRequestException('Stripe not configured');
    }

    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization?.stripeCustomerId) {
      throw new BadRequestException('No billing account found');
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: organization.stripeCustomerId,
      return_url: returnUrl,
    });

    return { url: session.url };
  }
}
