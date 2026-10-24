// C:/AntigravityWorkspace/pd2s/src/components/TradeBreakdownView.tsx
import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  Clock,
  Filter,
  User,
  Coins,
  FileText,
} from 'lucide-react';
import { AnalyzedItemResult, BarterCategory } from '../types/market.types';

interface TradeBreakdownViewProps {
  analyzed: AnalyzedItemResult | undefined;
  isLoading: boolean;
}

const CATEGORY_COLOR_MAP: Record<BarterCategory, string> = {
  PURE_HR: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  WSS: 'bg-red-500/20 text-red-300 border-red-500/40',
  RUNE_EXCHANGE: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  RUNE_BREAK: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  GEMS_MATS: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  OFFER_OTHER: 'bg-gray-700/40 text-gray-300 border-gray-600/40',
};

export const TradeBreakdownView: React.FC<TradeBreakdownViewProps> = React.memo(
  ({ analyzed, isLoading }) => {
    const [statusFilter, setStatusFilter] = useState<'all' | 'sold' | 'live'>('all');
    const [catFilter, setCatFilter] = useState<BarterCategory | 'ALL'>('ALL');

    const filteredListings = useMemo(() => {
      if (!analyzed) return [];
      return (analyzed.parsedListings || []).filter((item) => {
        if (statusFilter !== 'all' && item.status !== statusFilter) return false;
        if (catFilter !== 'ALL' && item.barterCategory !== catFilter) return false;
        return true;
      });
    }, [analyzed, statusFilter, catFilter]);

    if (isLoading && !analyzed) {
      return (
        <div className="flex h-64 items-center justify-center rounded-xl border border-gray-800 bg-[#15131b] text-xs text-gray-400">
          실시간 거래소 매물 및 완료된 거래(Sold) 원문을 분석하고 있습니다...
        </div>
      );
    }

    if (!analyzed) {
      return null;
    }

    return (
      <div className="space-y-4">
        {/* 1. 무엇으로 거래되고 있는가? (교환 수단 통계 & 자주 쓰이는 지불 조건 랭킹) */}
        <div className="rounded-xl border border-gray-800 bg-[#15131b] p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-100">
                실제 무엇으로 거래되고 있는가? (물물교환 & 지불 수단 분석)
              </h3>
            </div>
            <span className="text-[11px] text-gray-400">
              총 {analyzed.parsedListings?.length || 0}건 표본 (완료 {analyzed.soldCount || 0}건 / 판매중{' '}
              {analyzed.liveCount || 0}건)
            </span>
          </div>

          {/* 카테고리 비율 바 */}
          {(analyzed.barterBreakdown || []).length > 0 ? (
            <>
              <div className="mb-3 flex h-3 w-full overflow-hidden rounded-full bg-gray-900">
                {(analyzed.barterBreakdown || []).map((b) => {
                  const barColors: Record<BarterCategory, string> = {
                    PURE_HR: 'bg-amber-500',
                    WSS: 'bg-red-500',
                    RUNE_EXCHANGE: 'bg-purple-500',
                    RUNE_BREAK: 'bg-blue-500',
                    GEMS_MATS: 'bg-emerald-500',
                    OFFER_OTHER: 'bg-gray-600',
                  };
                  return (
                    <div
                      key={b.category}
                      style={{ width: `${Math.max(b.percentage, 4)}%` }}
                      title={`${b.label}: ${b.count}건 (${b.percentage}%)`}
                      className={`${barColors[b.category]} transition-all`}
                    />
                  );
                })}
              </div>

              {/* 카테고리 필터 버튼 겸 범례 */}
              <div className="mb-4 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setCatFilter('ALL')}
                  className={`rounded-md border px-2.5 py-1 text-[11px] font-medium transition ${
                    catFilter === 'ALL'
                      ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                      : 'border-gray-800 bg-[#1c1926] text-gray-400 hover:text-gray-200'
                  }`}
                >
                  전체 수단 ({analyzed.parsedListings.length})
                </button>
                {analyzed.barterBreakdown.map((b) => (
                  <button
                    key={b.category}
                    type="button"
                    onClick={() =>
                      setCatFilter(catFilter === b.category ? 'ALL' : b.category)
                    }
                    className={`rounded-md border px-2.5 py-1 text-[11px] font-medium transition ${
                      catFilter === b.category
                        ? CATEGORY_COLOR_MAP[b.category]
                        : 'border-gray-800 bg-[#1c1926] text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {b.label} {b.percentage}% ({b.count}건)
                  </button>
                ))}
              </div>

              {/* 최다 등장 거래 조건 TOP 태그 */}
              <div>
                <div className="mb-1.5 text-[11px] font-semibold text-gray-400">
                  가장 많이 요구/체결된 구체적 거래 조건 TOP:
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {analyzed.topPaymentMethods.map((tag, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col justify-between rounded-lg border border-gray-800/90 bg-[#1b1824] p-2.5"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate text-xs font-bold text-amber-200">
                          {tag.label}
                        </span>
                        <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
                          {tag.count}건
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[10px] text-gray-400">
                        <span>비중 {tag.percentage}%</span>
                        {tag.avgHr !== null && (
                          <span className="font-mono text-emerald-400">
                            ≈ {tag.avgHr} HR
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <p className="py-4 text-center text-xs text-gray-500">
              현재 조건과 일치하는 최근 거래 내역이 없습니다.
            </p>
          )}
        </div>

        {/* 2. 실제 거래 완료(Sold) & 실시간(Live) 매물 원문 리스트 */}
        <div className="rounded-xl border border-gray-800 bg-[#15131b] overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-800 bg-[#1a1722] px-4 py-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-gray-100">
                실제 거래 완료(Sold) 및 현재 등록 매물 원문 로그 ({filteredListings.length}건)
              </h3>
            </div>

            {/* 상태 필터 탭 */}
            <div className="flex items-center gap-1 rounded-lg border border-gray-800 bg-[#121017] p-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`rounded px-2.5 py-1 font-medium ${
                  statusFilter === 'all'
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                전체 ({analyzed.parsedListings.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('sold')}
                className={`rounded px-2.5 py-1 font-medium ${
                  statusFilter === 'sold'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                거래완료 Sold ({analyzed.soldCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('live')}
                className={`rounded px-2.5 py-1 font-medium ${
                  statusFilter === 'live'
                    ? 'bg-blue-500/20 text-blue-300'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                판매중 Live ({analyzed.liveCount})
              </button>
            </div>
          </div>

          <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-800/60">
            {filteredListings.length === 0 ? (
              <div className="py-10 text-center text-xs text-gray-500">
                선택한 필터에 해당하는 매물 기록이 없습니다. (시즌 14 첫날이므로 거래가 발생할 때마다 자동 누적됩니다!)
              </div>
            ) : (
              filteredListings.map((item) => {
                const isSold = item.status === 'sold' || Boolean(item.acceptedOfferId);
                const timeStr = new Date(item.updatedAt || item.createdAt).toLocaleString(
                  'ko-KR',
                  {
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  }
                );

                return (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-xs hover:bg-white/[0.02]"
                  >
                    {/* 좌측: 상태 배지 + 세부 옵션 요약 */}
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {isSold ? (
                          <span className="inline-flex items-center gap-1 rounded border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                            <CheckCircle2 className="h-3 w-3" />
                            거래완료 (SOLD)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded border border-blue-500/40 bg-blue-500/15 px-2 py-0.5 text-[10px] font-bold text-blue-300">
                            <Clock className="h-3 w-3" />
                            판매중 (LIVE)
                          </span>
                        )}

                        <span className="font-bold text-gray-100">{item.itemName}</span>

                        {item.keyModSummary.map((mod, i) => (
                          <span
                            key={i}
                            className="rounded bg-gray-800 px-1.5 py-0.5 text-[10px] text-amber-200/90"
                          >
                            {mod}
                          </span>
                        ))}
                      </div>

                      {/* 전체 주요 모디파이어 한 줄 표시 */}
                      {item.modifiers && item.modifiers.length > 0 && (
                        <div className="text-[11px] text-gray-400">
                          {item.modifiers
                            .slice(0, 5)
                            .map((m) => m.label)
                            .filter(Boolean)
                            .join(' · ')}
                        </div>
                      )}
                    </div>

                    {/* 우측: 판매자 원문 가격(price) + 환산 HR + 시간 */}
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded border px-2 py-0.5 text-[11px] font-semibold ${
                            CATEGORY_COLOR_MAP[item.barterCategory]
                          }`}
                        >
                          {item.normalizedPaymentText}
                        </span>
                        {item.estimatedHr !== null && (
                          <span className="rounded bg-amber-500/20 px-2 py-0.5 font-mono text-xs font-bold text-amber-300 border border-amber-500/30">
                            {item.estimatedHr} HR
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-gray-500">
                        {item.rawPriceNote && (
                          <span className="text-gray-400">
                            원문: &ldquo;{item.rawPriceNote}&rdquo;
                          </span>
                        )}
                        <span className="flex items-center gap-0.5">
                          <User className="h-2.5 w-2.5" />
                          {item.sellerName}
                        </span>
                        <span>{timeStr}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }
);
