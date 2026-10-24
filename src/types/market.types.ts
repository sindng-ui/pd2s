// C:/AntigravityWorkspace/pd2s/src/types/market.types.ts

export interface RealmMode {
  isLadder: boolean;
  isHardcore: boolean;
  seasonOnly: boolean; // true = Filter from S14 start (2026-10-23)
}

export interface StatFilterRule {
  kind: 'mod' | 'pseudo' | 'corruption';
  key: string;
  label: string;
  min?: number;
  max?: number;
  enabled: boolean;
}

export interface WatchItemConfig {
  id: string;
  label: string;               // 사용자 표시 별칭 (예: "샤코 (3스킬 / 2소켓)")
  itemName: string;            // 정확한 아이템 이름 (예: "Harlequin Crest")
  baseCode?: string;           // 예: "harlequin_crest", "r30"
  category: 'rune' | 'currency' | 'custom';
  iconUrl?: string;
  tierOrder?: number;          // 룬 정렬 순서 (Zod=33 ~ Lem=20)
  // 커스텀 세부 조건 필터
  socketsMin?: number;
  socketsMax?: number;
  corrupted?: 'any' | 'yes' | 'no';
  ethereal?: 'any' | 'yes' | 'no';
  stats: StatFilterRule[];
  createdAt: string;
}

export interface EconomyItemSummary {
  baseCode: string;
  name: string;
  category: 'rune' | 'currency' | 'ubers';
  iconUrl?: string;
  hrValue: number;             // 현재 기준 HR (S14 보정 적용)
  lastDayPrice: number | null;
  medianPrice: number | null;
  movingAverage7Days: number | null;
  averagePrice: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  sampleCount: number;
  changePercent7d: number | null;
  liveListingCount?: number;
  lowestLiveHr?: number | null;
  topBarterTags?: BarterSummaryTag[];
  history: PriceHistoryPoint[];
}

export interface PriceHistoryPoint {
  date: string;                // YYYY-MM-DD 또는 YYYY-MM-DD HH:00
  avgPrice: number;
  medianPrice?: number;
  minPrice?: number;
  movingAverage?: number;
  sampleCount?: number;
  source: 'api' | 'snapshot' | 'listing_derived';
}

export interface RawMarketListingItem {
  id: string;
  status: 'live' | 'sold';
  createdAt: string;
  updatedAt: string;
  bumpedAt: string;
  hrPrice: number | null;
  rawPriceNote: string | null;
  acceptedOfferId: string | null;
  sellerName: string;
  inGameAccount: string;
  online: boolean;
  itemName: string;
  baseCode: string;
  sockets: number;
  corrupted: boolean;
  ethereal: boolean;
  modifiers: Array<{
    name: string;
    values: number[];
    label: string;
    corrupted?: boolean;
  }>;
  pseudo: Record<string, number>;
}

export type BarterCategory =
  | 'PURE_HR'         // 순수 HR 숫자 표기 (예: "3.0", "1.5 hr")
  | 'WSS'             // 세계석 파편 (예: "25 wss", "300wss")
  | 'RUNE_EXCHANGE'   // 특정 룬 지명 교환 (예: "2 sur", "jah + ohm", "vex")
  | 'RUNE_BREAK'      // 하위 룬 쪼개기 요청 (예: "1.5 break", "break")
  | 'GEMS_MATS'       // 보석/크래프팅 재료/열쇠 (예: "100 pgem", "3x3 key")
  | 'OFFER_OTHER';    // 오퍼/기타 (예: "offer", "free")

export interface ParsedMarketListing extends RawMarketListingItem {
  estimatedHr: number | null;        // hrPrice가 없어도 텍스트에서 역산한 HR 가치
  barterCategory: BarterCategory;
  barterCategoryLabel: string;
  normalizedPaymentText: string;     // 예: "Sur × 2", "25 WSS", "1.5 HR (Break)"
  keyModSummary: string[];           // 예: ["+3 All Skills", "2 Sockets", "Corrupted"]
}

export interface BarterSummaryTag {
  label: string;                     // 예: "Sur × 2", "20~30 WSS", "1.5 Break"
  category: BarterCategory;
  count: number;
  percentage: number;
  avgHr: number | null;
}

export interface AnalyzedItemResult {
  watchId: string;
  currentHr: number | null;
  lowestLiveHr: number | null;
  medianSoldHr: number | null;
  liveCount: number;
  soldCount: number;
  s14PureCount: number;
  barterBreakdown: Array<{
    category: BarterCategory;
    label: string;
    count: number;
    percentage: number;
  }>;
  topPaymentMethods: BarterSummaryTag[];
  parsedListings: ParsedMarketListing[];
  trendPoints: PriceHistoryPoint[];
}

export interface LocalSnapshotRecord {
  timestamp: string;                 // ISO string
  dateKey: string;                   // YYYY-MM-DD (KST)
  hourKey: string;                   // YYYY-MM-DD HH:00 (KST)
  isLadder: boolean;
  isHardcore: boolean;
  prices: Record<string, {           // key = watchId or baseCode
    hr: number;
    lowestAsk?: number | null;
    sampleCount?: number;
  }>;
}
