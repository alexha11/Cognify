import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private pool: Pool;

  constructor() {
    const connectionString = process.env.DATABASE_URL;

    // Remote connections (like Supabase) REQUIRE SSL
    // Local connections (localhost/127.0.0.1) should NOT use SSL
    const isLocal =
      connectionString?.includes('localhost') ||
      connectionString?.includes('127.0.0.1') ||
      connectionString?.includes('postgres:5432'); // Docker internal

    const pool = new Pool({
      connectionString,
      // Increased timeouts for slow/IPv6 connections
      connectionTimeoutMillis: 60000, // 60 seconds (Prisma Studio can connect, so we need more time)
      idleTimeoutMillis: 30000,
      // Connection pool settings
      max: 10,
      min: 2,
      // Keep-alive to prevent connection drops
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
      ssl: isLocal ? false : { rejectUnauthorized: false },
    });

    pool.on('error', (err) => {
      // Use a static logger since `this` is not available in constructor before super()
      Logger.error(
        'Unexpected error on idle client',
        err.stack,
        PrismaService.name,
      );
    });

    pool.on('connect', () => {
      Logger.log('New client connected to pool', PrismaService.name);
    });

    const adapter = new PrismaPg(pool);
    super({ adapter });
    this.pool = pool;

    this.logger.log(
      `Connecting to: ${connectionString?.split('@')[1] || 'Unknown'} (SSL: ${isLocal ? 'OFF' : 'ON'})`,
    );
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    await this.pool.end();
  }
}
