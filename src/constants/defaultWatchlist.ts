// C:/AntigravityWorkspace/pd2s/src/constants/defaultWatchlist.ts
import { WatchItemConfig } from '../types/market.types';

export const SEASON_14_START_ISO = '2026-10-23T00:00:00.000Z';
export const SEASON_14_START_DATE = '2026-10-23';

export interface RuneMeta {
  baseCode: string;
  name: string;
  shortName: string;
  tier: number;
  standardHrRef: number; // 유저들 사이에서 통용되는 기준 HR 가이드값 (시즌 초반 참고용)
  iconUrl: string;
}

export const HIGH_RUNE_CATALOG: RuneMeta[] = [
  { baseCode: 'r33', name: 'Zod Rune', shortName: 'Zod', tier: 33, standardHrRef: 5.0, iconUrl: 'https://pd2trader.com/assets/runes/Zod_Rune.png' },
  { baseCode: 'r32', name: 'Cham Rune', shortName: 'Cham', tier: 32, standardHrRef: 2.5, iconUrl: 'https://pd2trader.com/assets/runes/Cham_Rune.png' },
  { baseCode: 'r31', name: 'Jah Rune', shortName: 'Jah', tier: 31, standardHrRef: 1.75, iconUrl: 'https://pd2trader.com/assets/runes/Jah_Rune.png' },
  { baseCode: 'r30', name: 'Ber Rune', shortName: 'Ber', tier: 30, standardHrRef: 3.0, iconUrl: 'https://pd2trader.com/assets/runes/Ber_Rune.png' },
  { baseCode: 'r29', name: 'Sur Rune', shortName: 'Sur', tier: 29, standardHrRef: 1.5, iconUrl: 'https://pd2trader.com/assets/runes/Sur_Rune.png' },
  { baseCode: 'r28', name: 'Lo Rune', shortName: 'Lo', tier: 28, standardHrRef: 1.0, iconUrl: 'https://pd2trader.com/assets/runes/Lo_Rune.png' },
  { baseCode: 'r27', name: 'Ohm Rune', shortName: 'Ohm', tier: 27, standardHrRef: 0.75, iconUrl: 'https://pd2trader.com/assets/runes/Ohm_Rune.png' },
  { baseCode: 'r26', name: 'Vex Rune', shortName: 'Vex', tier: 26, standardHrRef: 0.5, iconUrl: 'https://pd2trader.com/assets/runes/Vex_Rune.png' },
  { baseCode: 'r25', name: 'Gul Rune', shortName: 'Gul', tier: 25, standardHrRef: 0.25, iconUrl: 'https://pd2trader.com/assets/runes/Gul_Rune.png' },
  { baseCode: 'r24', name: 'Ist Rune', shortName: 'Ist', tier: 24, standardHrRef: 0.15, iconUrl: 'https://pd2trader.com/assets/runes/Ist_Rune.png' },
  { baseCode: 'r23', name: 'Mal Rune', shortName: 'Mal', tier: 23, standardHrRef: 0.1, iconUrl: 'https://pd2trader.com/assets/runes/Mal_Rune.png' },
  { baseCode: 'r22', name: 'Um Rune', shortName: 'Um', tier: 22, standardHrRef: 0.05, iconUrl: 'https://pd2trader.com/assets/runes/Um_Rune.png' },
  { baseCode: 'r21', name: 'Pul Rune', shortName: 'Pul', tier: 21, standardHrRef: 0.03, iconUrl: 'https://pd2trader.com/assets/runes/Pul_Rune.png' },
  { baseCode: 'r20', name: 'Lem Rune', shortName: 'Lem', tier: 20, standardHrRef: 0.015, iconUrl: 'https://pd2trader.com/assets/runes/Lem_Rune.png' },
];

export const CORE_CURRENCY_CATALOG = [
  { baseCode: 'wss', name: 'Worldstone Shard', shortName: 'WSS', standardHrRef: 0.01 },
  { baseCode: 'lbox', name: "Larzuk's Puzzlebox", shortName: 'Puzzlebox', standardHrRef: 1.25 },
  { baseCode: 'lpp', name: "Larzuk's Puzzlepiece", shortName: 'Puzzlepiece', standardHrRef: 0.2 },
  { baseCode: 'imrn', name: 'Demonic Cube', shortName: 'Demonic Cube', standardHrRef: 1.5 },
  { baseCode: 'iwss', name: 'Catalyst Shard', shortName: 'Catalyst Shard', standardHrRef: 0.25 },
];

export const DEFAULT_CUSTOM_WATCHLIST: WatchItemConfig[] = [
  {
    id: 'custom-shako-3sk-2os',
    label: '샤코 (+3 올스킬 / 2소켓 졸업)',
    itemName: 'Harlequin Crest',
    baseCode: 'harlequin_crest',
    category: 'custom',
    iconUrl: 'https://pd2trader.com/assets/items/invcap.png',
    socketsMin: 2,
    socketsMax: 2,
    corrupted: 'yes',
    ethereal: 'no',
    stats: [
      {
        kind: 'pseudo',
        key: 'pseudo_all_skills',
        label: '+ 모든 스킬 (All Skills)',
        min: 3,
        enabled: true,
      },
    ],
    createdAt: '2026-10-24T00:00:00.000Z',
  },
  {
    id: 'custom-shako-2os',
    label: '샤코 (2소켓 타락/퍼즐)',
    itemName: 'Harlequin Crest',
    baseCode: 'harlequin_crest',
    category: 'custom',
    iconUrl: 'https://pd2trader.com/assets/items/invcap.png',
    socketsMin: 2,
    socketsMax: 2,
    corrupted: 'any',
    ethereal: 'no',
    stats: [],
    createdAt: '2026-10-24T00:00:00.000Z',
  },
  {
    id: 'custom-shako-clean',
    label: '샤코 (노타락/기본 시세)',
    itemName: 'Harlequin Crest',
    baseCode: 'harlequin_crest',
    category: 'custom',
    iconUrl: 'https://pd2trader.com/assets/items/invcap.png',
    corrupted: 'no',
    ethereal: 'no',
    stats: [],
    createdAt: '2026-10-24T00:00:00.000Z',
  },
  {
    id: 'custom-arachnid-fcr',
    label: '스웹벨트 (Arachnid Mesh)',
    itemName: 'Arachnid Mesh',
    baseCode: 'arachnid_mesh',
    category: 'custom',
    iconUrl: 'https://pd2trader.com/assets/items/invvbl.png',
    corrupted: 'any',
    ethereal: 'no',
    stats: [],
    createdAt: '2026-10-24T00:00:00.000Z',
  },
];
