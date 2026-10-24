// C:/AntigravityWorkspace/pd2s/src/services/marketApi.ts
import {
  EconomyItemSummary,
  LocalSnapshotRecord,
  PriceHistoryPoint,
  RawMarketListingItem,
  WatchItemConfig,
} from '../types/market.types';

export async function fetchOverviewApi(
  isLadder: boolean,
  isHardcore: boolean
): Promise<{
  items: EconomyItemSummary[];
  snapshots: LocalSnapshotRecord[];
  fetchedAt: string;
}> {
  const res = await fetch(
    `/api/local/overview?isLadder=${isLadder}&isHardcore=${isHardcore}`
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to load overview (${res.status})`);
  }
  return res.json();
}

export async function fetchWatchlistApi(): Promise<WatchItemConfig[]> {
  const res = await fetch('/api/local/watchlist');
  if (!res.ok) throw new Error('Failed to load custom watchlist');
  const data = await res.json();
  return data.items || [];
}

export async function addWatchItemApi(
  item: Omit<WatchItemConfig, 'id' | 'createdAt'> & { id?: string }
): Promise<{ items: WatchItemConfig[]; added: WatchItemConfig }> {
  const res = await fetch('/api/local/watchlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error('Failed to save watch item');
  return res.json();
}

export async function deleteWatchItemApi(id: string): Promise<WatchItemConfig[]> {
  const res = await fetch(`/api/local/watchlist?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete watch item');
  const data = await res.json();
  return data.items || [];
}

export async function fetchItemListingsAndHistoryApi(
  watchItem: WatchItemConfig,
  isLadder: boolean,
  isHardcore: boolean
): Promise<{
  watchId: string;
  liveItems: RawMarketListingItem[];
  liveTotal: number;
  soldItems: RawMarketListingItem[];
  soldTotal: number;
  baseHistory: PriceHistoryPoint[];
  snapshots: LocalSnapshotRecord[];
}> {
  const res = await fetch('/api/local/item-listings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ watchItem, isLadder, isHardcore }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch item listings');
  }
  return res.json();
}

export async function recordCustomSnapshotApi(payload: {
  watchId: string;
  hr: number;
  lowestAsk?: number | null;
  sampleCount?: number;
  isLadder: boolean;
  isHardcore: boolean;
}): Promise<void> {
  await fetch('/api/local/snapshot-custom', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

export async function searchCatalogAutocompleteApi(query: string): Promise<
  Array<{
    baseCode: string;
    name: string;
    category: string;
    typeCode: string;
    quality: string;
    iconUrl: string | null;
    aliases: string[];
  }>
> {
  if (!query.trim()) return [];
  const res = await fetch(`/api/local/catalog-search?q=${encodeURIComponent(query)}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.hits || [];
}

export async function fetchConfigApi(): Promise<{
  hasKey: boolean;
  maskedKey: string;
  apiKey: string;
  updatedAt: string;
}> {
  const res = await fetch('/api/local/config');
  return res.json();
}

export async function updateConfigApiKey(apiKey: string): Promise<void> {
  await fetch('/api/local/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey }),
  });
}
