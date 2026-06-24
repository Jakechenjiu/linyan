import { mockDeep, type DeepMockProxy } from 'vitest-mock-extended'
import type { PrismaClient } from '@prisma/client'

export type MockPrisma = DeepMockProxy<PrismaClient>

export function createPrismaMock(): MockPrisma {
  return mockDeep<PrismaClient>()
}
