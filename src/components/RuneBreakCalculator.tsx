// C:/AntigravityWorkspace/pd2s/src/components/RuneBreakCalculator.tsx
import React, { useState, useMemo } from 'react';
import { Calculator, ArrowRightLeft } from 'lucide-react';
import { HIGH_RUNE_CATALOG } from '../constants/defaultWatchlist';

interface RuneBreakCalculatorProps {
  runePriceMap: Record<string, number>;
}

const BREAK_RECIPES: Record<
  string,
  Array<{ label: string; parts: Array<{ code: string; qty: number }> }>
> = {
  r33: [
    { label: 'Cham × 2', parts: [{ code: 'r32', qty: 2 }] },
    { label: 'Ber + Jah', parts: [{ code: 'r30', qty: 1 }, { code: 'r31', qty: 1 }] },
  ],
  r32: [
    { label: 'Jah + Ohm', parts: [{ code: 'r31', qty: 1 }, { code: 'r27', qty: 1 }] },
    { label: 'Sur × 2', parts: [{ code: 'r29', qty: 2 }] },
  ],
  r31: [
    { label: 'Lo + Ohm', parts: [{ code: 'r28', qty: 1 }, { code: 'r27', qty: 1 }] },
    { label: 'Sur + Vex', parts: [{ code: 'r29', qty: 1 }, { code: 'r26', qty: 1 }] },
  ],
  r30: [
    { label: 'Sur × 2 (큐빙 정석)', parts: [{ code: 'r29', qty: 2 }] },
    { label: 'Jah + Lo', parts: [{ code: 'r31', qty: 1 }, { code: 'r28', qty: 1 }] },
    { label: 'Lo × 3', parts: [{ code: 'r28', qty: 3 }] },
  ],
  r29: [
    { label: 'Lo + Vex', parts: [{ code: 'r28', qty: 1 }, { code: 'r26', qty: 1 }] },
    { label: 'Ohm × 2', parts: [{ code: 'r27', qty: 2 }] },
  ],
  r28: [
    { label: 'Ohm + Gul', parts: [{ code: 'r27', qty: 1 }, { code: 'r25', qty: 1 }] },
    { label: 'Vex × 2', parts: [{ code: 'r26', qty: 2 }] },
  ],
  r27: [
    { label: 'Vex + Gul', parts: [{ code: 'r26', qty: 1 }, { code: 'r25', qty: 1 }] },
    { label: 'Gul × 3', parts: [{ code: 'r25', qty: 3 }] },
  ],
  r26: [
    { label: 'Gul × 2 (큐빙 정석)', parts: [{ code: 'r25', qty: 2 }] },
    { label: 'Ist × 3 + Mal', parts: [{ code: 'r24', qty: 3 }, { code: 'r23', qty: 1 }] },
  ],
};

export const RuneBreakCalculator: React.FC<RuneBreakCalculatorProps> = React.memo(
  ({ runePriceMap }) => {
    const [targetRune, setTargetRune] = useState('r30'); // 기본 Ber Rune

    const selectedMeta = useMemo(
      () => HIGH_RUNE_CATALOG.find((r) => r.baseCode === targetRune) || HIGH_RUNE_CATALOG[3],
      [targetRune]
    );

    const targetHr = runePriceMap[targetRune] ?? selectedMeta.standardHrRef;
    const wssHr = runePriceMap['wss'] || 0.01;
    const wssEquivalent = Math.round(targetHr / wssHr);

    const recipes = BREAK_RECIPES[targetRune] || [
      { label: 'WSS 일괄 환산', parts: [] },
    ];

    return (
      <div className="shrink-0 rounded-xl border border-amber-500/20 bg-[#15131b] p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-100">
              실시간 룬 쪼개기(Break) & WSS 환산 계산기
            </h3>
          </div>

          <select
            value={targetRune}
            onChange={(e) => setTargetRune(e.target.value)}
            className="rounded border border-gray-700 bg-[#1c1926] px-2.5 py-1 text-xs font-semibold text-amber-300"
          >
            {HIGH_RUNE_CATALOG.slice(0, 10).map((r) => (
              <option key={r.baseCode} value={r.baseCode}>
                {r.name} ({runePriceMap[r.baseCode] ?? r.standardHrRef} HR)
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {/* WSS 환산 카드 */}
          <div className="rounded-lg border border-gray-800 bg-[#1b1824] p-3">
            <div className="text-[11px] text-gray-400">
              1 {selectedMeta.shortName} 룬 = WSS 몇 개?
            </div>
            <div className="mt-1 font-mono text-base font-bold text-red-300">
              ≈ {wssEquivalent.toLocaleString()} WSS
            </div>
            <div className="mt-0.5 text-[10px] text-gray-500">
              (현재 1 WSS = {wssHr} HR 기준)
            </div>
          </div>

          {/* 하위 룬 조합 비교 카드 */}
          {recipes.map((rec, idx) => {
            const sumPartsHr = rec.parts.reduce((acc, p) => {
              const fallback =
                HIGH_RUNE_CATALOG.find((c) => c.baseCode === p.code)?.standardHrRef || 0;
              const unit = runePriceMap[p.code] ?? fallback;
              return acc + unit * p.qty;
            }, 0);
            const diff = Number((sumPartsHr - targetHr).toFixed(2));

            return (
              <div
                key={idx}
                className="flex flex-col justify-between rounded-lg border border-gray-800 bg-[#1b1824] p-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 font-semibold text-gray-200">
                    <ArrowRightLeft className="h-3 w-3 text-purple-400" />
                    {rec.label}
                  </span>
                  <span className="font-mono font-bold text-amber-300">
                    {sumPartsHr.toFixed(2)} HR
                  </span>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[11px]">
                  <span className="text-gray-400">단일 룬({targetHr} HR) 대비:</span>
                  <span
                    className={`font-mono font-semibold ${
                      diff > 0
                        ? 'text-emerald-400'
                        : diff < 0
                        ? 'text-rose-400'
                        : 'text-gray-400'
                    }`}
                  >
                    {diff > 0 ? `+${diff} HR (쪼개기 유리)` : diff < 0 ? `${diff} HR` : '동일 가치'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);
