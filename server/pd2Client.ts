// C:/AntigravityWorkspace/pd2s/server/pd2Client.ts
import {
  EconomyItemSummary,
  PriceHistoryPoint,
  RawMarketListingItem,
  WatchItemConfig,
} from '../src/types/market.types';
import {
  HIGH_RUNE_CATALOG,
  CORE_CURRENCY_CATALOG,
} from '../src/constants/defaultWatchlist';

const BASE_URL = 'https://pd2trader.com';

async function pd2Fetch<T>(
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

/**
 * GraphQL을 통해 하이룬(Lem~Zod) 및 핵심 화폐의 현재 시세와 일자별 history 배열을 한 번에 가져옴
 */
export async function fetchRunesAndCurrencyOverview(
  apiKey: string,
  isLadder: boolean,
  isHardcore: boolean
): Promise<EconomyItemSummary[]> {
  const [runesRes, currRes, gqlRes] = await Promise.allSettled([
    pd2Fetch<any>(
      `/api/items?category=runes&isLadder=${isLadder}&isHardcore=${isHardcore}&showLowConfidence=true`,
      apiKey
    ),
    pd2Fetch<any>(
      `/api/items?category=currency&isLadder=${isLadder}&isHardcore=${isHardcore}&showLowConfidence=true`,
      apiKey
    ),
    pd2Fetch<any>('/graphql', apiKey, {
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
    for (const it of runesRes.value.items) {
      runeItemsMap.set(it.baseCode, it);
    }
  }

  const currItemsMap = new Map<string, any>();
  if (currRes.status === 'fulfilled' && Array.isArray(currRes.value?.items)) {
    for (const it of currRes.value.items) {
      currItemsMap.set(it.baseCode, it);
    }
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

  const results: EconomyItemSummary[] = [];

  // 1. High Runes (Zod r33 ~ Lem r20)
  for (const meta of HIGH_RUNE_CATALOG) {
    const stat = runeItemsMap.get(meta.baseCode);
    const gqlInfo = historyMap.get(meta.baseCode);

    // 시즌 초반 보정: lastDayPrice가 있으면 최우선, 그 다음 price(movingAverage7Days), 없으면 표준 가이드값
    const lastDay = stat?.lastDayPrice ?? null;
    const median = stat?.medianPrice ?? null;
    const ma7 = stat?.movingAverage7Days ?? stat?.price ?? null;
    const hrValue =
      lastDay !== null && lastDay > 0
        ? lastDay
        : ma7 !== null && ma7 > 0
        ? ma7
        : meta.standardHrRef;

    results.push({
      baseCode: meta.baseCode,
      name: meta.name,
      category: 'rune',
      iconUrl: gqlInfo?.iconUrl || meta.iconUrl,
      hrValue,
      lastDayPrice: lastDay,
      medianPrice: median,
      movingAverage7Days: ma7,
      averagePrice: stat?.averagePrice ?? null,
      minPrice: stat?.minPrice ?? null,
      maxPrice: stat?.maxPrice ?? null,
      sampleCount: stat?.sampleCount ?? 0,
      changePercent7d: stat?.priceChange7Days?.changePercent ?? null,
      history: gqlInfo?.history || [],
    });
  }

  // 2. Core Currency
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

    results.push({
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

  return results;
}

/**
 * 특정 룬 또는 커스텀 세부 조건 아이템의 Live(현재 판매중) 및 Archive(실제 거래 완료) 매물 검색
 */
export async function searchItemListings(
  apiKey: string,
  config: WatchItemConfig,
  isLadder: boolean,
  isHardcore: boolean,
  source: 'live' | 'archive',
  limit = 50
): Promise<{ items: RawMarketListingItem[]; total: number }> {
  const filters: Record<string, any> = {
    ladder: isLadder,
    hardcore: isHardcore,
    itemName: config.itemName,
    source,
    maxAgeDays: source === 'archive' ? 30 : 7,
  };

  if (config.socketsMin !== undefined && config.socketsMin >= 0) {
    filters.socketsMin = config.socketsMin;
  }
  if (config.socketsMax !== undefined && config.socketsMax >= 0) {
    filters.socketsMax = config.socketsMax;
  }
  if (config.corrupted && config.corrupted !== 'any') {
    filters.corrupted = config.corrupted;
  }
  if (config.ethereal && config.ethereal !== 'any') {
    filters.ethereal = config.ethereal;
  }

  const activeStats = (config.stats || []).filter((s) => s.enabled);
  if (activeStats.length > 0) {
    filters.stats = activeStats.map((s) => {
      const rule: Record<string, any> = {
        kind: s.kind,
        key: s.key,
        enabled: true,
      };
      // 소켓 타락 등 값 범위가 없는 모디파이어는 min/max 제외
      if (s.key !== 'item_numsockets') {
        if (s.min !== undefined) rule.min = s.min;
        if (s.max !== undefined) rule.max = s.max;
      }
      return rule;
    });
  }

  const res = await pd2Fetch<any>('/api/market/search', apiKey, {
    method: 'POST',
    body: JSON.stringify({
      filters,
      page: 0,
      limit,
    }),
  });

  const rawItems: any[] = res?.items || [];
  const mapped: RawMarketListingItem[] = rawItems.map((entry) => {
    const l = entry.listing || {};
    const it = l.item || {};
    return {
      id: String(l._id || Math.random()),
      status: source === 'archive' ? 'sold' : 'live',
      createdAt: l.created_at || new Date().toISOString(),
      updatedAt: l.updated_at || l.created_at || new Date().toISOString(),
      bumpedAt: l.bumped_at || l.created_at || new Date().toISOString(),
      hrPrice: typeof l.hr_price === 'number' ? l.hr_price : null,
      rawPriceNote: typeof l.price === 'string' ? l.price : null,
      acceptedOfferId: l.accepted_offer_id || null,
      sellerName: l.user?.username || 'unknown',
      inGameAccount: l.user?.in_game_account || l.account_id || '',
      online: Boolean(l.online || l.in_game),
      itemName: it.name || config.itemName,
      baseCode: it.base_code || config.baseCode || '',
      sockets: Number(it.socket_count ?? 0),
      corrupted: Boolean(it.corrupted),
      ethereal: Boolean(it.is_ethereal),
      modifiers: Array.isArray(it.modifiers) ? it.modifiers : [],
      pseudo: entry.pseudo || {},
    };
  });

  return {
    items: mapped,
    total: Number(res?.total ?? mapped.length),
  };
}

/**
 * 아이템 자동완성 검색 (/api/search)
 */
export async function searchCatalogItems(apiKey: string, query: string): Promise<any[]> {
  if (!query.trim()) return [];
  const res = await pd2Fetch<any>(
    `/api/search?q=${encodeURIComponent(query.trim())}`,
    apiKey
  );
  return (res?.hits || []).map((h: any) => h.item).filter(Boolean);
}

/**
 * 특정 아이템의 기본 일별 히스토리 조회 (GraphQL)
 */
export async function fetchItemBaseHistory(
  apiKey: string,
  itemNameOrCode: string,
  isHardcore: boolean
): Promise<PriceHistoryPoint[]> {
  try {
    const res = await pd2Fetch<any>('/graphql', apiKey, {
      method: 'POST',
      body: JSON.stringify({
        query: `query ItemHist($q: String!, $hc: Boolean!) {
          item(query: $q) {
            baseCode
            name
            history(limit: 45, isHardcore: $hc) {
              date
              avgPrice
              movingAverage
            }
          }
        }`,
        variables: { q: itemNameOrCode, hc: isHardcore },
      }),
    });
    const hist = res?.data?.item?.history || [];
    return hist.map((h: any) => ({
      date: String(h.date).slice(0, 10),
      avgPrice: Number(h.avgPrice || 0),
      movingAverage: Number(h.movingAverage || h.avgPrice || 0),
      source: 'api' as const,
    }));
  } catch {
    return [];
  }
}
