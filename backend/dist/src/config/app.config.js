"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.appConfig = exports.appConfigValidationSchema = void 0;
const config_1 = require("@nestjs/config");
const Joi = __importStar(require("joi"));
exports.appConfigValidationSchema = Joi.object({
    PORT: Joi.number().default(3001),
    DATABASE_URL: Joi.string().required(),
    JWT_SECRET: Joi.string().required(),
    JWT_EXPIRES_IN: Joi.string().default('7d'),
    OPENROUTER_API_KEY: Joi.string().optional().allow(''),
    OPENROUTER_MODEL: Joi.string().default('google/gemini-2.0-flash'),
    STRIPE_SECRET_KEY: Joi.string().optional().allow(''),
    STRIPE_WEBHOOK_SECRET: Joi.string().optional().allow(''),
    STRIPE_PRICE_ID_PRO: Joi.string().optional().allow(''),
    STRIPE_PRICE_ID_ENTERPRISE: Joi.string().optional().allow(''),
    SUPABASE_URL: Joi.string().optional().allow(''),
    SUPABASE_ANON_KEY: Joi.string().optional().allow(''),
    SUPABASE_SERVICE_KEY: Joi.string().optional().allow(''),
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
});
exports.appConfig = (0, config_1.registerAs)('app', () => ({
    port: parseInt(process.env.PORT || '3001', 10),
    databaseUrl: process.env.DATABASE_URL || '',
    jwtSecret: process.env.JWT_SECRET || '',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    openRouterApiKey: process.env.OPENROUTER_API_KEY || '',
    openRouterModel: process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash',
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    stripePriceIdPro: process.env.STRIPE_PRICE_ID_PRO || '',
    stripePriceIdEnterprise: process.env.STRIPE_PRICE_ID_ENTERPRISE || '',
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || '',
    nodeEnv: process.env.NODE_ENV || 'development',
}));
//# sourceMappingURL=app.config.js.map