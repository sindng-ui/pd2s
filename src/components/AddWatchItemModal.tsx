// C:/AntigravityWorkspace/pd2s/src/components/AddWatchItemModal.tsx
import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Plus,
  Trash2,
  ClipboardPaste,
  Check,
  Sparkles,
} from 'lucide-react';
import { StatFilterRule, WatchItemConfig } from '../types/market.types';
import {
  STAT_PRESET_OPTIONS,
  parseClipboardItemText,
} from '../constants/statPresets';
import { searchCatalogAutocompleteApi } from '../services/marketApi';

interface AddWatchItemModalProps {
  isOpen: boolean;
  editingItem: WatchItemConfig | null;
  onClose: () => void;
  onSave: (
    item: Omit<WatchItemConfig, 'id' | 'createdAt'> & { id?: string }
  ) => Promise<void>;
}

export const AddWatchItemModal: React.FC<AddWatchItemModalProps> = ({
  isOpen,
  editingItem,
  onClose,
  onSave,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const [itemName, setItemName] = useState('Harlequin Crest');
  const [baseCode, setBaseCode] = useState('harlequin_crest');
  const [iconUrl, setIconUrl] = useState<string | undefined>(
    'https://pd2trader.com/assets/items/invcap.png'
  );
  const [label, setLabel] = useState('샤코 (+3 올스킬 / 2소켓)');
  const [socketsMin, setSocketsMin] = useState<string>('2');
  const [socketsMax, setSocketsMax] = useState<string>('2');
  const [corrupted, setCorrupted] = useState<'any' | 'yes' | 'no'>('yes');
  const [ethereal, setEthereal] = useState<'any' | 'yes' | 'no'>('no');
  const [stats, setStats] = useState<StatFilterRule[]>([
    {
      kind: 'pseudo',
      key: 'pseudo_all_skills',
      label: '+ 모든 스킬 합계 (Total All Skills)',
      min: 3,
      enabled: true,
    },
  ]);
  const [clipboardText, setClipboardText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setItemName(editingItem.itemName);
      setBaseCode(editingItem.baseCode || '');
      setIconUrl(editingItem.iconUrl);
      setLabel(editingItem.label);
      setSocketsMin(
        editingItem.socketsMin !== undefined ? String(editingItem.socketsMin) : ''
      );
      setSocketsMax(
        editingItem.socketsMax !== undefined ? String(editingItem.socketsMax) : ''
      );
      setCorrupted(editingItem.corrupted || 'any');
      setEthereal(editingItem.ethereal || 'any');
      setStats(editingItem.stats || []);
    } else {
      setItemName('Harlequin Crest');
      setBaseCode('harlequin_crest');
      setIconUrl('https://pd2trader.com/assets/items/invcap.png');
      setLabel('샤코 (+3 올스킬 / 2소켓)');
      setSocketsMin('2');
      setSocketsMax('2');
      setCorrupted('yes');
      setEthereal('no');
      setStats([
        {
          kind: 'pseudo',
          key: 'pseudo_all_skills',
          label: '+ 모든 스킬 합계 (Total All Skills)',
          min: 3,
          enabled: true,
        },
      ]);
    }
  }, [editingItem, isOpen]);

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const hits = await searchCatalogAutocompleteApi(searchQuery);
        setSearchResults(hits.slice(0, 8));
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (!isOpen) return null;

  const handleSelectCatalogItem = (hit: any) => {
    setItemName(hit.name);
    setBaseCode(hit.baseCode || '');
    setIconUrl(hit.iconUrl || undefined);
    setLabel(`${hit.name} (커스텀 조건)`);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleAddStatPreset = (presetKey: string) => {
    const found = STAT_PRESET_OPTIONS.find((p) => p.key === presetKey);
    if (!found) return;
    setStats((prev) => [
      ...prev,
      {
        kind: found.kind,
        key: found.key,
        label: found.label,
        min: found.defaultMin,
        enabled: true,
      },
    ]);
  };

  const handleParseClipboard = () => {
    if (!clipboardText.trim()) return;
    const parsed = parseClipboardItemText(clipboardText);
    if (parsed.itemName) {
      setItemName(parsed.itemName);
      setLabel(`${parsed.itemName} (인게임 복사)`);
    }
    if (parsed.sockets !== undefined) {
      setSocketsMin(String(parsed.sockets));
      setSocketsMax(String(parsed.sockets));
    }
    if (parsed.corrupted) setCorrupted(parsed.corrupted);
    if (parsed.ethereal) setEthereal(parsed.ethereal);
    if (parsed.stats.length > 0) setStats(parsed.stats);
    setClipboardText('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;
    setSaving(true);
    try {
      await onSave({
        id: editingItem?.id,
        label: label.trim() || itemName.trim(),
        itemName: itemName.trim(),
        baseCode: baseCode.trim() || undefined,
        category: 'custom',
        iconUrl,
        socketsMin: socketsMin !== '' ? Number(socketsMin) : undefined,
        socketsMax: socketsMax !== '' ? Number(socketsMax) : undefined,
        corrupted,
        ethereal,
        stats,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-amber-500/30 bg-[#15131c] p-6 shadow-2xl">
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-400" />
            <h2 className="text-base font-bold text-amber-100">
              {editingItem
                ? '커스텀 추적 아이템 세부 조건 수정'
                : '+ 커스텀 추적 아이템 추가 (세부 스탯 & 소켓 조건)'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* 1. 아이템 카탈로그 검색 자동완성 */}
          <div className="relative">
            <label className="mb-1 block font-semibold text-amber-200">
              1. 아이템 검색 (영어 이름 또는 약어 입력 - 예: Shako, Griffon, Mara, Windforce)
            </label>
            <div className="relative flex items-center">
              <Search className="absolute left-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="여기에 검색어를 입력하면 공식 아이템 목록이 자동완성됩니다..."
                className="w-full rounded-lg border border-gray-700 bg-[#1d1a27] py-2 pl-9 pr-3 text-gray-100 focus:border-amber-500 focus:outline-none"
              />
              {searching && (
                <span className="absolute right-3 text-[11px] text-amber-400">
                  검색중...
                </span>
              )}
            </div>

            {searchResults.length > 0 && (
              <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-amber-500/40 bg-[#1c1926] shadow-xl">
                {searchResults.map((hit) => (
                  <button
                    key={hit.baseCode + hit.name}
                    type="button"
                    onClick={() => handleSelectCatalogItem(hit)}
                    className="flex w-full items-center gap-3 border-b border-gray-800/60 px-3 py-2 text-left hover:bg-amber-500/15"
                  >
                    {hit.iconUrl && (
                      <img
                        src={hit.iconUrl}
                        alt={hit.name}
                        className="h-7 w-7 rounded bg-black/40 object-contain p-0.5"
                      />
                    )}
                    <div>
                      <div className="font-bold text-amber-200">{hit.name}</div>
                      <div className="text-[10px] text-gray-400">
                        분류: {hit.category} · 약어: {(hit.aliases || []).join(', ')}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 선택된 아이템 정보 & 별칭 */}
          <div className="grid grid-cols-1 gap-3 rounded-xl border border-gray-800 bg-[#1a1723] p-3.5 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-gray-400">정확한 아이템 영문명 (필수)</label>
              <input
                type="text"
                required
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="w-full rounded border border-gray-700 bg-[#121017] px-2.5 py-1.5 font-semibold text-amber-200 focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-gray-400">
                대시보드 표시 별칭 (내 마음대로 지정)
              </label>
              <input
                type="text"
                required
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="예: 샤코 (3스킬 / 2소켓 졸업)"
                className="w-full rounded border border-gray-700 bg-[#121017] px-2.5 py-1.5 font-semibold text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* 2. 소켓 / 타락 / 에테리얼 조건 */}
          <div className="grid grid-cols-2 gap-3 rounded-xl border border-gray-800 bg-[#1a1723] p-3.5 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-gray-400">최소 소켓 (0~6)</label>
              <input
                type="number"
                min={0}
                max={6}
                value={socketsMin}
                onChange={(e) => setSocketsMin(e.target.value)}
                placeholder="제한없음"
                className="w-full rounded border border-gray-700 bg-[#121017] px-2.5 py-1.5 text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-gray-400">최대 소켓 (0~6)</label>
              <input
                type="number"
                min={0}
                max={6}
                value={socketsMax}
                onChange={(e) => setSocketsMax(e.target.value)}
                placeholder="제한없음"
                className="w-full rounded border border-gray-700 bg-[#121017] px-2.5 py-1.5 text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-gray-400">타락 여부 (Corrupted)</label>
              <select
                value={corrupted}
                onChange={(e) => setCorrupted(e.target.value as any)}
                className="w-full rounded border border-gray-700 bg-[#121017] px-2 py-1.5 text-white"
              >
                <option value="any">전체 (Any)</option>
                <option value="yes">타락됨 (Yes)</option>
                <option value="no">노타락 클린 (No)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-gray-400">에테리얼 (Ethereal)</label>
              <select
                value={ethereal}
                onChange={(e) => setEthereal(e.target.value as any)}
                className="w-full rounded border border-gray-700 bg-[#121017] px-2 py-1.5 text-white"
              >
                <option value="any">전체 (Any)</option>
                <option value="no">노에테 (No)</option>
                <option value="yes">에테리얼 (Yes)</option>
              </select>
            </div>
          </div>

          {/* 3. 세부 스탯 & 타락 옵션 필터 빌더 */}
          <div className="rounded-xl border border-gray-800 bg-[#1a1723] p-3.5">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <label className="font-semibold text-amber-200">
                3. 세부 옵션 / 스킬 / 타락 수치 조건 (예: +모든 스킬 합계 ≥ 3)
              </label>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddStatPreset(e.target.value);
                    e.target.value = '';
                  }
                }}
                defaultValue=""
                className="rounded border border-amber-500/40 bg-[#121017] px-2.5 py-1 text-xs text-amber-300"
              >
                <option value="" disabled>
                  + 자주 쓰는 옵션 조건 추가하기...
                </option>
                {STAT_PRESET_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {stats.length === 0 ? (
              <p className="py-2 text-[11px] text-gray-500">
                추가된 세부 스탯 조건이 없습니다. 우측 상단 드롭다운에서 스킬, 패캐, 공속, 증뎀, 저항 등을 추가하세요.
              </p>
            ) : (
              <div className="space-y-2">
                {stats.map((st, idx) => (
                  <div
                    key={idx}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-700/80 bg-[#121017] px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={st.enabled}
                        onChange={(e) => {
                          const next = [...stats];
                          next[idx] = { ...st, enabled: e.target.checked };
                          setStats(next);
                        }}
                        className="rounded accent-amber-500"
                      />
                      <span className="font-medium text-gray-200">{st.label}</span>
                      <span className="text-[10px] text-gray-500">({st.key})</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] text-gray-400">최소(Min):</span>
                        <input
                          type="number"
                          value={st.min ?? ''}
                          onChange={(e) => {
                            const next = [...stats];
                            next[idx] = {
                              ...st,
                              min: e.target.value !== '' ? Number(e.target.value) : undefined,
                            };
                            setStats(next);
                          }}
                          className="w-16 rounded border border-gray-700 bg-[#1b1824] px-2 py-1 text-center font-mono text-amber-300"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] text-gray-400">최대(Max):</span>
                        <input
                          type="number"
                          value={st.max ?? ''}
                          onChange={(e) => {
                            const next = [...stats];
                            next[idx] = {
                              ...st,
                              max: e.target.value !== '' ? Number(e.target.value) : undefined,
                            };
                            setStats(next);
                          }}
                          placeholder="-"
                          className="w-16 rounded border border-gray-700 bg-[#1b1824] px-2 py-1 text-center font-mono text-gray-200"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setStats(stats.filter((_, i) => i !== idx))}
                        className="rounded p-1 text-gray-400 hover:bg-gray-800 hover:text-rose-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 4. 인게임 Ctrl+C 클립보드 붙여넣기 자동 세팅 */}
          <div className="rounded-xl border border-dashed border-gray-700 bg-[#13111a] p-3">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400">
                <ClipboardPaste className="h-3.5 w-3.5 text-amber-400" />
                보너스 기능: 인게임 아이템 위에서 Ctrl+C 복사한 텍스트 붙여넣기로 자동 채우기
              </span>
              {clipboardText.trim() && (
                <button
                  type="button"
                  onClick={handleParseClipboard}
                  className="rounded bg-amber-500/20 px-2 py-0.5 text-[11px] font-semibold text-amber-300 border border-amber-500/40"
                >
                  텍스트 분석 적용
                </button>
              )}
            </div>
            <textarea
              rows={2}
              value={clipboardText}
              onChange={(e) => setClipboardText(e.target.value)}
              placeholder="인게임에서 복사한 아이템 텍스트를 여기에 붙여넣고 '텍스트 분석 적용'을 누르면 이름/소켓/스킬이 자동 입력됩니다."
              className="w-full rounded border border-gray-800 bg-[#0d0c12] p-2 text-[11px] text-gray-300 focus:border-amber-500/50 focus:outline-none"
            />
          </div>

          {/* 하단 저장 / 취소 버튼 */}
          <div className="flex items-center justify-end gap-2 border-t border-gray-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-700 px-4 py-2 font-medium text-gray-300 hover:bg-gray-800"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-5 py-2 font-bold text-gray-950 hover:bg-amber-400 disabled:opacity-50"
            >
              <Check className="h-4 w-4 stroke-[2.5]" />
              {saving ? '저장 중...' : editingItem ? '조건 수정 완료' : '추적 보드에 등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
