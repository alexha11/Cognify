import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';
import { AppConfig } from './config.interface';

const isProduction = Joi.ref('NODE_ENV', {
  adjust: (v: string) => v === 'production',
});

/** Required (and non-empty) in production, optional elsewhere. */
const requiredInProduction = (schema: Joi.StringSchema) =>
  Joi.alternatives().conditional(isProduction, {
    is: true,
    then: schema.required().disallow(''),
    otherwise: schema.optional().allow(''),
  });

export const appConfigValidationSchema = Joi.object({
  PORT: Joi.number().default(3001),
  DATABASE_URL: Joi.string().required(),
  // A short secret makes offline brute-force of issued tokens practical.
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  // Signs the OAuth `state` cookie that protects the Google flow from login CSRF.
  COOKIE_SECRET: Joi.string().min(32).required(),
  OPENROUTER_API_KEY: Joi.string().optional().allow(''),
  OPENROUTER_MODEL: Joi.string().default('google/gemini-2.0-flash-001'),
  STRIPE_SECRET_KEY: Joi.string().optional().allow(''),
  STRIPE_WEBHOOK_SECRET: Joi.string().optional().allow(''),
  STRIPE_PRICE_ID_PRO: Joi.string().optional().allow(''),
  STRIPE_PRICE_ID_ENTERPRISE: Joi.string().optional().allow(''),
  SUPABASE_URL: Joi.string().optional().allow(''),
  SUPABASE_ANON_KEY: Joi.string().optional().allow(''),
  SUPABASE_SERVICE_KEY: Joi.string().optional().allow(''),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  // Google sign-in is optional in dev; if the app ships with a Google button
  // in production the credentials must actually be present.
  GOOGLE_CLIENT_ID: requiredInProduction(Joi.string()),
  GOOGLE_CLIENT_SECRET: requiredInProduction(Joi.string()),
  // Must be the public https origin in production: it is both the OAuth
  // redirect target and the only allowed CORS origin.
  FRONTEND_URL: Joi.string().uri().default('http://localhost:3000'),
  RESEND_API_KEY: Joi.string().optional().allow(''),
  RESEND_FROM_EMAIL: Joi.string().default('onboarding@resend.dev'),
});

export const appConfig = registerAs(
  'app',
  (): AppConfig => ({
    port: parseInt(process.env.PORT || '3001', 10),
    databaseUrl: process.env.DATABASE_URL || '',
    jwtSecret: process.env.JWT_SECRET || '',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    cookieSecret: process.env.COOKIE_SECRET || '',
    openRouterApiKey: process.env.OPENROUTER_API_KEY || '',
    openRouterModel:
      process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-001',
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    stripePriceIdPro: process.env.STRIPE_PRICE_ID_PRO || '',
    stripePriceIdEnterprise: process.env.STRIPE_PRICE_ID_ENTERPRISE || '',
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || '',
    nodeEnv: process.env.NODE_ENV || 'development',
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    resendApiKey: process.env.RESEND_API_KEY || '',
    resendFromEmail: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
  }),
);
