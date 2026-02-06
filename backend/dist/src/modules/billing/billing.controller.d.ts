import type { RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { BillingService } from './billing.service';
import { CreateCheckoutDto, CreatePortalDto } from './dto';
export declare class BillingController {
    private readonly billingService;
    constructor(billingService: BillingService);
    createCheckout(dto: CreateCheckoutDto, organizationId: string): Promise<{
        sessionId: string;
        url: string;
    }>;
    handleWebhook(req: RawBodyRequest<Request>, signature: string): Promise<{
        received: boolean;
    }>;
    getStatus(organizationId: string): Promise<{
        plan: import("@prisma/client").Plan;
        subscription: any;
    }>;
    createPortal(dto: CreatePortalDto, organizationId: string): Promise<{
        url: string;
    }>;
}
