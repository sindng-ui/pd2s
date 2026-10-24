// C:/AntigravityWorkspace/pd2s/src/workers/marketAnalysis.worker.ts
import {
  AnalyzedItemResult,
  BarterCategory,
  BarterSummaryTag,
  LocalSnapshotRecord,
  ParsedMarketListing,
  PriceHistoryPoint,
  RawMarketListingItem,
  WatchItemConfig,
} from '../types/market.types';
import { SEASON_14_START_ISO } from '../constants/defaultWatchlist';

const RUNE_PATTERNS: Array<{ key: string; label: string; defaultHr: number; regex: RegExp }> = [
  { key: 'r33', label: 'Zod', defaultHr: 5.0, regex: /\b(\d+)?\s*x?\s*zod\b/i },
  { key: 'r32', label: 'Cham', defaultHr: 2.5, regex: /\b(\d+)?\s*x?\s*cham\b/i },
  { key: 'r31', label: 'Jah', defaultHr: 1.75, regex: /\b(\d+)?\s*x?\s*jah\b/i },
  { key: 'r30', label: 'Ber', defaultHr: 3.0, regex: /\b(\d+)?\s*x?\s*ber\b/i },
  { key: 'r29', label: 'Sur', defaultHr: 1.5, regex: /\b(\d+)?\s*x?\s*sur\b/i },
  { key: 'r28', label: 'Lo', defaultHr: 1.0, regex: /\b(\d+)?\s*x?\s*lo\b/i },
  { key: 'r27', label: 'Ohm', defaultHr: 0.75, regex: /\b(\d+)?\s*x?\s*ohm\b/i },
  { key: 'r26', label: 'Vex', defaultHr: 0.5, regex: /\b(\d+)?\s*x?\s*vex\b/i },
  { key: 'r25', label: 'Gul', defaultHr: 0.25, regex: /\b(\d+)?\s*x?\s*gul\b/i },
  { key: 'r24', label: 'Ist', defaultHr: 0.15, regex: /\b(\d+)?\s*x?\s*ist\b/i },
  { key: 'r23', label: 'Mal', defaultHr: 0.1, regex: /\b(\d+)?\s*x?\s*mal\b/i },
  { key: 'r22', label: 'Um', defaultHr: 0.05, regex: /\b(\d+)?\s*x?\s*um\b/i },
  { key: 'r21', label: 'Pul', defaultHr: 0.03, regex: /\b(\d+)?\s*x?\s*pul\b/i },
  { key: 'r20', label: 'Lem', defaultHr: 0.015, regex: /\b(\d+)?\s*x?\s*lem\b/i },
];

const CATEGORY_LABELS: Record<BarterCategory, string> = {
  PURE_HR: '순수 HR 표기',
  WSS: '세계석 파편 (WSS)',
  RUNE_EXCHANGE: '특정 룬 지명 교환',
  RUNE_BREAK: '하위 룬 쪼개기 (Break)',
  GEMS_MATS: '보석 / 퍼즐 / 재료 교환',
  OFFER_OTHER: '오퍼 / 기타 협상',
};

