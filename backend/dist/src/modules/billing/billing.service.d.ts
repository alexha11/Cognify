import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma';
import { Plan } from '@prisma/client';
import { Config } from '../../config';
export declare class BillingService {
    private readonly configService;
    private readonly prisma;
    private readonly logger;
    private readonly stripe;
    constructor(configService: ConfigService<Config>, prisma: PrismaService);
    createCheckoutSession(organizationId: string, plan: 'PRO' | 'ENTERPRISE', successUrl: string, cancelUrl: string): Promise<{
        sessionId: string;
        url: string;
    }>;
    handleWebhook(payload: Buffer, signature: string): Promise<{
        received: boolean;
    }>;
    private handleSubscriptionUpdate;
    private handleSubscriptionDeleted;
    getSubscriptionStatus(organizationId: string): Promise<{
        plan: Plan;
        subscription: any;
    }>;
    createPortalSession(organizationId: string, returnUrl: string): Promise<{
        url: string;
    }>;
}
