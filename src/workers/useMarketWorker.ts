// C:/AntigravityWorkspace/pd2s/src/workers/useMarketWorker.ts
import { useEffect, useRef, useCallback } from 'react';
import {
  AnalyzedItemResult,
  LocalSnapshotRecord,
  PriceHistoryPoint,
  RawMarketListingItem,
  WatchItemConfig,
} from '../types/market.types';
import { analyzeWatchItemData } from './marketAnalysis.worker';

interface AnalyzeRequestPayload {
  watchItem: WatchItemConfig;
  liveItems: RawMarketListingItem[];
  soldItems: RawMarketListingItem[];
  baseHistory: PriceHistoryPoint[];
  snapshots: LocalSnapshotRecord[];
  runePriceMap: Record<string, number>;
  seasonOnly: boolean;
}

export function useMarketWorker() {
  const workerRef = useRef<Worker | null>(null);
  const pendingMapRef = useRef<
    Map<string, { resolve: (res: AnalyzedItemResult) => void; reject: (err: any) => void }>
  >(new Map());

  useEffect(() => {
    try {
      const worker = new Worker(
        new URL('./marketAnalysis.worker.ts', import.meta.url),
        { type: 'module' }
      );

      worker.onmessage = (e: MessageEvent) => {
        const { type, requestId, result, error } = e.data;
        const pending = pendingMapRef.current.get(requestId);
        if (!pending) return;
        pendingMapRef.current.delete(requestId);

        if (type === 'ANALYZE_ITEM_DONE') {
          pending.resolve(result as AnalyzedItemResult);
        } else {
          pending.reject(new Error(error || 'Worker failed'));
        }
      };

      workerRef.current = worker;
    } catch (err) {
      console.warn('[useMarketWorker] Fallback to main thread execution:', err);
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  const analyzeItemAsync = useCallback(
    (payload: AnalyzeRequestPayload): Promise<AnalyzedItemResult> => {
      if (!workerRef.current) {
        return Promise.resolve(analyzeWatchItemData(payload));
      }
      const requestId = `${payload.watchItem.id}-${Date.now()}-${Math.random()}`;
      return new Promise<AnalyzedItemResult>((resolve, reject) => {
        pendingMapRef.current.set(requestId, { resolve, reject });
        workerRef.current!.postMessage({
          type: 'ANALYZE_ITEM',
          requestId,
          payload,
        });
      });
    },
    []
  );

  return { analyzeItemAsync };
}
