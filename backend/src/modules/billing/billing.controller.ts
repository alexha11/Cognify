import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Headers,
  UseGuards,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { BillingService } from './billing.service';
import { CreateCheckoutDto, CreatePortalDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles, CurrentUser } from '../../common/decorators';
import { Role } from '@prisma/client';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  /**
   * Create checkout session
   * POST /billing/checkout
   */
  @Post('checkout')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async createCheckout(
    @Body() dto: CreateCheckoutDto,
    @CurrentUser('organizationId') organizationId: string | undefined,
  ) {
    return this.billingService.createCheckoutSession(
      organizationId || "",
      dto.plan,
      dto.successUrl,
      dto.cancelUrl,
    );
  }

  /**
   * Handle Stripe webhook
   * POST /billing/webhook
   */
  @Post('webhook')
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new Error('Raw body not available');
    }
    return this.billingService.handleWebhook(rawBody, signature);
  }

  /**
   * Get subscription status
   * GET /billing/status
   */
  @Get('status')
  @UseGuards(JwtAuthGuard)
  async getStatus(@CurrentUser('organizationId') organizationId: string | undefined) {
    return this.billingService.getSubscriptionStatus(organizationId || "");
  }

  /**
   * Create customer portal session
   * POST /billing/portal
   */
  @Post('portal')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async createPortal(
    @Body() dto: CreatePortalDto,
    @CurrentUser('organizationId') organizationId: string | undefined,
  ) {
    return this.billingService.createPortalSession(organizationId || "", dto.returnUrl);
  }
}
