import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { POST } from '@/app/api/portfolio/route';

// Mock Prisma
const mockPrisma = {
  etf: {
    upsert: mock(),
  },
  portfolioItem: {
    findUnique: mock(),
    count: mock(),
    updateMany: mock(),
    create: mock(),
  },
  $transaction: mock((args) => Promise.all(args)),
};

// Mock `lib/db` to return our mockPrisma
mock.module('@/lib/db', () => ({
  default: mockPrisma,
}));

describe('POST /api/portfolio', () => {
    beforeEach(() => {
        // Reset mocks before each test
        mockPrisma.etf.upsert.mockReset();
        mockPrisma.portfolioItem.findUnique.mockReset();
        mockPrisma.portfolioItem.count.mockReset();
        mockPrisma.portfolioItem.updateMany.mockReset();
        mockPrisma.portfolioItem.create.mockReset();
        mockPrisma.$transaction.mockReset();
        // Default implementations
        mockPrisma.etf.upsert.mockResolvedValue({});
        mockPrisma.portfolioItem.findUnique.mockResolvedValue(null); // Not in portfolio
        mockPrisma.portfolioItem.count.mockResolvedValue(0);
        mockPrisma.portfolioItem.create.mockResolvedValue({});
        mockPrisma.portfolioItem.updateMany.mockResolvedValue({});
    });

  it('should handle NaN values for price and changePercent by defaulting to 0', async () => {
    const body = {
      ticker: 'TEST',
      name: 'Test ETF',
      price: NaN,
      changePercent: undefined,
      assetType: 'ETF',
    };

    const request = new Request('http://localhost/api/portfolio', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(request as any);

    // Check if the response is successful
    expect(response.status).toBe(201);

    // Verify Prisma upsert was called with default 0s
    const upsertCall = mockPrisma.etf.upsert.mock.calls[0];
    const createData = upsertCall[0].create;

    expect(createData.price.toString()).toBe('0');
    expect(createData.daily_change.toString()).toBe('0');
  });

  it('should handle empty string values for price and changePercent by defaulting to 0', async () => {
    const body = {
      ticker: 'TEST_EMPTY',
      name: 'Test ETF Empty',
      price: '',
      changePercent: '',
      assetType: 'ETF',
    };

    const request = new Request('http://localhost/api/portfolio', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(request as any);

    expect(response.status).toBe(201);

    const upsertCall = mockPrisma.etf.upsert.mock.calls[0];
    const createData = upsertCall[0].create;

    expect(createData.price.toString()).toBe('0');
    expect(createData.daily_change.toString()).toBe('0');
  });

  it('should handle regular values correctly', async () => {
     const body = {
      ticker: 'AAPL',
      name: 'Apple Inc.',
      price: 150.50,
      changePercent: 1.25,
      assetType: 'STOCK',
    };

    const request = new Request('http://localhost/api/portfolio', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(request as any);
    expect(response.status).toBe(201);

    const upsertCall = mockPrisma.etf.upsert.mock.calls[0];
    const createData = upsertCall[0].create;

    expect(createData.price.toString()).toBe('150.5');
    expect(createData.daily_change.toString()).toBe('1.25');
  });
});
