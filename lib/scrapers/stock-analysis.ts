import * as cheerio from 'cheerio';

// -----------------------------------------------------------------------------
// Caching & Resilience
// -----------------------------------------------------------------------------

const CACHE_TTL_MS = 60 * 1000; // 60 seconds
const CACHE_SIZE = 500;

interface CacheEntry {
    data: any;
    timestamp: number;
}

const memoryCache = new Map<string, CacheEntry>();

function getFromCache<T>(key: string): T | null {
    const entry = memoryCache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
        memoryCache.delete(key);
        return null;
    }
    return entry.data as T;
}

function setInCache(key: string, data: any) {
    if (memoryCache.size >= CACHE_SIZE) {
        // Simple eviction
        const firstKey = memoryCache.keys().next().value;
        if(firstKey) memoryCache.delete(firstKey);
    }
    memoryCache.set(key, { data, timestamp: Date.now() });
}

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function retryWithBackoff(fn: () => Promise<Response>, retries = 3, baseDelay = 1000): Promise<Response> {
    let attempt = 0;
    while (attempt < retries) {
        try {
            const res = await fn();
            if (res.ok) return res;
            if (res.status === 404) return res;
            if (res.status === 429) {
                const delay = baseDelay * Math.pow(2, attempt) + (Math.random() * 500);
                console.warn(`[StockAnalysis] Rate limit 429. Retrying in ${Math.round(delay)}ms...`);
                await sleep(delay);
                attempt++;
                continue;
            }
            throw new Error(`HTTP ${res.status} ${res.statusText}`);
        } catch (e: any) {
            attempt++;
            if (attempt >= retries) throw e;
            const delay = baseDelay * Math.pow(2, attempt);
            await sleep(delay);
        }
    }
    throw new Error('Max retries exceeded');
}

const fetchWithUserAgent = async (u: string) => {
    const cached = getFromCache<string>(u);
    if (cached) {
        return {
            ok: true,
            status: 200,
            text: async () => cached,
            json: async () => JSON.parse(cached)
        } as unknown as Response;
    }

    const response = await retryWithBackoff(() => fetch(u, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        }
    }));

    if (response.ok) {
        const text = await response.text();
        setInCache(u, text);
        return {
            ok: true,
            status: 200,
            text: async () => text,
            json: async () => JSON.parse(text)
        } as unknown as Response;
    }

    return response;
};

function parseNumber(val: string): number {
    if (!val) return 0;
    const clean = val.replace(/,/g, '');
    return parseFloat(clean);
}

function parseMarketNumber(val: string): number | undefined {
    if (!val) return undefined;
    val = val.toUpperCase().replace('$', '').replace(/,/g, '');
    let multiplier = 1;
    if (val.endsWith('T')) {
        multiplier = 1e12;
        val = val.slice(0, -1);
    } else if (val.endsWith('B')) {
        multiplier = 1e9;
        val = val.slice(0, -1);
    } else if (val.endsWith('M')) {
        multiplier = 1e6;
        val = val.slice(0, -1);
    } else if (val.endsWith('K')) {
        multiplier = 1e3;
        val = val.slice(0, -1);
    }
    const num = parseFloat(val);
    if (isNaN(num)) return undefined;
    return num * multiplier;
}

function parseDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
}

// -----------------------------------------------------------------------------
// Type Definitions
// -----------------------------------------------------------------------------

export interface StockProfile {
  sector: string;
  industry: string;
  description: string;
  assetType?: 'STOCK' | 'ETF';
  analyst?: {
    summary: string;
    consensus: string;
    targetPrice: number | null;
    targetUpside: number | null;
  };
  marketCap?: number;
  revenue?: number;
  netIncome?: number;
  sharesOutstanding?: number;
  eps?: number;
  peRatio?: number;
  forwardPe?: number;
  dividend?: number;
  dividendYield?: number;
  dividendGrowth5Y?: number;
  exDividendDate?: string;
  volume?: number;
  open?: number;
  previousClose?: number;
  daysRange?: string;
  fiftyTwoWeekRange?: string;
  beta?: number;
  earningsDate?: string;
  fiftyTwoWeekLow?: number;
  fiftyTwoWeekHigh?: number;
  expenseRatio?: number;
  inceptionDate?: string;
  payoutFrequency?: string;
  payoutRatio?: number;
  holdingsCount?: number;
  bondMaturity?: number;
  bondDuration?: number;
  price?: number;
  change?: number;
  changePercent?: number;
}