function parseSingleListing(
  raw: RawMarketListingItem,
  runePriceMap: Record<string, number>
): ParsedMarketListing {
  const note = (raw.rawPriceNote || '').trim();
  const wssRate = runePriceMap['wss'] || 0.01;

  let estimatedHr: number | null = raw.hrPrice !== null && raw.hrPrice > 0 ? raw.hrPrice : null;
  let barterCategory: BarterCategory = 'OFFER_OTHER';
  let normalizedPaymentText = note || (estimatedHr ? `${estimatedHr} HR` : '오퍼 (가격 미기재)');

  const lower = note.toLowerCase();

  // 1. Check WSS (예: "25 wss", "300wss")
  const wssMatch = lower.match(/(\d+(?:\.\d+)?)\s*x?\s*wss\b/);
  if (wssMatch) {
    const qty = parseFloat(wssMatch[1]);
    barterCategory = 'WSS';
    normalizedPaymentText = `WSS × ${qty}개`;
    if (estimatedHr === null && qty > 0) {
      estimatedHr = Number((qty * wssRate).toFixed(3));
    }
  }
  // 2. Check Rune Break (예: "1.5 break", "break")
  else if (/\bbreak\b/i.test(lower)) {
    barterCategory = 'RUNE_BREAK';
    const numMatch = lower.match(/(\d+(?:\.\d+)?)/);
    if (numMatch && estimatedHr === null) {
      estimatedHr = parseFloat(numMatch[1]);
    }
    normalizedPaymentText = estimatedHr ? `${estimatedHr} HR 하위룬 쪼개기` : `룬 쪼개기 (${note})`;
  }
  // 3. Check Gems / Puzzlebox / Keys / Mats
  else if (/\b(pgem|gems?|skulls?|ruble|ral|sol|key|3x3|pbox|puzzlebox|piece)\b/i.test(lower)) {
    barterCategory = 'GEMS_MATS';
    const gemMatch = lower.match(/(\d+)\s*(?:p?gems?|skulls?)/i);
    if (gemMatch) {
      const qty = parseInt(gemMatch[1], 10);
      normalizedPaymentText = `보석/해골 × ${qty}개`;
      if (estimatedHr === null) {
        estimatedHr = Number((qty * 0.0025).toFixed(3));
      }
    } else {
      normalizedPaymentText = `재료/보석 (${note})`;
    }
  }
  // 4. Check Specific Rune Names (예: "2 sur", "jah + ohm", "vex")
  else {
    const matchedRunes: string[] = [];
    let sumRuneHr = 0;

    for (const r of RUNE_PATTERNS) {
      const m = lower.match(r.regex);
      if (m) {
        const count = m[1] ? parseInt(m[1], 10) : 1;
        const unitHr = runePriceMap[r.key] || r.defaultHr;
        sumRuneHr += count * unitHr;
        matchedRunes.push(count > 1 ? `${r.label} × ${count}` : r.label);
      }
    }

    if (matchedRunes.length > 0) {
      barterCategory = 'RUNE_EXCHANGE';
      normalizedPaymentText = matchedRunes.join(' + ');
      // "or"가 들어있으면 평균이 아니라 단일 옵션이므로 첫 번째 룬 기준 보정
      if (/\bor\b/i.test(lower) && matchedRunes.length > 1) {
        normalizedPaymentText = matchedRunes.join(' 또는 ');
        const firstRune = RUNE_PATTERNS.find((rp) => lower.match(rp.regex));
        if (firstRune && estimatedHr === null) {
          const m = lower.match(firstRune.regex);
          const cnt = m && m[1] ? parseInt(m[1], 10) : 1;
          estimatedHr = Number((cnt * (runePriceMap[firstRune.key] || firstRune.defaultHr)).toFixed(2));
        }
      } else if (estimatedHr === null && sumRuneHr > 0) {
        estimatedHr = Number(sumRuneHr.toFixed(2));
      }
    } else {
      // 5. Check Pure Numeric HR (예: "0.6", ".25", "3 hr", "1.25")
      const pureNumMatch = lower.match(/^(?:hr\s*)?(\d*\.\d+|\d+)(?:\s*hr)?$/);
      if (pureNumMatch || (estimatedHr !== null && !note)) {
        barterCategory = 'PURE_HR';
        const val = pureNumMatch ? parseFloat(pureNumMatch[1]) : estimatedHr!;
        if (estimatedHr === null && val > 0 && val <= 100) {
          estimatedHr = val;
        }
        normalizedPaymentText = `${estimatedHr ?? val} HR`;
      } else if (estimatedHr !== null) {
        barterCategory = 'PURE_HR';
        normalizedPaymentText = note ? `${estimatedHr} HR (${note})` : `${estimatedHr} HR`;
      }
    }
  }

  // Extract key modifiers summary for UI display
  const keyModSummary: string[] = [];
  if (raw.sockets > 0) keyModSummary.push(`${raw.sockets}소켓`);
  if (raw.corrupted) keyModSummary.push('타락(Corrupted)');
  if (raw.ethereal) keyModSummary.push('에테리얼(Eth)');

  if (raw.pseudo?.pseudo_all_skills > 0) {
    keyModSummary.push(`+${raw.pseudo.pseudo_all_skills} 올스킬`);
  }
  for (const mod of (raw.modifiers || []).slice(0, 4)) {
    if (mod.corrupted && mod.label) {
      keyModSummary.push(`[타락] ${mod.label}`);
    }
  }

  return {
    ...raw,
    estimatedHr,
    barterCategory,
    barterCategoryLabel: CATEGORY_LABELS[barterCategory],
    normalizedPaymentText,
    keyModSummary,
  };
}

