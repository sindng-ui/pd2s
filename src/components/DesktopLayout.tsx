// C:/AntigravityWorkspace/pd2s/src/components/DesktopLayout.tsx
import React from 'react';
import { Sparkles, SlidersHorizontal, Plus } from 'lucide-react';
import {
  AnalyzedItemResult,
  EconomyItemSummary,
  PriceHistoryPoint,
  RealmMode,
  WatchItemConfig,
} from '../types/market.types';
import { RuneMatrixTable } from './RuneMatrixTable';
import { CustomWatchlistBoard } from './CustomWatchlistBoard';
import { ItemDetailPanel } from './ItemDetailPanel';
import { RuneBreakCalculator } from './RuneBreakCalculator';

interface DesktopLayoutProps {
  leftTab: 'runes' | 'custom';
  setLeftTab: (tab: 'runes' | 'custom') => void;
  overviewItems: EconomyItemSummary[];
  analyzedMap: Record<string, AnalyzedItemResult>;
  loadingMap: Record<string, boolean>;
  activeWatchConfig: WatchItemConfig;
  activeFallbackHistory: PriceHistoryPoint[];
  realm: RealmMode;
  setRealm: React.Dispatch<React.SetStateAction<RealmMode>>;
  runePriceMap: Record<string, number>;
  watchlist: WatchItemConfig[];
  onSelectRuneOrCurrency: (item: EconomyItemSummary) => void;
  onSelectWatchItem: (item: WatchItemConfig) => void;
  onRefreshSingleItem: (item: WatchItemConfig) => void;
  onDeleteWatchItem: (id: string) => void;
  onEditWatchItem: (item: WatchItemConfig) => void;
  onOpenAddModal: () => void;
}

export const DesktopLayout: React.FC<DesktopLayoutProps> = React.memo(
  ({
    leftTab,
    setLeftTab,
    overviewItems,
    analyzedMap,
    loadingMap,
    activeWatchConfig,
    activeFallbackHistory,
    realm,
    setRealm,
    runePriceMap,
    watchlist,
    onSelectRuneOrCurrency,
    onSelectWatchItem,
    onRefreshSingleItem,
    onDeleteWatchItem,
    onEditWatchItem,
    onOpenAddModal,
  }) => {
    return (
      <main className="mx-auto flex-1 w-full max-w-[1600px] overflow-hidden px-4 py-3">
        <div className="grid h-full grid-cols-1 gap-5 lg:grid-cols-12">
          {/* 좌측 컬럼 (7/12): 독립 세로 스크롤 */}
          <div className="h-full overflow-y-auto pr-1 flex flex-col gap-4 lg:col-span-7">
            {/* 상단 탭 네비게이션 바 */}
            <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 border-b border-gray-800 pb-2.5">
              <div className="flex items-center gap-1.5 rounded-xl border border-gray-800 bg-[#14121a] p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => setLeftTab('runes')}
                  className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                    leftTab === 'runes'
                      ? 'bg-amber-500 text-gray-950 shadow'
                      : 'text-gray-400 hover:bg-gray-800/60 hover:text-gray-200'
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>하이룬 & 화폐 시세표</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLeftTab('custom')}
                  className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                    leftTab === 'custom'
                      ? 'bg-amber-500 text-gray-950 shadow'
                      : 'text-gray-400 hover:bg-gray-800/60 hover:text-gray-200'
                  }`}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span>내 커스텀 추적 아이템</span>
                  <span
                    className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                      leftTab === 'custom'
                        ? 'bg-gray-950 text-amber-300'
                        : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {watchlist.length}
                  </span>
                </button>
              </div>

              {leftTab === 'runes' && (
                <button
                  type="button"
                  onClick={onOpenAddModal}
                  className="flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-300 transition hover:bg-amber-500/20"
                >
                  <Plus className="h-3.5 w-3.5" />
                  + 새 추적 아이템
                </button>
              )}
            </div>

            {/* 탭 1: 하이룬 시세표 & 룬 쪼개기 */}
            {leftTab === 'runes' && (
              <>
                <RuneMatrixTable
                  items={overviewItems}
                  analyzedMap={analyzedMap}
                  selectedId={activeWatchConfig.id}
                  onSelectRune={onSelectRuneOrCurrency}
                  seasonOnly={realm.seasonOnly}
                />
                <RuneBreakCalculator runePriceMap={runePriceMap} />
              </>
            )}

            {/* 탭 2: 내 커스텀 세부 조건 추적 보드 */}
            {leftTab === 'custom' && (
              <CustomWatchlistBoard
                watchlist={watchlist}
                analyzedMap={analyzedMap}
                loadingMap={loadingMap}
                selectedId={activeWatchConfig.id}
                onSelectWatchItem={onSelectWatchItem}
                onRefreshSingleItem={onRefreshSingleItem}
                onDeleteWatchItem={onDeleteWatchItem}
                onEditWatchItem={onEditWatchItem}
                onOpenAddModal={onOpenAddModal}
              />
            )}
          </div>

          {/* 우측 컬럼 (5/12): 독립 세로 스크롤 */}
          <div className="h-full overflow-y-auto pr-1 lg:col-span-5">
            <ItemDetailPanel
              activeWatch={activeWatchConfig}
              analyzed={analyzedMap[activeWatchConfig.id]}
              fallbackHistory={activeFallbackHistory}
              isLoading={Boolean(loadingMap[activeWatchConfig.id])}
              seasonOnly={realm.seasonOnly}
              onToggleSeasonOnly={() =>
                setRealm((prev) => ({ ...prev, seasonOnly: !prev.seasonOnly }))
              }
              onRefresh={() => onRefreshSingleItem(activeWatchConfig)}
            />
          </div>
        </div>
      </main>
    );
  }
);
