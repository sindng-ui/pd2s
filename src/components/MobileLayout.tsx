// C:/AntigravityWorkspace/pd2s/src/components/MobileLayout.tsx
import React from 'react';
import {
  AnalyzedItemResult,
  EconomyItemSummary,
  PriceHistoryPoint,
  RealmMode,
  WatchItemConfig,
} from '../types/market.types';
import { MobileTab } from './MobileBottomNav';
import { RuneMatrixTable } from './RuneMatrixTable';
import { CustomWatchlistBoard } from './CustomWatchlistBoard';
import { ItemDetailPanel } from './ItemDetailPanel';
import { RuneBreakCalculator } from './RuneBreakCalculator';

interface MobileLayoutProps {
  mobileTab: MobileTab;
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

export const MobileLayout: React.FC<MobileLayoutProps> = React.memo(
  ({
    mobileTab,
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
      <main className="flex-1 w-full overflow-y-auto px-3 py-3 pb-24">
        {mobileTab === 'runes' && (
          <div className="flex flex-col gap-4">
            <RuneMatrixTable
              items={overviewItems}
              analyzedMap={analyzedMap}
              selectedId={activeWatchConfig.id}
              onSelectRune={onSelectRuneOrCurrency}
              seasonOnly={realm.seasonOnly}
            />
            <RuneBreakCalculator runePriceMap={runePriceMap} />
          </div>
        )}

        {mobileTab === 'custom' && (
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

        {mobileTab === 'detail' && (
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
        )}
      </main>
    );
  }
);