export interface ScrapedHolding {
    symbol: string;
    name: string;
    weight: number;
    shares: number | null;
}

export interface HistoricalQuote {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    adjClose?: number;
}

export interface EtfBreakdown {
    sectors: Record<string, number>;
    holdings: ScrapedHolding[];
    assetAllocation: Record<string, number>;
}

// -----------------------------------------------------------------------------
// Core Scraping Functions
// -----------------------------------------------------------------------------

export async function getMarketMovers(type: 'gainers' | 'losers'): Promise<string[]> {
    const url = `https://stockanalysis.com/markets/${type}/`;
    const response = await fetchWithUserAgent(url);
    if (!response.ok) return [];
    const html = await response.text();
    const $ = cheerio.load(html);
    const tickers: string[] = [];
    $('table').each((_, table) => {
        const headers = $(table).find('th').map((_, th) => $(th).text().trim()).get();
        if (headers.includes('Symbol') && headers.includes('% Change')) {
            const symbolIndex = headers.indexOf('Symbol');
            if (symbolIndex > -1) {
                 $(table).find('tbody tr').each((_, tr) => {
                    const symbolCell = $(tr).find('td').eq(symbolIndex);
                    const ticker = symbolCell.text().trim();
                    if (ticker) tickers.push(ticker);
                 });
            }
        }
    });
    return tickers;
}

/**
 * Helper to safely extract SvelteKit data using Regex instead of new Function.
 */
function extractSvelteDataSafe(html: string): any[] | null {
    // Deprecated for security, keeping signature
    return null;
}

export async function getEtfBreakdown(ticker: string): Promise<EtfBreakdown> {
    const url = `https://stockanalysis.com/etf/${ticker.toLowerCase()}/holdings/`;
    const response = await fetchWithUserAgent(url);

    const breakdown: EtfBreakdown = {
        sectors: {},
        holdings: [],
        assetAllocation: {}
    };

    if (!response.ok) return breakdown;

    const html = await response.text();
    const $ = cheerio.load(html);

    // Parse Holdings Table
    const holdingsTable = $('table').filter((_, t) => {
        const h = $(t).find('th').text();
        return h.includes('Symbol') && h.includes('Weight');
    }).first();

    if (holdingsTable.length) {
        const headers = holdingsTable.find('th').map((_, th) => $(th).text().trim()).get();
        const symbolIdx = headers.indexOf('Symbol');
        const nameIdx = headers.indexOf('Name');
        const weightIdx = headers.indexOf('% Weight');
        const sharesIdx = headers.indexOf('Shares');

        holdingsTable.find('tbody tr').each((_, tr) => {
            const tds = $(tr).find('td');
            const symbol = tds.eq(symbolIdx).text().trim();
            const name = tds.eq(nameIdx).text().trim();
            const weightStr = tds.eq(weightIdx).text().trim();
            const sharesStr = tds.eq(sharesIdx).text().trim();

            const weight = parseFloat(weightStr.replace('%', '')) / 100;
            const shares = sharesStr ? parseInt(sharesStr.replace(/,/g, ''), 10) : null;

            if (symbol) {
                breakdown.holdings.push({ symbol, name, weight, shares });
            }
        });
    }

    // Parse Sector Table
    $('h2, h3, h4').each((_, h) => {
        if ($(h).text().trim().includes('Sector')) {
            const table = $(h).nextAll('table').first();
            if (table.length) {
                table.find('tbody tr').each((_, tr) => {
                    const name = $(tr).find('td').first().text().trim();
                    const val = $(tr).find('td').last().text().trim();
                    const weight = parseFloat(val.replace('%', '')) / 100;
                    if (name && !isNaN(weight)) {
                        breakdown.sectors[name] = weight;
                    }
                });
            }
        }
    });

    // Parse Asset Allocation
    const scriptContent = $('script').text();
    const allocMatch = scriptContent.match(/asset_allocation\s*:\s*\[(.*?)\]/);
    if (allocMatch) {
        const matches = allocMatch[1].matchAll(/key:"([^"]+)",value:([\d.]+)/g);
        for (const m of matches) {
            breakdown.assetAllocation[m[1]] = parseFloat(m[2]) / 100;
        }
    }

    return breakdown;
}

