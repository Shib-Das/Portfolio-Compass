import { Holding } from '@prisma/client';
import { cn } from '@/lib/utils';

interface TopHoldingsListProps {
  holdings: Holding[];
}

export default function TopHoldingsList({ holdings }: TopHoldingsListProps) {
  if (!holdings || holdings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[250px] text-neutral-500">
        <p>No holdings data available</p>
      </div>
    );
  }

  // Ensure sorted by weight
  const sortedHoldings = [...holdings].sort((a, b) => Number(b.weight) - Number(a.weight));

  return (
    <div className="h-[300px] overflow-y-auto pr-2 custom-scrollbar">
      <table className="w-full text-left border-collapse">
        <thead className="sticky top-0 bg-[#121212] z-10 text-xs text-neutral-500 uppercase tracking-wider">
          <tr>
            <th className="pb-2 pl-2">Symbol</th>
            <th className="pb-2">Name</th>
            <th className="pb-2 text-right pr-2">%</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {sortedHoldings.map((h, i) => (
            <tr
              key={h.id || `${h.ticker}-${i}`}
              className={cn(
                "border-b border-white/5 transition-colors hover:bg-white/5",
                i % 2 === 0 ? "bg-white/[0.02]" : "bg-transparent"
              )}
            >
              <td className="py-2 pl-2 font-medium text-emerald-400">
                {h.ticker}
              </td>
              <td className="py-2 text-neutral-300 max-w-[150px] truncate" title={h.name}>
                {h.name}
              </td>
              <td className="py-2 text-right pr-2 font-mono text-neutral-400">
                {Number(h.weight).toFixed(2)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
