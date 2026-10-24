// C:/AntigravityWorkspace/pd2s/src/App.tsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  AnalyzedItemResult,
  EconomyItemSummary,
  LocalSnapshotRecord,
  RealmMode,
  WatchItemConfig,
} from './types/market.types';
import {
  fetchOverviewApi,
  fetchWatchlistApi,
  addWatchItemApi,
  deleteWatchItemApi,
  fetchItemListingsAndHistoryApi,
  recordCustomSnapshotApi,
  fetchConfigApi,
} from './services/marketApi';
import { useMarketWorker } from './workers/useMarketWorker';
import { HeaderBar } from './components/HeaderBar';
import { RuneMatrixTable } from './components/RuneMatrixTable';
import { CustomWatchlistBoard } from './components/CustomWatchlistBoard';
import { AddWatchItemModal } from './components/AddWatchItemModal';
import { ItemDetailPanel } from './components/ItemDetailPanel';
import { RuneBreakCalculator } from './components/RuneBreakCalculator';

export function App() {
  const [realm, setRealm] = useState<RealmMode>({
    isLadder: true,
    isHardcore: false,
    seasonOnly: true,
  });

  const [overviewItems, setOverviewItems] = useState<EconomyItemSummary[]>([]);
  const [watchlist, setWatchlist] = useState<WatchItemConfig[]>([]);
  const [snapshots, setSnapshots] = useState<LocalSnapshotRecord[]>([]);
  const [analyzedMap, setAnalyzedMap] = useState<Record<string, AnalyzedItemResult>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [isOverviewLoading, setIsOverviewLoading] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [maskedKey, setMaskedKey] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 현재 우측 상세 패널에 선택된 타겟 (하이룬 baseCode 또는 커스텀 아이템 id)
  const [selectedId, setSelectedId] = useState<string>('custom-shako-3sk-2os');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WatchItemConfig | null>(null);

  const { analyzeItemAsync } = useMarketWorker();

  // 현재 하이룬/화폐 시세 맵 (워커가 물물교환 원문 텍스트를 HR로 환산할 때 참조)
  const runePriceMap = useMemo(() => {
    const map: Record<string, number> = { wss: 0.01 };
    for (const item of overviewItems) {
      map[item.baseCode] = item.hrValue;
    }
    return map;
  }, [overviewItems]);

  const runePriceMapRef = useRef(runePriceMap);
  runePriceMapRef.current = runePriceMap;

  // 단일 WatchItem에 대해 Live + Archive(Sold) 매물을 가져와 워커로 분석
  const loadAndAnalyzeWatchItem = useCallback(
    async (
      watchItem: WatchItemConfig,
      currentRealm: RealmMode,
      currentPriceMap: Record<string, number>
    ) => {
      setLoadingMap((prev) => ({ ...prev, [watchItem.id]: true }));
      try {
        const rawData = await fetchItemListingsAndHistoryApi(
          watchItem,
          currentRealm.isLadder,
          currentRealm.isHardcore
        );

        const analyzed = await analyzeItemAsync({
          watchItem,
          liveItems: rawData.liveItems,
          soldItems: rawData.soldItems,
          baseHistory: rawData.baseHistory,
          snapshots: rawData.snapshots,
          runePriceMap: currentPriceMap,
          seasonOnly: currentRealm.seasonOnly,
        });

        setAnalyzedMap((prev) => ({
          ...prev,
          [watchItem.id]: analyzed,
        }));

        // 커스텀 아이템이고 유효한 시세가 계산되었다면 로컬 스냅샷 DB에도 자동 기록
        if (watchItem.category === 'custom' && analyzed.currentHr) {
          recordCustomSnapshotApi({
            watchId: watchItem.id,
            hr: analyzed.currentHr,
            lowestAsk: analyzed.lowestLiveHr,
            sampleCount: analyzed.liveCount + analyzed.soldCount,
            isLadder: currentRealm.isLadder,
            isHardcore: currentRealm.isHardcore,
          });
        }
      } catch (err: any) {
        console.error(`[Analyze Failed] ${watchItem.label}:`, err);
      } finally {
        setLoadingMap((prev) => ({ ...prev, [watchItem.id]: false }));
      }
    },
    [analyzeItemAsync]
  );

  // 전체 데이터 초기 로드 및 새로고침
  const loadAllData = useCallback(
    async (targetRealm: RealmMode) => {
      setIsOverviewLoading(true);
      setErrorMsg(null);
      try {
        const [cfg, overviewRes, savedWatchlist] = await Promise.all([
          fetchConfigApi(),
          fetchOverviewApi(targetRealm.isLadder, targetRealm.isHardcore),
          fetchWatchlistApi(),
        ]);

        setMaskedKey(cfg.maskedKey);
        setOverviewItems(overviewRes.items);
        setSnapshots(overviewRes.snapshots);
        setWatchlist(savedWatchlist);
        setLastSyncedAt(overviewRes.fetchedAt);

        const nextPriceMap: Record<string, number> = { wss: 0.01 };
        for (const it of overviewRes.items) {
          nextPriceMap[it.baseCode] = it.hrValue;
        }

        // 1) 커스텀 관심 아이템 전체 + 주요 상위 룬(Ber, Sur, Jah, Lo, Vex, Ist) 백그라운드 병렬 분석
        const topRunesToPreload: WatchItemConfig[] = overviewRes.items
          .filter((i) => ['r30', 'r29', 'r31', 'r28', 'r26', 'r24'].includes(i.baseCode))
          .map((r) => ({
            id: r.baseCode,
            label: `${r.name} (실시간/완료 분석)`,
            itemName: r.name,
            baseCode: r.baseCode,
            category: 'rune' as const,
            iconUrl: r.iconUrl,
            stats: [],
            createdAt: new Date().toISOString(),
          }));

        const queue = [...savedWatchlist, ...topRunesToPreload];
        // 레이트 리밋 보호를 위해 3개씩 끊어서 병렬 실행
        for (let i = 0; i < queue.length; i += 3) {
          const batch = queue.slice(i, i + 3);
          await Promise.allSettled(
            batch.map((w) => loadAndAnalyzeWatchItem(w, targetRealm, nextPriceMap))
          );
        }
      } catch (err: any) {
        setErrorMsg(err?.message || '데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsOverviewLoading(false);
      }
    },
    [loadAndAnalyzeWatchItem]
  );

  useEffect(() => {
    loadAllData(realm);
  }, [realm.isLadder, realm.isHardcore]);

  // 하이룬/화폐 행 클릭 시 WatchItemConfig 형태로 변환하여 선택 & 즉시 분석
  const handleSelectRuneOrCurrency = useCallback(
    (item: EconomyItemSummary) => {
      setSelectedId(item.baseCode);
      const asWatch: WatchItemConfig = {
        id: item.baseCode,
        label: item.name,
        itemName: item.name,
        baseCode: item.baseCode,
        category: item.category === 'rune' ? 'rune' : 'currency',
        iconUrl: item.iconUrl,
        stats: [],
        createdAt: new Date().toISOString(),
      };
      loadAndAnalyzeWatchItem(asWatch, realm, runePriceMapRef.current);
    },
    [loadAndAnalyzeWatchItem, realm]
  );

  // 커스텀 관심 아이템 선택
  const handleSelectWatchItem = useCallback(
    (item: WatchItemConfig) => {
      setSelectedId(item.id);
      if (!analyzedMap[item.id]) {
        loadAndAnalyzeWatchItem(item, realm, runePriceMapRef.current);
      }
    },
    [analyzedMap, loadAndAnalyzeWatchItem, realm]
  );

  // + 커스텀 아이템 저장/수정 핸들러
  const handleSaveWatchItem = useCallback(
    async (newItemData: Omit<WatchItemConfig, 'id' | 'createdAt'> & { id?: string }) => {
      const res = await addWatchItemApi(newItemData);
      setWatchlist(res.items);
      setSelectedId(res.added.id);
      await loadAndAnalyzeWatchItem(res.added, realm, runePriceMapRef.current);
    },
    [loadAndAnalyzeWatchItem, realm]
  );

  // 커스텀 아이템 삭제 핸들러
  const handleDeleteWatchItem = useCallback(
    async (id: string) => {
      const next = await deleteWatchItemApi(id);
      setWatchlist(next);
      if (selectedId === id) {
        setSelectedId(next[0]?.id || 'r30');
      }
    },
    [selectedId]
  );

  // 현재 선택된 항목의 WatchItemConfig와 기본 히스토리 계산
  const activeWatchConfig: WatchItemConfig = useMemo(() => {
    const foundCustom = watchlist.find((w) => w.id === selectedId);
    if (foundCustom) return foundCustom;

    const foundRune = overviewItems.find((o) => o.baseCode === selectedId);
    if (foundRune) {
      return {
        id: foundRune.baseCode,
        label: foundRune.name,
        itemName: foundRune.name,
        baseCode: foundRune.baseCode,
        category: foundRune.category === 'rune' ? 'rune' : 'currency',
        iconUrl: foundRune.iconUrl,
        stats: [],
        createdAt: new Date().toISOString(),
      };
    }

    return (
      watchlist[0] || {
        id: 'r30',
        label: 'Ber Rune',
        itemName: 'Ber Rune',
        baseCode: 'r30',
        category: 'rune',
        stats: [],
        createdAt: new Date().toISOString(),
      }
    );
  }, [selectedId, watchlist, overviewItems]);

  const activeFallbackHistory = useMemo(() => {
    const found = overviewItems.find((o) => o.baseCode === activeWatchConfig.baseCode);
    return found?.history || [];
  }, [overviewItems, activeWatchConfig]);

  return (
    <div className="min-h-screen bg-[#0c0b0e] text-gray-100 pb-12">
      {/* 상단 고정 헤더 */}
      <HeaderBar
        realm={realm}
        onChangeRealm={setRealm}
        lastSyncedAt={lastSyncedAt}
        isLoading={isOverviewLoading}
        onRefreshAll={() => loadAllData(realm)}
        onOpenAddModal={() => {
          setEditingItem(null);
          setIsAddModalOpen(true);
        }}
        maskedKey={maskedKey}
        onKeyUpdated={() => loadAllData(realm)}
      />

      {/* 에러 배너 */}
      {errorMsg && (
        <div className="mx-auto mt-3 max-w-[1600px] px-4">
          <div className="rounded-lg border border-rose-500/40 bg-rose-500/15 px-4 py-2.5 text-xs text-rose-200">
            ⚠️ {errorMsg}
          </div>
        </div>
      )}

      {/* 메인 2-Column 그리드 레이아웃 */}
      <main className="mx-auto mt-4 grid max-w-[1600px] grid-cols-1 gap-5 px-4 lg:grid-cols-12">
        {/* 좌측 컬럼 (7/12): 커스텀 관심 아이템 보드 + 하이룬/화폐 시세표 + 룬 쪼개기 계산기 */}
        <div className="flex flex-col gap-5 lg:col-span-7">
          {/* 1) 내 커스텀 세부 조건 추적 보드 (+ 샤코 3스킬 2소켓 등) */}
          <CustomWatchlistBoard
            watchlist={watchlist}
            analyzedMap={analyzedMap}
            loadingMap={loadingMap}
            selectedId={activeWatchConfig.id}
            onSelectWatchItem={handleSelectWatchItem}
            onRefreshSingleItem={(item) =>
              loadAndAnalyzeWatchItem(item, realm, runePriceMapRef.current)
            }
            onDeleteWatchItem={handleDeleteWatchItem}
            onEditWatchItem={(item) => {
              setEditingItem(item);
              setIsAddModalOpen(true);
            }}
            onOpenAddModal={() => {
              setEditingItem(null);
              setIsAddModalOpen(true);
            }}
          />

          {/* 2) 하이룬 (Zod ~ Lem) & 주요 화폐 실시간 시세표 */}
          <RuneMatrixTable
            items={overviewItems}
            analyzedMap={analyzedMap}
            selectedId={activeWatchConfig.id}
            onSelectRune={handleSelectRuneOrCurrency}
            seasonOnly={realm.seasonOnly}
          />

          {/* 3) 실시간 룬 쪼개기(Break) & WSS 환산 계산기 */}
          <RuneBreakCalculator runePriceMap={runePriceMap} />
        </div>

        {/* 우측 컬럼 (5/12): 선택된 룬/커스텀 아이템의 날짜별 시세 추이 차트 & 실제 거래 완료(Sold) 원문 분석 */}
        <div className="lg:col-span-5">
          <div className="sticky top-20">
            <ItemDetailPanel
              activeWatch={activeWatchConfig}
              analyzed={analyzedMap[activeWatchConfig.id]}
              fallbackHistory={activeFallbackHistory}
              isLoading={Boolean(loadingMap[activeWatchConfig.id])}
              seasonOnly={realm.seasonOnly}
              onToggleSeasonOnly={() =>
                setRealm((prev) => ({ ...prev, seasonOnly: !prev.seasonOnly }))
              }
              onRefresh={() =>
                loadAndAnalyzeWatchItem(
                  activeWatchConfig,
                  realm,
                  runePriceMapRef.current
                )
              }
            />
          </div>
        </div>
      </main>

      {/* + 커스텀 추적 아이템 추가 / 수정 모달 */}
      <AddWatchItemModal
        isOpen={isAddModalOpen}
        editingItem={editingItem}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveWatchItem}
      />
    </div>
  );
}
export default App;