export async function getStockProfile(ticker: string): Promise<StockProfile | null> {
  let upperTicker = ticker.toUpperCase();
  let url = `https://stockanalysis.com/stocks/${ticker.toLowerCase()}/`;
  let isEtf = false;

  let response = await fetchWithUserAgent(url);
  if (response.status === 404) {
    url = `https://stockanalysis.com/etf/${ticker.toLowerCase()}/`;
    response = await fetchWithUserAgent(url);
    if (response.ok) isEtf = true;
  }
  // Handle TSX/NEO fallback logic...
  if (response.status === 404 && ticker.includes('.')) {
      const [base, suffix] = ticker.split('.');
      if (suffix?.toUpperCase() === 'TO') url = `https://stockanalysis.com/quote/tsx/${base.toLowerCase()}/`;
      else if (suffix?.toUpperCase() === 'NE') url = `https://stockanalysis.com/quote/neo/${base.toLowerCase()}/`;
      response = await fetchWithUserAgent(url);
      if (response.ok) { isEtf = true; upperTicker = base.toUpperCase(); }
  }

  if (!response.ok) return null;

  const html = await response.text();
  const $ = cheerio.load(html);

  const metrics: Partial<StockProfile> = { assetType: isEtf ? 'ETF' : 'STOCK' };

  // Regex extract price/change from script to be fast
  const scriptContent = $('script').text();
  const quoteMatch = scriptContent.match(/quote\s*:\s*\{([^}]+)\}/);
  if (quoteMatch) {
      const inner = quoteMatch[1];
      const pMatch = inner.match(/p:([\d.-]+)/);
      const cMatch = inner.match(/c:([\d.-]+)/);
      const cpMatch = inner.match(/cp:([\d.-]+)/);

      if (pMatch) metrics.price = parseFloat(pMatch[1]);
      if (cMatch) metrics.change = parseFloat(cMatch[1]);
      if (cpMatch) metrics.changePercent = parseFloat(cpMatch[1]);
  }

  // Fallback to DOM for price if regex failed
  if (metrics.price === undefined) {
      const priceText = $('div[class*="text-4xl"]').first().text().trim();
      if (priceText) metrics.price = parseNumber(priceText);
  }

  // --- Cheerio Parsing for details ---
  const extractLabelValue = (labels: string[]): string | undefined => {
      let val: string | undefined;
      $('span, div, td, th').each((_, el) => {
        if (val) return;
        const text = $(el).text().trim();
        if (labels.includes(text) || labels.some(l => text.startsWith(l + ':'))) {
            let next = $(el).next();
            if (next.length && next.text().trim()) { val = next.text().trim(); return; }
            if (text.includes(':')) {
                 const parts = text.split(':');
                 if (parts.length > 1 && parts[1].trim()) { val = parts[1].trim(); return; }
            }
        }
      });
      return val;
  };

  metrics.sector = extractLabelValue(['Sector', 'Asset Class']) || '';
  metrics.industry = extractLabelValue(['Industry', 'Category']) || '';

  // Description
  let description = '';
  $('h2, h3').each((_, el) => {
      if (description) return;
      const headerText = $(el).text().trim();
      if (headerText.includes(`About ${upperTicker}`)) {
          let next = $(el).next();
          if (next.is('div')) description = next.text().trim();
          else if (next.is('p')) description = next.text().trim();
      }
  });
  if (description) metrics.description = description.replace(/\[Read more\]/g, '').trim();

  // Financials from Table
  const extractValue = (label: string): string | undefined => {
    let val: string | undefined;
    $('tr').each((_, tr) => {
        if (val) return;
        const cells = $(tr).find('td, th');
        cells.each((i, cell) => {
            if ($(cell).text().trim() === label && i + 1 < cells.length) {
                val = $(cells[i+1]).text().trim();
            }
        });
    });
    return val;
  };

  const rawMarketCap = extractValue('Market Cap') || extractValue('Assets');
  if (rawMarketCap) metrics.marketCap = parseMarketNumber(rawMarketCap);

  const rawRevenue = extractValue('Revenue (ttm)');
  if (rawRevenue) metrics.revenue = parseMarketNumber(rawRevenue);

  const rawNetIncome = extractValue('Net Income (ttm)');
  if (rawNetIncome) metrics.netIncome = parseMarketNumber(rawNetIncome);

  const rawShares = extractValue('Shares Out');
  if (rawShares) metrics.sharesOutstanding = parseMarketNumber(rawShares);

  const rawPe = extractValue('PE Ratio');
  if (rawPe) metrics.peRatio = parseNumber(rawPe);

  const rawDiv = extractValue('DividendYield');
  if (!metrics.dividendYield) {
      const y = extractValue('Dividend Yield');
      if (y) metrics.dividendYield = parseFloat(y.replace('%',''));
  }

  // EPS
  const rawEps = extractValue('EPS (ttm)');
  if (rawEps) metrics.eps = parseNumber(rawEps);

  // Forward PE
  const rawFPe = extractValue('Forward PE');
  if (rawFPe) metrics.forwardPe = parseNumber(rawFPe);

  // Beta
  const rawBeta = extractValue('Beta');
  if (rawBeta) metrics.beta = parseNumber(rawBeta);

  // Expense Ratio
  const rawExp = extractValue('Expense Ratio');
  if (rawExp) metrics.expenseRatio = parseFloat(rawExp.replace('%',''));

  return metrics as StockProfile;
}