function calcMedian(nums: number[]): number | null {
  if (!nums.length) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const val = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  return Number(val.toFixed(3));
}

export function analyzeWatchItemData(payload: {
  watchItem: WatchItemConfig;
  liveItems: RawMarketListingItem[];
  soldItems: RawMarketListingItem[];
  baseHistory: PriceHistoryPoint[];
  snapshots: LocalSnapshotRecord[];
  runePriceMap: Record<string, number>;
  seasonOnly: boolean;
}): AnalyzedItemResult {
  const {
    watchItem,
    liveItems,
    soldItems,
    baseHistory,
    snapshots,
    runePriceMap,
    seasonOnly,
  } = payload;

  const s14StartMs = new Date(SEASON_14_START_ISO).getTime();

  const allRaw = [...liveItems, ...soldItems];
  const s14PureCount = allRaw.filter(
    (r) => new Date(r.updatedAt || r.createdAt).getTime() >= s14StartMs
  ).length;

  const filteredLive = seasonOnly
    ? liveItems.filter((r) => new Date(r.updatedAt || r.createdAt).getTime() >= s14StartMs)
    : liveItems;
  const filteredSold = seasonOnly
    ? soldItems.filter((r) => new Date(r.updatedAt || r.createdAt).getTime() >= s14StartMs)
    : soldItems;

  // 시즌 초반이라 필터링 후 데이터가 0건이면 전체 데이터를 폴백으로 사용
  const targetLive = filteredLive.length > 0 ? filteredLive : liveItems;
  const targetSold = filteredSold.length > 0 ? filteredSold : soldItems;

  const parsedLive = targetLive.map((r) => parseSingleListing(r, runePriceMap));
  const parsedSold = targetSold.map((r) => parseSingleListing(r, runePriceMap));
  const parsedListings = [...parsedSold, ...parsedLive].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  const liveHrs = parsedLive
    .map((p) => p.estimatedHr)
    .filter((v): v is number => v !== null && v > 0);
  const soldHrs = parsedSold
    .map((p) => p.estimatedHr)
    .filter((v): v is number => v !== null && v > 0);

  const lowestLiveHr = liveHrs.length > 0 ? Math.min(...liveHrs) : null;
  const medianSoldHr = calcMedian(soldHrs);
  const medianLiveHr = calcMedian(liveHrs);

  const currentHr =
    medianSoldHr ??
    medianLiveHr ??
    (watchItem.baseCode ? runePriceMap[watchItem.baseCode] ?? null : null);

  // 거래 수단(Barter Category) 비율 집계
  const catCounts = new Map<BarterCategory, number>();
  const paymentGroupMap = new Map<
    string,
    { category: BarterCategory; count: number; hrs: number[] }
  >();

  for (const item of parsedListings) {
    catCounts.set(item.barterCategory, (catCounts.get(item.barterCategory) || 0) + 1);
    const key = item.normalizedPaymentText;
    const prev = paymentGroupMap.get(key) || {
      category: item.barterCategory,
      count: 0,
      hrs: [],
    };
    prev.count += 1;
    if (item.estimatedHr !== null && item.estimatedHr > 0) {
      prev.hrs.push(item.estimatedHr);
    }
    paymentGroupMap.set(key, prev);
  }

  const totalCount = parsedListings.length || 1;
  const barterBreakdown = Array.from(catCounts.entries())
    .map(([category, count]) => ({
      category,
      label: CATEGORY_LABELS[category],
      count,
      percentage: Math.round((count / totalCount) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  const topPaymentMethods: BarterSummaryTag[] = Array.from(paymentGroupMap.entries())
    .map(([label, info]) => ({
      label,
      category: info.category,
      count: info.count,
      percentage: Math.round((info.count / totalCount) * 100),
      avgHr: calcMedian(info.hrs),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // 날짜별 시세 추이(Time-Series) 생성:
  // 1) 커스텀 세부 조건이 없는 일반 룬/아이템은 API baseHistory 활용
  // 2) 커스텀 세부 조건(예: 샤코 3스킬 2소켓)이 있는 경우 매물/아카이브 일자별 역산 + 로컬 스냅샷 병합
  const hasCustomFilters =
    (watchItem.socketsMin !== undefined && watchItem.socketsMin > 0) ||
    (watchItem.corrupted && watchItem.corrupted !== 'any') ||
    (watchItem.stats && watchItem.stats.some((s) => s.enabled));

  const trendByDate = new Map<string, PriceHistoryPoint>();

  if (!hasCustomFilters) {
    for (const pt of baseHistory) {
      if (seasonOnly && pt.date < '2026-10-23') continue;
      trendByDate.set(pt.date, pt);
    }
  }

  // 매물 및 거래 완료 타임스탬프로 일자별/시간대별 데이터 보강 (Backfill)
  const listingBuckets = new Map<string, number[]>();
  for (const p of parsedListings) {
    if (p.estimatedHr === null || p.estimatedHr <= 0) continue;
    const dt = (p.updatedAt || p.createdAt).slice(0, 10);
    if (seasonOnly && dt < '2026-10-23') continue;
    const arr = listingBuckets.get(dt) || [];
    arr.push(p.estimatedHr);
    listingBuckets.set(dt, arr);
  }

  for (const [dt, hrs] of listingBuckets.entries()) {
    const med = calcMedian(hrs) || hrs[0];
    const min = Math.min(...hrs);
    const avg = Number((hrs.reduce((a, b) => a + b, 0) / hrs.length).toFixed(3));
    const existing = trendByDate.get(dt);
    if (!existing || hasCustomFilters) {
      trendByDate.set(dt, {
        date: dt,
        avgPrice: avg,
        medianPrice: med,
        minPrice: min,
        movingAverage: existing?.movingAverage ?? med,
        sampleCount: hrs.length,
        source: 'listing_derived',
      });
    }
  }

  // 로컬 스냅샷 DB 데이터 병합
  for (const snap of snapshots) {
    if (seasonOnly && snap.dateKey < '2026-10-23') continue;
    const snapEntry =
      snap.prices[watchItem.id] ||
      (watchItem.baseCode ? snap.prices[watchItem.baseCode] : undefined);
    if (snapEntry && snapEntry.hr > 0) {
      const existing = trendByDate.get(snap.dateKey);
      trendByDate.set(snap.dateKey, {
        date: snap.dateKey,
        avgPrice: snapEntry.hr,
        medianPrice: existing?.medianPrice ?? snapEntry.hr,
        minPrice: snapEntry.lowestAsk ?? existing?.minPrice ?? snapEntry.hr,
        movingAverage: existing?.movingAverage ?? snapEntry.hr,
        sampleCount: snapEntry.sampleCount ?? existing?.sampleCount ?? 1,
        source: 'snapshot',
      });
    }
  }

  // 만약 시즌 첫날이라 포인트가 1개 이하라면 전체 baseHistory를 참고용으로 함께 제공
  if (trendByDate.size === 0 && baseHistory.length > 0) {
    for (const pt of baseHistory.slice(-14)) {
      trendByDate.set(pt.date, pt);
    }
  }

  const trendPoints = Array.from(trendByDate.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  return {
    watchId: watchItem.id,
    currentHr,
    lowestLiveHr,
    medianSoldHr,
    liveCount: parsedLive.length,
    soldCount: parsedSold.length,
    s14PureCount,
    barterBreakdown,
    topPaymentMethods,
    parsedListings,
    trendPoints,
  };
}

// Web Worker Message Handler
self.onmessage = (e: MessageEvent) => {
  const { type, requestId, payload } = e.data;
  if (type === 'ANALYZE_ITEM') {
    try {
      const result = analyzeWatchItemData(payload);
      self.postMessage({ type: 'ANALYZE_ITEM_DONE', requestId, result });
    } catch (err: any) {
      self.postMessage({
        type: 'ANALYZE_ITEM_ERROR',
        requestId,
        error: err?.message || 'Worker analysis error',
      });
    }
  }
};
