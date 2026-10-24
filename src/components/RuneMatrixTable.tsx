// C:/AntigravityWorkspace/pd2s/src/components/RuneMatrixTable.tsx
import React, { useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  ArrowUpRight,
  Layers,
} from 'lucide-react';
import {
  AnalyzedItemResult,
  EconomyItemSummary,
  PriceHistoryPoint,
} from '../types/market.types';
import { HIGH_RUNE_CATALOG } from '../constants/defaultWatchlist';

interface RuneMatrixTableProps {
  items: EconomyItemSummary[];
  analyzedMap: Record<string, AnalyzedItemResult>;
  selectedId: string;
  onSelectRune: (item: EconomyItemSummary) => void;
  seasonOnly: boolean;
}

const MiniSparkline: React.FC<{ points: PriceHistoryPoint[]; seasonOnly: boolean }> = React.memo(
  ({ points, seasonOnly }) => {
    const filtered = useMemo(() => {
      const s14 = seasonOnly ? points.filter((p) => p.date >= '2026-10-23') : points;
      const list = s14.length >= 2 ? s14 : points.slice(-10);
      return list;
    }, [points, seasonOnly]);

    if (filtered.length < 2) {
      return <span className="text-[11px] text-gray-500">Day 1 누적중</span>;
    }

    const vals = filtered.map((p) => p.avgPrice);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const range = max - min || 1;
    const width = 76;
    const height = 24;

    const polyPoints = filtered
      .map((pt, idx) => {
        const x = (idx / (filtered.length - 1)) * width;
        const y = height - ((pt.avgPrice - min) / range) * (height - 4) - 2;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

    const isUp = vals[vals.length - 1] >= vals[0];

    return (
      <svg width={width} height={height} className="overflow-visible">
        <polyline
          fill="none"
          stroke={isUp ? '#fbbf24' : '#f87171'}
          strokeWidth="1.75"
          points={polyPoints}
        />
      </svg>
    );
  }
);

export const RuneMatrixTable: React.FC<RuneMatrixTableProps> = React.memo(
  ({ items, analyzedMap, selectedId, onSelectRune, seasonOnly }) => {
    const runes = useMemo(() => items.filter((i) => i.category === 'rune'), [items]);
    const currencies = useMemo(
      () => items.filter((i) => i.category === 'currency'),
      [items]
    );

    const standardRefMap = useMemo(() => {
      const m: Record<string, number> = {};
      for (const r of HIGH_RUNE_CATALOG) {
        m[r.baseCode] = r.standardHrRef;
      }
      return m;
    }, []);

    return (
      <div className="flex flex-col gap-4 shrink-0">
        {/* 1. 하이룬 (Lem ~ Zod) 시세 테이블 */}
        <div className="rounded-xl border border-amber-500/20 bg-[#15131b] shadow-lg overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-800/80 bg-[#1a1722] px-4 py-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <h2 className="text-sm font-bold text-amber-100">
                High Runes 실시간 HR 시세 & 실거래 교환 수단 (Zod ~ Lem)
              </h2>
            </div>
            <span className="text-[11px] text-gray-400">
              행 클릭 시 우측에 실제 거래 완료(Sold) 원문 및 날짜별 추이 표시
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-800 bg-[#121017] text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  <th className="py-2.5 pl-4 pr-2">룬 (Rune)</th>
                  <th className="px-2 py-2.5 text-right">현재 시세 (HR)</th>
                  <th className="px-2 py-2.5 text-right">최근 24h / 표준가</th>
                  <th className="px-3 py-2.5">주요 실거래 교환 수단 (클릭시 상세)</th>
                  <th className="px-2 py-2.5 text-center">시세 추이</th>
                  <th className="py-2.5 pl-2 pr-4 text-right">7d 변동</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {runes.map((rune) => {
                  const isSelected = selectedId === rune.baseCode;
                  const analyzed = analyzedMap[rune.baseCode];
                  const displayHr = analyzed?.currentHr ?? rune.hrValue;
                  const stdRef = standardRefMap[rune.baseCode];
                  const topMethods = analyzed?.topPaymentMethods?.slice(0, 3) || [];

                  return (
                    <tr
                      key={rune.baseCode}
                      onClick={() => onSelectRune(rune)}
                      className={`cursor-pointer transition ${
                        isSelected
                          ? 'bg-amber-500/15 hover:bg-amber-500/20'
                          : 'hover:bg-white/[0.03]'
                      }`}
                    >
                      {/* 룬 아이콘 & 이름 */}
                      <td className="py-2.5 pl-4 pr-2">
                        <div className="flex items-center gap-2.5">
                          {rune.iconUrl ? (
                            <img
                              src={rune.iconUrl}
                              alt={rune.name}
                              className="h-7 w-7 rounded border border-gray-700/80 bg-[#0d0b10] object-contain p-0.5"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-7 w-7 items-center justify-center rounded border border-amber-500/30 bg-amber-500/10 text-[10px] font-bold text-amber-300">
                              {rune.baseCode.toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-amber-200 flex items-center gap-1">
                              {rune.name.replace(' Rune', '')}
                              <span className="text-[10px] font-normal text-gray-500">
                                ({rune.baseCode})
                              </span>
                            </div>
                            {analyzed && (
                              <div className="text-[10px] text-gray-400">
                                매물 {analyzed.liveCount}건 · 완료 {analyzed.soldCount}건
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 현재 시세 (HR) */}
                      <td className="px-2 py-2.5 text-right">
                        <span className="rounded bg-amber-500/15 px-2 py-0.5 font-mono text-sm font-bold text-amber-300 border border-amber-500/30">
                          {displayHr} HR
                        </span>
                      </td>

                      {/* 최근 24h / 표준 참조가 */}
                      <td className="px-2 py-2.5 text-right font-mono text-[11px]">
                        <div className="text-gray-200">
                          24h: {rune.lastDayPrice !== null ? `${rune.lastDayPrice} HR` : '-'}
                        </div>
                        <div className="text-gray-500">기준: {stdRef} HR</div>
                      </td>

                      {/* 주요 실거래 교환 수단 태그 */}
                      <td className="px-3 py-2.5">
                        {topMethods.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {topMethods.map((tag, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 rounded border border-purple-500/30 bg-purple-500/10 px-1.5 py-0.5 text-[11px] text-purple-200"
                              >
                                {tag.label}
                                <span className="text-[10px] text-purple-400">
                                  ({tag.count})
                                </span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 hover:text-amber-300">
                            클릭하여 실거래 원문 분석 <ArrowUpRight className="h-3 w-3" />
                          </span>
                        )}
                      </td>

                      {/* 미니 스파크라인 */}
                      <td className="px-2 py-2.5 text-center">
                        <div className="flex justify-center">
                          <MiniSparkline
                            points={analyzed?.trendPoints || rune.history}
                            seasonOnly={seasonOnly}
                          />
                        </div>
                      </td>

                      {/* 7일 변동률 */}
                      <td className="py-2.5 pl-2 pr-4 text-right font-mono text-xs">
                        {rune.changePercent7d !== null && rune.changePercent7d !== 0 ? (
                          <span
                            className={`inline-flex items-center gap-0.5 font-medium ${
                              rune.changePercent7d > 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {rune.changePercent7d > 0 ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {rune.changePercent7d > 0 ? '+' : ''}
                            {rune.changePercent7d.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-gray-500">
                            <Minus className="h-3 w-3" /> 0%
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. 핵심 화폐 (WSS, 퍼즐박스, 디모닉 큐브 등) 요약 카드 */}
        <div className="rounded-xl border border-gray-800 bg-[#15131b] p-4">
          <div className="mb-3 flex items-center gap-2">
            <Layers className="h-4 w-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300">
              주요 화폐 & 크래프팅 재료 시세 (클릭하여 거래 내역 조회)
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-5">
            {currencies.map((curr) => {
              const isSelected = selectedId === curr.baseCode;
              return (
                <button
                  key={curr.baseCode}
                  type="button"
                  onClick={() => onSelectRune(curr)}
                  className={`flex flex-col justify-between rounded-lg border p-2.5 text-left transition ${
                    isSelected
                      ? 'border-amber-500/60 bg-amber-500/15'
                      : 'border-gray-800 bg-[#1b1824] hover:border-gray-700'
                  }`}
                >
                  <div className="truncate text-xs font-semibold text-gray-200">
                    {curr.name}
                  </div>
                  <div className="mt-1.5 flex items-baseline justify-between">
                    <span className="font-mono text-sm font-bold text-emerald-400">
                      {curr.hrValue} HR
                    </span>
                    <span className="text-[10px] text-gray-400">
                      ≈ {Math.round(1 / (curr.hrValue || 0.01) * 10) / 10}개 / 1 HR
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
);
