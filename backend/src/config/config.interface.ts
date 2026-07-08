export interface AppConfig {
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  openRouterApiKey: string;
  openRouterModel: string;
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  stripePriceIdPro: string;
  stripePriceIdEnterprise: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceKey: string;
  nodeEnv: string;
  googleClientId: string;
  googleClientSecret: string;
  frontendUrl: string;
  resendApiKey: string;
  resendFromEmail: string;
}

export interface Config {
  app: AppConfig;
}