export async function getHistoricalData(ticker: string): Promise<HistoricalQuote[]> {
    let url = `https://stockanalysis.com/stocks/${ticker.toLowerCase()}/history/`;
    let response = await fetchWithUserAgent(url);
    if (response.status === 404) {
        url = `https://stockanalysis.com/etf/${ticker.toLowerCase()}/history/`;
        response = await fetchWithUserAgent(url);
    }
    // TSX/NEO fallback...
    if (response.status === 404 && ticker.includes('.')) {
        const [base, suffix] = ticker.split('.');
        if (suffix?.toUpperCase() === 'TO') url = `https://stockanalysis.com/quote/tsx/${base.toLowerCase()}/history/`;
        response = await fetchWithUserAgent(url);
    }

    if (!response.ok) return [];

    const html = await response.text();
    const $ = cheerio.load(html);
    const history: HistoricalQuote[] = [];

    const rows = $('tbody tr');
    rows.each((_, tr) => {
        const tds = $(tr).find('td');
        if (tds.length >= 7) {
            const dateStr = tds.eq(0).text().trim();
            const closeStr = tds.eq(4).text().trim();
            const volumeStr = tds.eq(7).text().trim();

            const date = parseDate(dateStr);
            const close = parseNumber(closeStr);
            const volume = parseNumber(volumeStr);

            if (!isNaN(close)) {
                history.push({
                    date,
                    open: parseNumber(tds.eq(1).text()) || close,
                    high: parseNumber(tds.eq(2).text()) || close,
                    low: parseNumber(tds.eq(3).text()) || close,
                    close,
                    volume: isNaN(volume) ? 0 : volume,
                    adjClose: parseNumber(tds.eq(5).text()) || close
                });
            }
        }
    });
    return history;
}

// Restore Export for Compatibility
export const getEtfHoldings = async (ticker: string) => {
    const breakdown = await getEtfBreakdown(ticker);
    return breakdown.holdings;
};
export const getEtfHoldingsLegacy = getEtfHoldings;
