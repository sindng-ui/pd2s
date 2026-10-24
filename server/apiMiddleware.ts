// C:/AntigravityWorkspace/pd2s/server/apiMiddleware.ts
import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  getServerConfig,
  saveServerConfig,
  getCustomWatchlist,
  saveCustomWatchlist,
  getSnapshots,
  appendSnapshot,
  mergeSoldListings,
} from './storageService';
import {
  fetchRunesAndCurrencyOverview,
  searchItemListings,
  searchCatalogItems,
  fetchItemBaseHistory,
} from './pd2Client';
import { WatchItemConfig } from '../src/types/market.types';

function readBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, status: number, payload: any) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
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

export function createApiMiddleware() {
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const urlStr = req.url || '';
    if (!urlStr.startsWith('/api/local/')) {
      return next();
    }

    const parsedUrl = new URL(urlStr, 'http://localhost');
    const pathname = parsedUrl.pathname;
    const config = getServerConfig();

    try {
      // 1. 설정 조회 및 API 키 저장
      if (pathname === '/api/local/config' && req.method === 'GET') {
        return sendJson(res, 200, {
          hasKey: Boolean(config.apiKey),
          maskedKey: config.apiKey
            ? `${config.apiKey.slice(0, 9)}...${config.apiKey.slice(-4)}`
            : '',
          apiKey: config.apiKey,
          updatedAt: config.updatedAt,
        });
      }

      if (pathname === '/api/local/config' && req.method === 'POST') {
        const body = await readBody(req);
        const saved = saveServerConfig(body.apiKey || '');
        return sendJson(res, 200, saved);
      }

      // 2. 커스텀 관심 아이템(Watchlist) 조회 / 추가 / 삭제
      if (pathname === '/api/local/watchlist' && req.method === 'GET') {
        return sendJson(res, 200, { items: getCustomWatchlist() });
      }

      if (pathname === '/api/local/watchlist' && req.method === 'POST') {
        const body = await readBody(req);
        const current = getCustomWatchlist();
        const newItem: WatchItemConfig = {
          ...body,
          id: body.id || `custom-${Date.now()}`,
          createdAt: body.createdAt || new Date().toISOString(),
        };
        const existsIdx = current.findIndex((i) => i.id === newItem.id);
        if (existsIdx >= 0) {
          current[existsIdx] = newItem;
        } else {
          current.unshift(newItem);
        }
        saveCustomWatchlist(current);
        return sendJson(res, 200, { items: current, added: newItem });
      }

      if (pathname === '/api/local/watchlist' && req.method === 'DELETE') {
        const id = parsedUrl.searchParams.get('id');
        const current = getCustomWatchlist().filter((i) => i.id !== id);
        saveCustomWatchlist(current);
        return sendJson(res, 200, { items: current });
      }

      // 3. 하이룬 & 화폐 종합 시세 조회 (+ 자동 로컬 스냅샷 기록)
      if (pathname === '/api/local/overview' && req.method === 'GET') {
        const isLadder = parsedUrl.searchParams.get('isLadder') !== 'false';
        const isHardcore = parsedUrl.searchParams.get('isHardcore') === 'true';

        const items = await fetchRunesAndCurrencyOverview(
          config.apiKey,
          isLadder,
          isHardcore
        );

        // 로컬 스냅샷 자동 누적 저장
        const { timestamp, dateKey, hourKey } = getKstDateAndHour();
        const priceMap: Record<string, { hr: number; sampleCount?: number }> = {};
        for (const it of items) {
          priceMap[it.baseCode] = {
            hr: it.hrValue,
            sampleCount: it.sampleCount,
          };
        }
        const snapshots = appendSnapshot({
          timestamp,
          dateKey,
          hourKey,
          isLadder,
          isHardcore,
          prices: priceMap,
        });

        return sendJson(res, 200, {
          items,
          snapshots,
          fetchedAt: timestamp,
        });
      }

      // 4. 특정 룬 또는 커스텀 아이템의 Live 매물 + Archive(실거래 완료) 매물 + 히스토리 통합 조회
      if (pathname === '/api/local/item-listings' && req.method === 'POST') {
        const body = await readBody(req);
        const watchConfig: WatchItemConfig = body.watchItem;
        const isLadder = body.isLadder !== false;
        const isHardcore = Boolean(body.isHardcore);

        const [liveRes, archRes, baseHistory] = await Promise.all([
          searchItemListings(config.apiKey, watchConfig, isLadder, isHardcore, 'live', 60),
          searchItemListings(config.apiKey, watchConfig, isLadder, isHardcore, 'archive', 60),
          fetchItemBaseHistory(
            config.apiKey,
            watchConfig.baseCode || watchConfig.itemName,
            isHardcore
          ),
        ]);

        // 아카이브(Sold) 내역을 로컬 영구 DB에 병합하여 30일이 지나도 유실되지 않게 보존
        const persistedSold = mergeSoldListings(watchConfig.id, archRes.items);

        return sendJson(res, 200, {
          watchId: watchConfig.id,
          liveItems: liveRes.items,
          liveTotal: liveRes.total,
          soldItems: persistedSold,
          soldTotal: Math.max(archRes.total, persistedSold.length),
          baseHistory,
          snapshots: getSnapshots().filter(
            (s) => s.isLadder === isLadder && s.isHardcore === isHardcore
          ),
        });
      }

      // 5. 로컬 스냅샷에 커스텀 아이템 추정가 병합 기록
      if (pathname === '/api/local/snapshot-custom' && req.method === 'POST') {
        const body = await readBody(req);
        const { watchId, hr, lowestAsk, sampleCount, isLadder, isHardcore } = body;
        const { timestamp, dateKey, hourKey } = getKstDateAndHour();
        const snapshots = appendSnapshot({
          timestamp,
          dateKey,
          hourKey,
          isLadder: isLadder !== false,
          isHardcore: Boolean(isHardcore),
          prices: {
            [watchId]: { hr, lowestAsk, sampleCount },
          },
        });
        return sendJson(res, 200, { snapshots });
      }

      // 6. 카탈로그 아이템 검색 자동완성
      if (pathname === '/api/local/catalog-search' && req.method === 'GET') {
        const q = parsedUrl.searchParams.get('q') || '';
        const hits = await searchCatalogItems(config.apiKey, q);
        return sendJson(res, 200, { hits });
      }

      return sendJson(res, 404, { error: 'Unknown local API route' });
    } catch (err: any) {
      console.error('[API Middleware Error]:', err);
      return sendJson(res, 500, {
        error: err?.message || 'Internal Server Error',
      });
    }
  };
}
