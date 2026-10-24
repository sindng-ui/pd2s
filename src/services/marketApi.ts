// C:/AntigravityWorkspace/pd2s/src/services/marketApi.ts
import {
  EconomyItemSummary,
  LocalSnapshotRecord,
  PriceHistoryPoint,
  RawMarketListingItem,
  WatchItemConfig,
} from '../types/market.types';
import {
  HIGH_RUNE_CATALOG,
  CORE_CURRENCY_CATALOG,
} from '../constants/defaultWatchlist';
import {
  getStoredApiKey,
  getStoredWatchlist,
  saveStoredWatchlist,
  getStoredSnapshots,
  appendStoredSnapshot,
  mergeStoredSoldListings,
} from './storageService';

const BASE_URL = 'https://pd2trader.com';

async function pd2ClientFetch<T>(
  endpoint: string,
  apiKey: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`PD2 API Error (${res.status}): ${text.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

function getKstDateAndHour() {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const iso = kst.toISOString();
  return {
    timestamp: now.toISOString(),
    dateKey: iso.slice(0, 10),
    hourKey: `${iso.slice(0, 13)}:00`,
  };
}

export async function fetchOverviewApi(
  isLadder: boolean,
  isHardcore: boolean
): Promise<{
  items: EconomyItemSummary[];
  snapshots: LocalSnapshotRecord[];
  fetchedAt: string;
}> {
  const apiKey = getStoredApiKey();
  if (!apiKey) {
    throw new Error('API Key가 등록되어 있지 않습니다. 우측 상단 키 아이콘에서 등록해 주세요.');
  }

  const [runesRes, currRes, gqlRes] = await Promise.allSettled([
    pd2ClientFetch<any>(
      `/api/items?category=runes&isLadder=${isLadder}&isHardcore=${isHardcore}&showLowConfidence=true`,
      apiKey
    ),
    pd2ClientFetch<any>(
      `/api/items?category=currency&isLadder=${isLadder}&isHardcore=${isHardcore}&showLowConfidence=true`,
      apiKey
    ),
    pd2ClientFetch<any>('/graphql', apiKey, {
      method: 'POST',
      body: JSON.stringify({
        query: `query GetRunesHist($hc: Boolean!) {
          r33: item(baseCode: "r33") { baseCode iconUrl history(limit: 30, isHardcore: $hc) { date avgPrice movingAverage } }
          r32: item(baseCode: "r32") { baseCode iconUrl history(limit: 30, isHardcore: $hc) { date avgPrice movingAverage } }
          r31: item(baseCode: "r31") { baseCode iconUrl history(limit: 30, isHardcore: $hc) { date avgPrice movingAverage } }
          r30: item(baseCode: "r30") { baseCode iconUrl history(limit: 30, isHardcore: $hc) { date avgPrice movingAverage } }
          r29: item(baseCode: "r29") { baseCode iconUrl history(limit: 30, isHardcore: $hc) { date avgPrice movingAverage } }
          r28: item(baseCode: "r28") { baseCode iconUrl history(limit: 30, isHardcore: $hc) { date avgPrice movingAverage } }
          r27: item(baseCode: "r27") { baseCode iconUrl history(limit: 30, isHardcore: $hc) { date avgPrice movingAverage } }
          r26: item(baseCode: "r26") { baseCode iconUrl history(limit: 30, isHardcore: $hc) { date avgPrice movingAverage } }
          r25: item(baseCode: "r25") { baseCode iconUrl history(limit: 30, isHardcore: $hc) { date avgPrice movingAverage } }
          r24: item(baseCode: "r24") { baseCode iconUrl history(limit: 30, isHardcore: $hc) { date avgPrice movingAverage } }
          r23: item(baseCode: "r23") { baseCode iconUrl history(limit: 30, isHardcore: $hc) { date avgPrice movingAverage } }
          r22: item(baseCode: "r22") { baseCode iconUrl history(limit: 30, isHardcore: $hc) { date avgPrice movingAverage } }
          r21: item(baseCode: "r21") { baseCode iconUrl history(limit: 30, isHardcore: $hc) { date avgPrice movingAverage } }
          r20: item(baseCode: "r20") { baseCode iconUrl history(limit: 30, isHardcore: $hc) { date avgPrice movingAverage } }
        }`,
        variables: { hc: isHardcore },
      }),
    }),
  ]);

  const runeItemsMap = new Map<string, any>();
  if (runesRes.status === 'fulfilled' && Array.isArray(runesRes.value?.items)) {
    for (const it of runesRes.value.items) runeItemsMap.set(it.baseCode, it);
  }

  const currItemsMap = new Map<string, any>();
  if (currRes.status === 'fulfilled' && Array.isArray(currRes.value?.items)) {
    for (const it of currRes.value.items) currItemsMap.set(it.baseCode, it);
  }

  const historyMap = new Map<string, { iconUrl?: string; history: PriceHistoryPoint[] }>();
  if (gqlRes.status === 'fulfilled' && gqlRes.value?.data) {
    for (const c of Object.values(gqlRes.value.data) as any[]) {
      if (!c || !c.baseCode) continue;
      const pts: PriceHistoryPoint[] = (c.history || []).map((h: any) => ({
        date: String(h.date).slice(0, 10),
        avgPrice: Number(h.avgPrice || 0),
        movingAverage: Number(h.movingAverage || h.avgPrice || 0),
        source: 'api' as const,
      }));
      historyMap.set(c.baseCode, { iconUrl: c.iconUrl, history: pts });
    }
  }

  const items: EconomyItemSummary[] = [];

  for (const meta of HIGH_RUNE_CATALOG) {
    const stat = runeItemsMap.get(meta.baseCode);
    const gqlInfo = historyMap.get(meta.baseCode);
    const lastDay = stat?.lastDayPrice ?? null;
    const ma7 = stat?.movingAverage7Days ?? stat?.price ?? null;
    const hrValue =
      lastDay !== null && lastDay > 0
        ? lastDay
        : ma7 !== null && ma7 > 0
        ? ma7
        : meta.standardHrRef;

    items.push({
      baseCode: meta.baseCode,
      name: meta.name,
      category: 'rune',
      iconUrl: gqlInfo?.iconUrl || meta.iconUrl,
      hrValue,
      lastDayPrice: lastDay,
      medianPrice: stat?.medianPrice ?? null,
      movingAverage7Days: ma7,
      averagePrice: stat?.averagePrice ?? null,
      minPrice: stat?.minPrice ?? null,
      maxPrice: stat?.maxPrice ?? null,
      sampleCount: stat?.sampleCount ?? 0,
      changePercent7d: stat?.priceChange7Days?.changePercent ?? null,
      history: gqlInfo?.history || [],
    });
  }

  for (const meta of CORE_CURRENCY_CATALOG) {
    const stat = currItemsMap.get(meta.baseCode);
    const gqlInfo = historyMap.get(meta.baseCode);
    const lastDay = stat?.lastDayPrice ?? null;
    const ma7 = stat?.movingAverage7Days ?? stat?.price ?? null;
    const hrValue =
      lastDay !== null && lastDay > 0
        ? lastDay
        : ma7 !== null && ma7 > 0
        ? ma7
        : meta.standardHrRef;

    items.push({
      baseCode: meta.baseCode,
      name: meta.name,
      category: 'currency',
      iconUrl: gqlInfo?.iconUrl || undefined,
      hrValue,
      lastDayPrice: lastDay,
      medianPrice: stat?.medianPrice ?? null,
      movingAverage7Days: ma7,
      averagePrice: stat?.averagePrice ?? null,
      minPrice: stat?.minPrice ?? null,
      maxPrice: stat?.maxPrice ?? null,
      sampleCount: stat?.sampleCount ?? 0,
      changePercent7d: stat?.priceChange7Days?.changePercent ?? null,
      history: gqlInfo?.history || [],
    });
  }

  const { timestamp, dateKey, hourKey } = getKstDateAndHour();
  const priceMap: Record<string, { hr: number; sampleCount?: number }> = {};
  for (const it of items) priceMap[it.baseCode] = { hr: it.hrValue, sampleCount: it.sampleCount };

  const snapshots = appendStoredSnapshot({
    timestamp,
    dateKey,
    hourKey,
    isLadder,
    isHardcore,
    prices: priceMap,
  });

  return { items, snapshots, fetchedAt: timestamp };
}

export async function fetchWatchlistApi(): Promise<WatchItemConfig[]> {
  return getStoredWatchlist();
}

export async function addWatchItemApi(
  item: Omit<WatchItemConfig, 'id' | 'createdAt'> & { id?: string }
): Promise<{ items: WatchItemConfig[]; added: WatchItemConfig }> {
  const current = getStoredWatchlist();
  const newItem: WatchItemConfig = {
    ...item,
    id: item.id || `custom-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  const existsIdx = current.findIndex((i) => i.id === newItem.id);
  if (existsIdx >= 0) current[existsIdx] = newItem;
  else current.unshift(newItem);

  saveStoredWatchlist(current);
  return { items: current, added: newItem };
}

