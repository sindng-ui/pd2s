// C:/AntigravityWorkspace/pd2s/src/components/CustomWatchlistBoard.tsx
import React from 'react';
import {
  Plus,
  Trash2,
  RefreshCw,
  SlidersHorizontal,
  Tag,
  CheckCircle,
  Edit3,
} from 'lucide-react';
import { AnalyzedItemResult, WatchItemConfig } from '../types/market.types';

interface CustomWatchlistBoardProps {
  watchlist: WatchItemConfig[];
  analyzedMap: Record<string, AnalyzedItemResult>;
  loadingMap: Record<string, boolean>;
  selectedId: string;
  onSelectWatchItem: (item: WatchItemConfig) => void;
  onRefreshSingleItem: (item: WatchItemConfig) => void;
  onDeleteWatchItem: (id: string) => void;
  onEditWatchItem: (item: WatchItemConfig) => void;
  onOpenAddModal: () => void;
}

export const CustomWatchlistBoard: React.FC<CustomWatchlistBoardProps> = React.memo(
  ({
    watchlist,
    analyzedMap,
    loadingMap,
    selectedId,
    onSelectWatchItem,
    onRefreshSingleItem,
    onDeleteWatchItem,
    onEditWatchItem,
    onOpenAddModal,
  }) => {
    return (
      <div className="shrink-0 rounded-xl border border-amber-500/25 bg-[#15131b] shadow-lg overflow-hidden">
        {/* 헤더 */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-800 bg-[#1c1824] px-4 py-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-bold text-amber-100">
              내 커스텀 세부 조건 추적 아이템 ({watchlist.length}개)
            </h2>
            <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-300 border border-amber-500/20">
              예: 샤코 3스킬 2소켓 등 원하는 옵션 조합별 시세 & 실거래 추적
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenAddModal}
            className="flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-gray-950 transition hover:bg-amber-400"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            + 아이템 추가
          </button>
        </div>

        {/* 카드 그리드 */}
        {watchlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-sm text-gray-400">
              등록된 커스텀 추적 아이템이 없습니다.
            </p>
            <button
              type="button"
              onClick={onOpenAddModal}
              className="mt-3 flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/15 px-4 py-2 text-xs font-semibold text-amber-200 hover:bg-amber-500/25"
            >
              <Plus className="h-4 w-4" />첫 번째 추적 아이템(예: 샤코 3스킬 2소켓) 등록하기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
            {watchlist.map((item) => {
              const isSelected = selectedId === item.id;
              const analyzed = analyzedMap[item.id];
              const isLoading = Boolean(loadingMap[item.id]);
              const activeStats = (item.stats || []).filter((s) => s.enabled);

              return (
                <div
                  key={item.id}
                  onClick={() => onSelectWatchItem(item)}
                  className={`group relative flex flex-col justify-between rounded-xl border p-3.5 transition cursor-pointer ${
                    isSelected
                      ? 'border-amber-400/70 bg-gradient-to-br from-amber-500/15 to-purple-900/15 shadow-md'
                      : 'border-gray-800 bg-[#1a1723] hover:border-gray-700 hover:bg-[#1f1b29]'
                  }`}
                >
                  {/* 상단: 아이콘, 라벨, 액션 버튼 */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      {item.iconUrl ? (
                        <img
                          src={item.iconUrl}
                          alt={item.itemName}
                          className="h-10 w-10 rounded-lg border border-gray-700 bg-[#0d0b10] object-contain p-1"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs font-bold text-amber-300">
                          ITEM
                        </div>
                      )}
                      <div>
                        <h3 className="text-sm font-bold text-amber-100 group-hover:text-amber-300">
                          {item.label}
                        </h3>
                        <p className="text-[11px] text-gray-400">{item.itemName}</p>
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => onRefreshSingleItem(item)}
                        title="이 아이템 실시간 재조회"
                        className="rounded p-1 text-gray-400 hover:bg-gray-800 hover:text-amber-300"
                      >
                        <RefreshCw
                          className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`}
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEditWatchItem(item)}
                        title="세부 조건 수정"
                        className="rounded p-1 text-gray-400 hover:bg-gray-800 hover:text-blue-300"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteWatchItem(item.id)}
                        title="추적 목록에서 삭제"
                        className="rounded p-1 text-gray-400 hover:bg-gray-800 hover:text-rose-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* 중단: 설정된 세부 조건 배지 */}
                  <div className="my-2.5 flex flex-wrap gap-1.5">
                    {(item.socketsMin !== undefined || item.socketsMax !== undefined) && (
                      <span className="rounded bg-blue-500/15 px-2 py-0.5 text-[11px] font-medium text-blue-300 border border-blue-500/30">
                        소켓:{' '}
                        {item.socketsMin === item.socketsMax
                          ? `${item.socketsMin}소켓`
                          : `${item.socketsMin ?? 0}~${item.socketsMax ?? 6}소켓`}
                      </span>
                    )}
                    {item.corrupted && item.corrupted !== 'any' && (
                      <span
                        className={`rounded px-2 py-0.5 text-[11px] font-medium border ${
                          item.corrupted === 'yes'
                            ? 'bg-red-500/15 text-red-300 border-red-500/30'
                            : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        }`}
                      >
                        {item.corrupted === 'yes' ? '타락(Corrupted)' : '노타락(Clean)'}
                      </span>
                    )}
                    {item.ethereal && item.ethereal !== 'any' && (
                      <span className="rounded bg-cyan-500/15 px-2 py-0.5 text-[11px] font-medium text-cyan-300 border border-cyan-500/30">
                        {item.ethereal === 'yes' ? '에테리얼' : '노에테'}
                      </span>
                    )}
                    {activeStats.map((st, idx) => (
                      <span
                        key={idx}
                        className="rounded bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-200 border border-amber-500/30"
                      >
                        {st.label.split('(')[0].trim()}{' '}
                        {st.min !== undefined ? `≥ ${st.min}` : ''}
                        {st.max !== undefined ? ` ≤ ${st.max}` : ''}
                      </span>
                    ))}
                    {activeStats.length === 0 &&
                      item.socketsMin === undefined &&
                      (!item.corrupted || item.corrupted === 'any') && (
                        <span className="text-[11px] text-gray-500">전체 옵션 평균/매물</span>
                      )}
                  </div>

                  {/* 하단: 현재 추정 시세, 최저 매물가, 실거래 완료 건수 & 주요 거래 수단 */}
                  <div className="mt-1 flex items-center justify-between border-t border-gray-800/80 pt-2.5 text-xs">
                    <div className="flex items-center gap-3">
                      <div>
                        <span className="block text-[10px] text-gray-400">추정/중위 시세</span>
                        <span className="font-mono text-sm font-bold text-amber-300">
                          {analyzed?.currentHr !== null && analyzed?.currentHr !== undefined
                            ? `${analyzed.currentHr} HR`
                            : isLoading
                            ? '계산중...'
                            : '매물 없음'}
                        </span>
                      </div>
                      <div className="border-l border-gray-800 pl-3">
                        <span className="block text-[10px] text-gray-400">현재 최저가(Ask)</span>
                        <span className="font-mono text-xs font-semibold text-emerald-300">
                          {analyzed?.lowestLiveHr !== null && analyzed?.lowestLiveHr !== undefined
                            ? `${analyzed.lowestLiveHr} HR`
                            : '-'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1.5 text-[11px]">
                        <span className="text-blue-300">
                          판매중 {analyzed?.liveCount ?? 0}건
                        </span>
                        <span className="text-gray-600">·</span>
                        <span className="flex items-center gap-0.5 font-semibold text-emerald-400">
                          <CheckCircle className="h-3 w-3" />
                          완료 {analyzed?.soldCount ?? 0}건
                        </span>
                      </div>
                      {analyzed?.topPaymentMethods?.[0] && (
                        <div className="mt-0.5 flex items-center justify-end gap-1 text-[10px] text-purple-300">
                          <Tag className="h-2.5 w-2.5" />
                          주로 {analyzed.topPaymentMethods[0].label} 거래
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }
);
