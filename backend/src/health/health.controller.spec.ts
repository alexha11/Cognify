import { ServiceUnavailableException } from '@nestjs/common';
import { HealthController } from './health.controller';
import { asPrisma, createPrismaMock } from '../testing/prisma.mock';

describe('HealthController', () => {
  it('reports ok when the database answers', async () => {
    const prisma = createPrismaMock();
    prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

    await expect(
      new HealthController(asPrisma(prisma)).check(),
    ).resolves.toEqual({ status: 'ok', database: 'up' });
  });

  it('answers 503 when the database does not', async () => {
    const prisma = createPrismaMock();
    prisma.$queryRaw.mockRejectedValue(new Error('connection refused'));

    await expect(
      new HealthController(asPrisma(prisma)).check(),
    ).rejects.toThrow(ServiceUnavailableException);
  });
});
