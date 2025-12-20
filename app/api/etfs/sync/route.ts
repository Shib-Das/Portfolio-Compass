import { NextRequest, NextResponse } from 'next/server';
import { syncEtfDetails } from '@/lib/etf-sync';
import { EtfHistory, Holding } from '@prisma/client';
import { Decimal } from 'decimal.js';


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ticker } = body;

    if (!ticker) {
      return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
    }

    const fullEtf = await syncEtfDetails(ticker);

    if (!fullEtf) {
      return NextResponse.json({ error: 'Failed to sync ETF' }, { status: 404 });
    }

    // Map to frontend ETF interface
    // Convert all Decimals to numbers for frontend (Option A)
    const formattedEtf = {
      ticker: fullEtf.ticker,
      name: fullEtf.name,
      price: Number(fullEtf.price),
      changePercent: Number(fullEtf.daily_change),
      isDeepAnalysisLoaded: fullEtf.isDeepAnalysisLoaded,
      history: fullEtf.history.map((h: EtfHistory) => ({
        date: h.date.toISOString(),
        price: Number(h.close),
        interval: h.interval || undefined // Ensure undefined if null for Zod
      })),
      metrics: {
        yield: fullEtf.yield ? Number(fullEtf.yield) : 0,
        mer: fullEtf.mer ? Number(fullEtf.mer) : 0
      },
      allocation: {
        equities: fullEtf.allocation?.stocks_weight ? Number(fullEtf.allocation.stocks_weight) : 0,
        bonds: fullEtf.allocation?.bonds_weight ? Number(fullEtf.allocation.bonds_weight) : 0,
        cash: fullEtf.allocation?.cash_weight ? Number(fullEtf.allocation.cash_weight) : 0,
      },
      sectors: fullEtf.sectors.reduce((acc: { [key: string]: number }, sector) => {
        acc[sector.sector_name] = Number(sector.weight)
        return acc
      }, {} as { [key: string]: number }),
      assetType: fullEtf.assetType,
      // Pass existing holdings or fallback to empty array
      // This is not explicitly required by the schema if optional, but good for completeness
      // IF holding data exists in fullEtf
      // syncEtfDetails returns type 'Etf & { history: ..., sectors: ..., allocation: ..., holdings: ... }'
      // Note: `fullEtf.holdings` exists if syncEtfDetails returns it (it does include it).
      // However, the `ETF` interface on frontend might not have `holdings` defined?
      // `types/index.ts` check:
      // "export interface ETF { ... }" - I previously checked and it didn't seem to have `holdings`.
      // BUT `app/api/etfs/search/route.ts` doesn't return it either.
      // If `ETFDetailsDrawer` relies on `sectors` (it does), we are fine.
      // If `ETFDetailsDrawer` relies on `metrics.yield`, we are fine.

      // Let's add dividendHistory just in case, though syncEtfDetails (via fetchEtfDetails) returns it in `details` but DOES NOT persist it to DB in a way that is easily retrieved here unless we add a relation?
      // `Etf` model does NOT have `dividendHistory` relation!
      // `fetchEtfDetails` returns it in the result object, but `syncEtfDetails` only persists specific fields.
      // `syncEtfDetails` returns the *Prisma Object* `fullEtf`.
      // The Prisma Object does NOT have `dividendHistory`.
      // So `fullEtf.dividendHistory` is undefined.
      // So we can't return it here unless we change `syncEtfDetails` to return the `details` object too, or persist dividends.
      // Given the schema allows optional, we leave it out.
    };

    return NextResponse.json(formattedEtf);

  } catch (error: any) {
    console.error('Error syncing ETF:', error);
    if (error.message === 'Ticker not found') {
      return NextResponse.json({ error: 'Ticker not found', deleted: true }, { status: 404 });
    }
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
