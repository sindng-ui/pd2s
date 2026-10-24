// C:/AntigravityWorkspace/pd2s/src/constants/statPresets.ts
import { StatFilterRule } from '../types/market.types';

export interface StatPresetOption {
  kind: 'pseudo' | 'mod' | 'corruption';
  key: string;
  label: string;
  description: string;
  defaultMin: number;
}

export const STAT_PRESET_OPTIONS: StatPresetOption[] = [
  {
    kind: 'pseudo',
    key: 'pseudo_all_skills',
    label: '+ 모든 스킬 합계 (Total All Skills)',
    description: '기본 스킬 + 타락(+1 스킬) 합산 값 (예: 샤코 3스킬 = min: 3)',
    defaultMin: 3,
  },
  {
    kind: 'mod',
    key: 'item_allskills',
    label: '+ 모든 스킬 (Explicit All Skills)',
    description: '아이템 자체 + 모든 스킬 수치',
    defaultMin: 2,
  },
  {
    kind: 'pseudo',
    key: 'pseudo_skill_tab',
    label: '+ 직업 스킬 탭 (Skill Tab)',
    description: '특정 클래스 스킬 탭 합계',
    defaultMin: 2,
  },
  {
    kind: 'pseudo',
    key: 'pseudo_fcr',
    label: '시전 속도 증가 (FCR %)',
    description: 'Faster Cast Rate 합계 (타락 포함)',
    defaultMin: 20,
  },
  {
    kind: 'pseudo',
    key: 'pseudo_ias',
    label: '공격 속도 증가 (IAS %)',
    description: 'Increased Attack Speed 합계 (타락 포함)',
    defaultMin: 20,
  },
  {
    kind: 'pseudo',
    key: 'pseudo_enhanced_damage',
    label: '증가된 피해 (Enhanced Damage %)',
    description: '무기/방어구 증뎀 합계 (%)',
    defaultMin: 300,
  },
  {
    kind: 'mod',
    key: 'damageresist',
    label: '물리 피해 감소 (PDR %)',
    description: 'Physical Damage Taken Reduced by %',
    defaultMin: 10,
  },
  {
    kind: 'pseudo',
    key: 'pseudo_all_res',
    label: '모든 저항 (All Resistances %)',
    description: '모든 저항 합계 (%)',
    defaultMin: 15,
  },
  {
    kind: 'pseudo',
    key: 'pseudo_total_res',
    label: '저항 총합 (Total Elemental Res %)',
    description: '화염+냉기+번개+독 저항 총합',
    defaultMin: 60,
  },
  {
    kind: 'pseudo',
    key: 'pseudo_mf',
    label: '매직 아이템 발견 확률 (MF %)',
    description: 'Better Chance of Getting Magic Items %',
    defaultMin: 40,
  },
  {
    kind: 'pseudo',
    key: 'pseudo_frw',
    label: '달리기/걷기 속도 (FRW %)',
    description: 'Faster Run/Walk %',
    defaultMin: 30,
  },
  {
    kind: 'pseudo',
    key: 'pseudo_fhr',
    label: '타격 회복 속도 (FHR %)',
    description: 'Faster Hit Recovery %',
    defaultMin: 20,
  },
  {
    kind: 'pseudo',
    key: 'pseudo_enemy_res',
    label: '적 속성 저항 깎기 (-Enemy Res %)',
    description: '유니크/주얼 적 저항 감소 합계',
    defaultMin: 10,
  },
  {
    kind: 'pseudo',
    key: 'pseudo_skill_damage',
    label: '속성 스킬 피해 증가 (+Skill Damage %)',
    description: '화염/냉기/번개/독/마법 스킬 데미지 %',
    defaultMin: 10,
  },
  {
    kind: 'corruption',
    key: 'item_numsockets',
    label: '타락 옵션: 추가 소켓 (Corrupted Sockets)',
    description: 'WSS 타락으로 소켓이 뚫린 아이템',
    defaultMin: 1,
  },
];

/**
 * 인게임 Ctrl+C 클립보드 텍스트를 파싱하여 아이템 이름, 소켓, 타락 여부, 주요 스탯 필터를 자동 추출
 */
export function parseClipboardItemText(rawText: string): {
  itemName?: string;
  sockets?: number;
  corrupted?: 'yes' | 'no' | 'any';
  ethereal?: 'yes' | 'no' | 'any';
  stats: StatFilterRule[];
} {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  let itemName: string | undefined;
  let sockets: number | undefined;
  let corrupted: 'yes' | 'no' | 'any' = 'any';
  let ethereal: 'yes' | 'no' | 'any' = 'no';
  const stats: StatFilterRule[] = [];

  for (const line of lines) {
    if (!itemName && !line.startsWith('Quality:') && !line.startsWith('Defense:') && !line.startsWith('Required')) {
      itemName = line.replace(/\[.*?\]/g, '').trim();
    }
    if (/Corrupted/i.test(line)) {
      corrupted = 'yes';
    }
    if (/Ethereal/i.test(line)) {
      ethereal = 'yes';
    }
    const sockMatch = line.match(/Sockets\s*\((\d+)\)/i) || line.match(/Socketed\s*\((\d+)\)/i);
    if (sockMatch) {
      sockets = parseInt(sockMatch[1], 10);
    }
    const allSkillMatch = line.match(/\+(\d+)\s+to\s+All\s+Skills/i);
    if (allSkillMatch) {
      stats.push({
        kind: 'pseudo',
        key: 'pseudo_all_skills',
        label: '+ 모든 스킬 합계 (Total All Skills)',
        min: parseInt(allSkillMatch[1], 10),
        enabled: true,
      });
    }
    const fcrMatch = line.match(/\+?(\d+)%\s+Faster\s+Cast\s+Rate/i);
    if (fcrMatch) {
      stats.push({
        kind: 'pseudo',
        key: 'pseudo_fcr',
        label: '시전 속도 증가 (FCR %)',
        min: parseInt(fcrMatch[1], 10),
        enabled: true,
      });
    }
  }

  return { itemName, sockets, corrupted, ethereal, stats };
}
