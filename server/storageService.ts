// C:/AntigravityWorkspace/pd2s/server/storageService.ts
import fs from 'node:fs';
import path from 'node:path';
import {
  WatchItemConfig,
  LocalSnapshotRecord,
  RawMarketListingItem,
} from '../src/types/market.types';
import { DEFAULT_CUSTOM_WATCHLIST } from '../src/constants/defaultWatchlist';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const WATCHLIST_FILE = path.join(DATA_DIR, 'watchlist.json');
const SNAPSHOTS_FILE = path.join(DATA_DIR, 'snapshots.json');
const SOLD_ARCHIVE_FILE = path.join(DATA_DIR, 'sold_history.json');

const DEFAULT_API_KEY = 'pd2t_IJjlom7K_2PHqqwTGmyDQqSOwvhEjn3amAy8n5Uao';

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJsonFile<T>(filePath: string, fallback: T): T {
  ensureDataDir();
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2), 'utf-8');
      return fallback;
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`[Storage] Failed to read ${filePath}:`, err);
    return fallback;
  }
}

function writeJsonFile<T>(filePath: string, data: T): void {
  ensureDataDir();
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`[Storage] Failed to write ${filePath}:`, err);
  }
}

export interface ServerConfig {
  apiKey: string;
  updatedAt: string;
}

export function getServerConfig(): ServerConfig {
  return readJsonFile<ServerConfig>(CONFIG_FILE, {
    apiKey: DEFAULT_API_KEY,
    updatedAt: new Date().toISOString(),
  });
}

export function saveServerConfig(apiKey: string): ServerConfig {
  const next: ServerConfig = {
    apiKey: apiKey.trim() || DEFAULT_API_KEY,
    updatedAt: new Date().toISOString(),
  };
  writeJsonFile(CONFIG_FILE, next);
  return next;
}

export function getCustomWatchlist(): WatchItemConfig[] {
  return readJsonFile<WatchItemConfig[]>(WATCHLIST_FILE, DEFAULT_CUSTOM_WATCHLIST);
}

export function saveCustomWatchlist(items: WatchItemConfig[]): WatchItemConfig[] {
  writeJsonFile(WATCHLIST_FILE, items);
  return items;
}

export function getSnapshots(): LocalSnapshotRecord[] {
  return readJsonFile<LocalSnapshotRecord[]>(SNAPSHOTS_FILE, []);
}

export function appendSnapshot(record: LocalSnapshotRecord): LocalSnapshotRecord[] {
  const list = getSnapshots();
  // 동일 시간대(hourKey) + 동일 리그(isLadder, isHardcore) 스냅샷이 이미 있으면 병합(덮어쓰기)
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

  // 최대 2,000개 스냅샷 보관
  const trimmed = list.slice(-2000);
  writeJsonFile(SNAPSHOTS_FILE, trimmed);
  return trimmed;
}

export function getSoldHistoryMap(): Record<string, RawMarketListingItem[]> {
  return readJsonFile<Record<string, RawMarketListingItem[]>>(SOLD_ARCHIVE_FILE, {});
}

export function mergeSoldListings(
  watchKey: string,
  newSoldItems: RawMarketListingItem[]
): RawMarketListingItem[] {
  if (!newSoldItems.length) {
    const map = getSoldHistoryMap();
    return map[watchKey] || [];
  }
  const map = getSoldHistoryMap();
  const current = map[watchKey] || [];
  const byId = new Map<string, RawMarketListingItem>();

  for (const item of current) {
    byId.set(item.id, item);
  }
  for (const item of newSoldItems) {
    byId.set(item.id, item);
  }

  const merged = Array.from(byId.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  map[watchKey] = merged.slice(0, 300); // 항목당 최대 300건 영구 보존
  writeJsonFile(SOLD_ARCHIVE_FILE, map);
  return map[watchKey];
}
