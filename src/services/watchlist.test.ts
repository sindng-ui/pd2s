import { describe, it, expect, beforeEach } from 'vitest';
import {
  getStoredWatchlist,
  saveStoredWatchlist,
  getStoredApiKey,
  saveStoredApiKey,
} from './storageService';
import { addWatchItemApi, deleteWatchItemApi } from './marketApi';
import { DEFAULT_CUSTOM_WATCHLIST } from '../constants/defaultWatchlist';

describe('Watchlist Storage & API Unit Test', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('기본 watchlist가 없을 때 DEFAULT_CUSTOM_WATCHLIST 4개를 반환해야 함', () => {
    const list = getStoredWatchlist();
    expect(list.length).toBe(DEFAULT_CUSTOM_WATCHLIST.length);
    expect(list[0].label).toBe(DEFAULT_CUSTOM_WATCHLIST[0].label);
  });

  it('신규 아이템을 addWatchItemApi로 추가하면 맨 앞에 추가되고 즉시 저장되어야 함', async () => {
    const initialList = getStoredWatchlist();
    const newItem = {
      label: '신규 마라 목걸이 (Maras)',
      itemName: "Mara's Kaleidoscope",
      baseCode: 'maras_kaleidoscope',
      category: 'custom' as const,
      stats: [],
    };

    const res = await addWatchItemApi(newItem);
    expect(res.added.label).toBe('신규 마라 목걸이 (Maras)');
    expect(res.items.length).toBe(initialList.length + 1);
    expect(res.items[0].label).toBe('신규 마라 목걸이 (Maras)');

    // localStorage에서 다시 꺼냈을 때도 즉시 존재해야 함
    const reloaded = getStoredWatchlist();
    expect(reloaded.length).toBe(initialList.length + 1);
    expect(reloaded[0].label).toBe('신규 마라 목걸이 (Maras)');
  });

  it('deleteWatchItemApi로 삭제하면 목록에서 제거되어야 함', async () => {
    const initial = getStoredWatchlist();
    const targetId = initial[0].id;

    const afterDelete = await deleteWatchItemApi(targetId);
    expect(afterDelete.length).toBe(initial.length - 1);
    expect(afterDelete.find((i) => i.id === targetId)).toBeUndefined();
  });
});
