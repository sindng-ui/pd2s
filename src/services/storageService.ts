// C:/AntigravityWorkspace/pd2s/src/services/storageService.ts
import {
  WatchItemConfig,
  LocalSnapshotRecord,
  RawMarketListingItem,
} from '../types/market.types';
import { DEFAULT_CUSTOM_WATCHLIST } from '../constants/defaultWatchlist';

const STORAGE_KEYS = {
  API_KEY: 'pd2_api_key',
  WATCHLIST: 'pd2_custom_watchlist',
  SNAPSHOTS: 'pd2_price_snapshots',
  SOLD_HISTORY: 'pd2_sold_history',
} as const;

export function getStoredApiKey(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.API_KEY) || '';
  } catch {
    return '';
  }
}

export function saveStoredApiKey(apiKey: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.API_KEY, apiKey.trim());
  } catch (err) {
    console.error('[storageService] Failed to save API Key:', err);
  }
}

export function getStoredWatchlist(): WatchItemConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WATCHLIST);
    if (!raw) {
      saveStoredWatchlist(DEFAULT_CUSTOM_WATCHLIST);
      return DEFAULT_CUSTOM_WATCHLIST;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_CUSTOM_WATCHLIST;
  }
}

export function saveStoredWatchlist(items: WatchItemConfig[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(items));
  } catch (err) {
    console.error('[storageService] Failed to save watchlist:', err);
  }
}

export function getStoredSnapshots(): LocalSnapshotRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SNAPSHOTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function appendStoredSnapshot(record: LocalSnapshotRecord): LocalSnapshotRecord[] {
  try {
    const list = getStoredSnapshots();
    const existingIdx = list.findIndex(
      (s) =>
        s.hourKey === record.hourKey &&
        s.isLadder === record.isLadder &&
        s.isHardcore === record.isHardcore
    );

    if (existingIdx >= 0) {
      list[existingIdx] = {
        ...list[existingIdx],
        timestamp: record.timestamp,
        prices: {
          ...list[existingIdx].prices,
          ...record.prices,
        },
      };
    } else {
      list.push(record);
    }

    const trimmed = list.slice(-2000);
    localStorage.setItem(STORAGE_KEYS.SNAPSHOTS, JSON.stringify(trimmed));
    return trimmed;
  } catch (err) {
    console.error('[storageService] Failed to append snapshot:', err);
    return [];
  }
}

export function getStoredSoldHistoryMap(): Record<string, RawMarketListingItem[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SOLD_HISTORY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function mergeStoredSoldListings(
  watchKey: string,
  newSoldItems: RawMarketListingItem[]
): RawMarketListingItem[] {
  try {
    const map = getStoredSoldHistoryMap();
    const current = map[watchKey] || [];
    const byId = new Map<string, RawMarketListingItem>();

    for (const item of current) byId.set(item.id, item);
    for (const item of newSoldItems) byId.set(item.id, item);

    const merged = Array.from(byId.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    map[watchKey] = merged.slice(0, 300);
    localStorage.setItem(STORAGE_KEYS.SOLD_HISTORY, JSON.stringify(map));
    return map[watchKey];
  } catch (err) {
    console.error('[storageService] Failed to merge sold history:', err);
    return newSoldItems;
  }
}
