// C:/AntigravityWorkspace/pd2s/src/components/ItemDetailPanel.tsx
import React from 'react';
import { RefreshCw, ExternalLink, Sparkles, ShieldCheck } from 'lucide-react';
import { open } from '@tauri-apps/api/shell';
import {
  AnalyzedItemResult,
  PriceHistoryPoint,
  WatchItemConfig,
} from '../types/market.types';
import { PriceTrendChart } from './PriceTrendChart';
import { TradeBreakdownView } from './TradeBreakdownView';

interface ItemDetailPanelProps {
  activeWatch: WatchItemConfig;
  analyzed: AnalyzedItemResult | undefined;
  fallbackHistory: PriceHistoryPoint[];
  isLoading: boolean;
  seasonOnly: boolean;
  onToggleSeasonOnly: () => void;
  onRefresh: () => void;
}

export const ItemDetailPanel: React.FC<ItemDetailPanelProps> = React.memo(
  ({
    activeWatch,
    analyzed,
    fallbackHistory,
    isLoading,
    seasonOnly,
    onToggleSeasonOnly,
    onRefresh,
  }) => {
    const activeStats = (activeWatch.stats || []).filter((s) => s.enabled);
    const chartPoints =
      analyzed?.trendPoints && analyzed.trendPoints.length > 0
        ? analyzed.trendPoints
        : fallbackHistory;

    return (
      <div className="flex flex-col gap-4">
        {/* 상단 선택 아이템 요약 배너 */}
        <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-[#1a1625] via-[#171420] to-[#1a1625] p-4 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {activeWatch.iconUrl ? (
                <img
                  src={activeWatch.iconUrl}
                  alt={activeWatch.itemName}
                  className="h-12 w-12 rounded-xl border border-amber-500/30 bg-[#0d0b10] object-contain p-1.5"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-500/10 text-xs font-bold text-amber-300">
                  PD2
                </div>
              )}

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-300 border border-amber-500/30">
                    <Sparkles className="h-3 w-3" />
                    심층 분석 타겟
                  </span>
                  <h2 className="text-base font-extrabold text-white">
                    {activeWatch.label}
                  </h2>
                  <span className="text-xs text-gray-400">
                    ({activeWatch.itemName})
                  </span>
                </div>

                {/* 적용 중인 세부 필터 태그 */}
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                  {activeWatch.socketsMin !== undefined && (
                    <span className="rounded bg-blue-500/15 px-2 py-0.5 text-blue-300 border border-blue-500/30">
                      소켓: {activeWatch.socketsMin}~{activeWatch.socketsMax ?? 6}
                    </span>
                  )}
                  {activeWatch.corrupted && activeWatch.corrupted !== 'any' && (
                    <span className="rounded bg-red-500/15 px-2 py-0.5 text-red-300 border border-red-500/30">
                      타락: {activeWatch.corrupted === 'yes' ? 'Yes' : 'Clean(No)'}
                    </span>
                  )}
                  {activeStats.map((st, idx) => (
                    <span
                      key={idx}
                      className="rounded bg-amber-500/15 px-2 py-0.5 text-amber-200 border border-amber-500/30"
                    >
                      {st.label.split('(')[0].trim()} ≥ {st.min}
                    </span>
                  ))}
                  {activeStats.length === 0 &&
                    activeWatch.socketsMin === undefined && (
                      <span className="flex items-center gap-1 text-gray-400">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                        기본 카탈로그 전체 표본 추적 중
                      </span>
                    )}
                </div>
              </div>
            </div>

            {/* 우측 핵심 수치 요약 + 새로고침 */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-[11px] text-gray-400">현재 대표 시세</div>
                <div className="font-mono text-xl font-extrabold text-amber-400">
                  {analyzed?.currentHr !== null && analyzed?.currentHr !== undefined
                    ? `${analyzed.currentHr} HR`
                    : '-'}
                </div>
              </div>

              <div className="border-l border-gray-800 pl-4 text-right">
                <div className="text-[11px] text-gray-400">실거래 완료 / 활성 매물</div>
                <div className="font-mono text-sm font-bold text-emerald-400">
                  완료 {analyzed?.soldCount ?? 0}건{' '}
                  <span className="text-gray-500">/</span>{' '}
                  <span className="text-blue-300">
                    매물 {analyzed?.liveCount ?? 0}건
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={onRefresh}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-200 hover:bg-amber-500/25 disabled:opacity-50"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`}
                  />
                  매물 재분석
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const url = 'https://www.projectdiablo2.com/market';
                    try {
                      await open(url);
                    } catch {
                      window.open(url, '_blank');
                    }
                  }}
                  className="flex items-center justify-center gap-1 text-[10px] text-gray-400 hover:text-amber-300 transition cursor-pointer"
                >
                  공식 마켓 열기 <ExternalLink className="h-2.5 w-2.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 1. 시즌 날짜별 시세 변동 추이 차트 */}
        <PriceTrendChart
          title={activeWatch.label}
          points={chartPoints}
          seasonOnly={seasonOnly}
          onToggleSeasonOnly={onToggleSeasonOnly}
        />

        {/* 2. 실제 거래 완료(Sold) 가격 & 무엇으로 거래되었는지 원문 분석 */}
        <TradeBreakdownView analyzed={analyzed} isLoading={isLoading} />
      </div>
    );
  }
);