export async function deleteWatchItemApi(id: string): Promise<WatchItemConfig[]> {
  const current = getStoredWatchlist().filter((i) => i.id !== id);
  saveStoredWatchlist(current);
  return current;
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
  const apiKey = getStoredApiKey();
  if (!apiKey) throw new Error('API Key가 등록되어 있지 않습니다.');

  const buildFilters = (source: 'live' | 'archive') => {
    const f: Record<string, any> = {
      ladder: isLadder,
      hardcore: isHardcore,
      itemName: watchItem.itemName,
      source,
      maxAgeDays: source === 'archive' ? 30 : 7,
    };
    if (watchItem.socketsMin !== undefined && watchItem.socketsMin >= 0) f.socketsMin = watchItem.socketsMin;
    if (watchItem.socketsMax !== undefined && watchItem.socketsMax >= 0) f.socketsMax = watchItem.socketsMax;
    if (watchItem.corrupted && watchItem.corrupted !== 'any') f.corrupted = watchItem.corrupted;
    if (watchItem.ethereal && watchItem.ethereal !== 'any') f.ethereal = watchItem.ethereal;

    const activeStats = (watchItem.stats || []).filter((s) => s.enabled);
    if (activeStats.length > 0) {
      f.stats = activeStats.map((s) => {
        const r: Record<string, any> = { kind: s.kind, key: s.key, enabled: true };
        if (s.key !== 'item_numsockets') {
          if (s.min !== undefined) r.min = s.min;
          if (s.max !== undefined) r.max = s.max;
        }
        return r;
      });
    }
    return f;
  };

  const mapRawItems = (rawItems: any[], source: 'live' | 'sold'): RawMarketListingItem[] =>
    rawItems.map((entry) => {
      const l = entry.listing || {};
      const it = l.item || {};
      return {
        id: String(l._id || Math.random()),
        status: source,
        createdAt: l.created_at || new Date().toISOString(),
        updatedAt: l.updated_at || l.created_at || new Date().toISOString(),
        bumpedAt: l.bumped_at || l.created_at || new Date().toISOString(),
        hrPrice: typeof l.hr_price === 'number' ? l.hr_price : null,
        rawPriceNote: typeof l.price === 'string' ? l.price : null,
        acceptedOfferId: l.accepted_offer_id || null,
        sellerName: l.user?.username || 'unknown',
        inGameAccount: l.user?.in_game_account || l.account_id || '',
        online: Boolean(l.online || l.in_game),
        itemName: it.name || watchItem.itemName,
        baseCode: it.base_code || watchItem.baseCode || '',
        sockets: Number(it.socket_count ?? 0),
        corrupted: Boolean(it.corrupted),
        ethereal: Boolean(it.is_ethereal),
        modifiers: Array.isArray(it.modifiers) ? it.modifiers : [],
        pseudo: entry.pseudo || {},
      };
    });

  const [liveRes, archRes, gqlRes] = await Promise.allSettled([
    pd2ClientFetch<any>('/api/market/search', apiKey, {
      method: 'POST',
      body: JSON.stringify({ filters: buildFilters('live'), page: 0, limit: 60 }),
    }),
    pd2ClientFetch<any>('/api/market/search', apiKey, {
      method: 'POST',
      body: JSON.stringify({ filters: buildFilters('archive'), page: 0, limit: 60 }),
    }),
    pd2ClientFetch<any>('/graphql', apiKey, {
      method: 'POST',
      body: JSON.stringify({
        query: `query ItemHist($q: String!, $hc: Boolean!) {
          item(query: $q) {
            baseCode name
            history(limit: 45, isHardcore: $hc) { date avgPrice movingAverage }
          }
        }`,
        variables: { q: watchItem.baseCode || watchItem.itemName, hc: isHardcore },
      }),
    }),
  ]);

  const liveRaw = liveRes.status === 'fulfilled' ? liveRes.value?.items || [] : [];
  const archRaw = archRes.status === 'fulfilled' ? archRes.value?.items || [] : [];
  const baseHistRaw = gqlRes.status === 'fulfilled' ? gqlRes.value?.data?.item?.history || [] : [];

  const liveItems = mapRawItems(liveRaw, 'live');
  const soldItems = mapRawItems(archRaw, 'sold');
  const persistedSold = mergeStoredSoldListings(watchItem.id, soldItems);

  const baseHistory: PriceHistoryPoint[] = baseHistRaw.map((h: any) => ({
    date: String(h.date).slice(0, 10),
    avgPrice: Number(h.avgPrice || 0),
    movingAverage: Number(h.movingAverage || h.avgPrice || 0),
    source: 'api' as const,
  }));

  const snapshots = getStoredSnapshots().filter(
    (s) => s.isLadder === isLadder && s.isHardcore === isHardcore
  );

  return {
    watchId: watchItem.id,
    liveItems,
    liveTotal: liveRes.status === 'fulfilled' ? Number(liveRes.value?.total ?? liveItems.length) : liveItems.length,
    soldItems: persistedSold,
    soldTotal: Math.max(archRes.status === 'fulfilled' ? Number(archRes.value?.total ?? 0) : 0, persistedSold.length),
    baseHistory,
    snapshots,
  };
}

export async function recordCustomSnapshotApi(payload: {
  watchId: string;
  hr: number;
  lowestAsk?: number | null;
  sampleCount?: number;
  isLadder: boolean;
  isHardcore: boolean;
}): Promise<void> {
  const { timestamp, dateKey, hourKey } = getKstDateAndHour();
  appendStoredSnapshot({
    timestamp,
    dateKey,
    hourKey,
    isLadder: payload.isLadder !== false,
    isHardcore: Boolean(payload.isHardcore),
    prices: {
      [payload.watchId]: {
        hr: payload.hr,
        lowestAsk: payload.lowestAsk,
        sampleCount: payload.sampleCount,
      },
    },
  });
}

export async function searchCatalogAutocompleteApi(query: string): Promise<any[]> {
  const apiKey = getStoredApiKey();
  if (!apiKey || !query.trim()) return [];
  try {
    const res = await pd2ClientFetch<any>(
      `/api/search?q=${encodeURIComponent(query.trim())}`,
      apiKey
    );
    return (res?.hits || []).map((h: any) => h.item).filter(Boolean);
  } catch {
    return [];
  }
}
