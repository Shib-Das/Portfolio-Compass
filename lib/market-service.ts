import { Decimal } from '@/lib/decimal';
import {
    getStockProfile,
    getEtfBreakdown,
    getHistoricalData,
    type StockProfile,
    type EtfBreakdown,
    type HistoricalQuote
} from './scrapers/stock-analysis';
import pLimit from 'p-limit';

// -----------------------------------------------------------------------------
// Type Definitions
// -----------------------------------------------------------------------------

export interface MarketSnapshot {
  ticker: string;
  price: Decimal;
  dailyChange: Decimal;
  dailyChangePercent: Decimal;
  name: string;
  assetType: 'STOCK' | 'ETF';
}

export interface EtfDetails {
  ticker: string;
  price: Decimal;
  dailyChange: Decimal;
  name: string;
  description: string;
  assetType: 'STOCK' | 'ETF';
  expenseRatio?: Decimal;
  dividendYield?: Decimal;
  dividendGrowth5Y?: Decimal;
  beta5Y?: Decimal;
  peRatio?: Decimal;
  forwardPe?: Decimal;
  fiftyTwoWeekHigh?: Decimal;
  fiftyTwoWeekLow?: Decimal;
  sectors: Record<string, Decimal>;
  topHoldings?: { ticker: string; name: string; sector: string | null; weight: Decimal }[];
  history: {
    date: string;
    close: Decimal;
    interval?: string;
  }[];
  // Expanded Metrics
  marketCap?: Decimal;
  revenue?: Decimal;
  netIncome?: Decimal;
  eps?: Decimal;
  sharesOutstanding?: Decimal;
  volume?: Decimal;
  open?: Decimal;
  previousClose?: Decimal;
  daysRange?: string;
  fiftyTwoWeekRange?: string;
  beta?: Decimal;
  earningsDate?: string;
  dividend?: Decimal;
  exDividendDate?: string;
  inceptionDate?: string;
  payoutFrequency?: string;
  payoutRatio?: Decimal;
  holdingsCount?: number;
}

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

function toDecimal(val: number | undefined): Decimal | undefined {
    return val !== undefined ? new Decimal(val) : undefined;
}

function ensureDecimal(val: number | undefined): Decimal {
    return new Decimal(val || 0);
}

// -----------------------------------------------------------------------------
// Core Functions
// -----------------------------------------------------------------------------

export async function fetchMarketSnapshot(tickers: string[]): Promise<MarketSnapshot[]> {
  if (tickers.length === 0) return [];

  // Concurrency limit to avoid hitting rate limits
  const limit = pLimit(5);

  const promises = tickers.map(ticker => limit(async () => {
      try {
          const profile = await getStockProfile(ticker);
          if (!profile) return null;

          return {
              ticker: ticker, // Return requested ticker to maintain mapping
              price: ensureDecimal(profile.price),
              dailyChange: ensureDecimal(profile.change),
              dailyChangePercent: ensureDecimal(profile.changePercent),
              name: profile.description ? (profile.description.split('.')[0] || ticker) : ticker,
              assetType: profile.assetType || 'STOCK'
          };
      } catch (e) {
          console.warn(`Failed to fetch snapshot for ${ticker}`, e);
          return null;
      }
  }));

  const results = await Promise.all(promises);
  return results.filter((r): r is MarketSnapshot => r !== null);
}

export async function fetchEtfDetails(
  ticker: string,
  fromDate?: Date,
  intervals: ('1h' | '1d' | '1wk' | '1mo')[] = ['1h', '1d', '1wk', '1mo']
): Promise<EtfDetails> {

  // 1. Fetch Profile (Basic Info + Price)
  const profile = await getStockProfile(ticker);
  if (!profile) {
      throw new Error(`Failed to fetch details for ${ticker}`);
  }

  // 2. Fetch Breakdown (Holdings + Sectors) - Only relevant for ETFs really, but we try for both
  let sectors: Record<string, Decimal> = {};
  let topHoldings: { ticker: string; name: string; sector: string | null; weight: Decimal }[] = [];

  if (profile.assetType === 'ETF') {
      try {
          const breakdown = await getEtfBreakdown(ticker);

          // Map Sectors
          Object.entries(breakdown.sectors).forEach(([sec, weight]) => {
              sectors[sec] = new Decimal(weight); // Weight is 0-1
          });

          // Map Holdings
          topHoldings = breakdown.holdings.slice(0, 50).map(h => ({
              ticker: h.symbol,
              name: h.name,
              sector: null, // Not provided by this scraper
              weight: new Decimal(h.weight * 100)
          }));

      } catch (e) {
          console.warn(`Failed to fetch ETF breakdown for ${ticker}`, e);
      }
  } else {
      // For stocks, single sector
      if (profile.sector) {
          sectors[profile.sector] = new Decimal(1.0);
      }
  }

  // 3. Fetch History
  // We only support '1d' effectively via scraping.
  // However, we fetch data once and duplicate it for all requested intervals to satisfy the API contract.
  // This ensures that if the frontend requests '1wk', it gets *some* data (the daily data aliased as weekly)
  // rather than an empty array, preventing chart crashes.

  let historyData: HistoricalQuote[] = [];
  try {
      historyData = await getHistoricalData(ticker);
  } catch (e) {
      console.warn(`Failed to fetch history for ${ticker}`, e);
  }

  // Flatten logic: The fetched history is daily.
  // We will map this same dataset to every requested interval.
  const history = intervals.flatMap(interval =>
      historyData.map(h => ({
          date: h.date, // ISO string YYYY-MM-DD
          close: new Decimal(h.close),
          interval: interval // Explicitly set to the requested interval
      }))
  );

  // Construct Result
  return {
    ticker: ticker,
    price: ensureDecimal(profile.price),
    dailyChange: ensureDecimal(profile.changePercent), // Map changePercent to dailyChange for UI
    name: profile.description ? (profile.description.split('.')[0] || ticker) : ticker,
    description: profile.description,
    assetType: profile.assetType || 'STOCK',

    expenseRatio: toDecimal(profile.expenseRatio),
    dividendYield: toDecimal(profile.dividendYield),
    dividendGrowth5Y: toDecimal(profile.dividendGrowth5Y),
    beta5Y: toDecimal(profile.beta), // Map beta to beta5Y
    peRatio: toDecimal(profile.peRatio),
    forwardPe: toDecimal(profile.forwardPe),
    fiftyTwoWeekHigh: toDecimal(profile.fiftyTwoWeekHigh),
    fiftyTwoWeekLow: toDecimal(profile.fiftyTwoWeekLow),

    sectors,
    topHoldings,
    history,

    marketCap: toDecimal(profile.marketCap),
    revenue: toDecimal(profile.revenue),
    netIncome: toDecimal(profile.netIncome),
    eps: toDecimal(profile.eps),
    sharesOutstanding: toDecimal(profile.sharesOutstanding),
    volume: toDecimal(profile.volume),
    open: toDecimal(profile.open),
    previousClose: toDecimal(profile.previousClose),
    daysRange: profile.daysRange,
    fiftyTwoWeekRange: profile.fiftyTwoWeekRange,
    beta: toDecimal(profile.beta),
    earningsDate: profile.earningsDate,
    dividend: toDecimal(profile.dividend),
    exDividendDate: profile.exDividendDate,
    inceptionDate: profile.inceptionDate,
    payoutFrequency: profile.payoutFrequency,
    payoutRatio: toDecimal(profile.payoutRatio),
    holdingsCount: profile.holdingsCount
  };
}
