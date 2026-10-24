// C:/AntigravityWorkspace/pd2s/src/components/HeaderBar.tsx
import React, { useState } from 'react';
import {
  Flame,
  RefreshCw,
  PlusCircle,
  ShieldAlert,
  Sword,
  Calendar,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import { RealmMode } from '../types/market.types';
import { saveStoredApiKey } from '../services/storageService';

interface HeaderBarProps {
  realm: RealmMode;
  onChangeRealm: (next: RealmMode) => void;
  lastSyncedAt: string | null;
  isLoading: boolean;
  onRefreshAll: () => void;
  onOpenAddModal: () => void;
  maskedKey: string;
  onKeyUpdated: () => void;
  onOpenKeyModal: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = React.memo(
  ({
    realm,
    onChangeRealm,
    lastSyncedAt,
    isLoading,
    onRefreshAll,
    onOpenAddModal,
    maskedKey,
    onKeyUpdated,
    onOpenKeyModal,
  }) => {
    const [showKeyInput, setShowKeyInput] = useState(false);
    const [apiKeyVal, setApiKeyVal] = useState('');

    const handleSaveKey = (e: React.FormEvent) => {
      e.preventDefault();
      if (!apiKeyVal.trim()) return;
      saveStoredApiKey(apiKeyVal.trim());
      setShowKeyInput(false);
      setApiKeyVal('');
      onKeyUpdated();
    };

    const formattedTime = lastSyncedAt
      ? new Date(lastSyncedAt).toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      : '동기화 대기중';

    return (
      <header className="sticky top-0 z-30 border-b border-amber-500/20 bg-[#121017]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3">
          {/* 브랜드 타이틀 & 시즌 14 배지 */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-amber-500/40 bg-gradient-to-br from-amber-500/20 to-red-900/40 shadow-inner">
              <Flame className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-amber-100">
                  PD2 룬 & 커스텀 시세 트래커
                </h1>
                <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-300">
                  Season 14: Alliance (Day 1~)
                </span>
              </div>
              <p className="text-xs text-gray-400">
                실시간 High Rune 가치 · 실제 거래 완료(Sold) 물물교환 원문 · 시즌 날짜별 추이
              </p>
            </div>
          </div>

          {/* 컨트롤 영역 */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Softcore / Hardcore 토글 */}
            <div className="flex items-center rounded-lg border border-gray-800 bg-[#191620] p-1 text-xs">
              <button
                type="button"
                onClick={() => onChangeRealm({ ...realm, isHardcore: false })}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-medium transition ${
                  !realm.isHardcore
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <Sword className="h-3.5 w-3.5" />
                소프트코어 (SC)
              </button>
              <button
                type="button"
                onClick={() => onChangeRealm({ ...realm, isHardcore: true })}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-medium transition ${
                  realm.isHardcore
                    ? 'bg-red-500/25 text-red-300 border border-red-500/40'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                하드코어 (HC)
              </button>
            </div>

            {/* 시즌 14 순수 데이터 필터 토글 */}
            <button
              type="button"
              onClick={() => onChangeRealm({ ...realm, seasonOnly: !realm.seasonOnly })}
              title="시즌 14 시작일(2026-10-23 UTC) 이후 등록/거래된 순수 데이터만 우선 집계합니다"
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                realm.seasonOnly
                  ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                  : 'border-gray-700 bg-[#191620] text-gray-400 hover:text-gray-200'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              {realm.seasonOnly ? '시즌 14 (10/23~) 기준' : '최근 30일 전체 보기'}
            </button>

            {/* + 커스텀 추적 아이템 추가 버튼 */}
            <button
              type="button"
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 rounded-lg border border-amber-400/50 bg-gradient-to-r from-amber-500/25 to-orange-500/25 px-3.5 py-1.5 text-xs font-semibold text-amber-200 shadow-sm transition hover:from-amber-500/35 hover:to-orange-500/35"
            >
              <PlusCircle className="h-4 w-4 text-amber-400" />
              + 추적 아이템 추가 (세부 조건)
            </button>

            {/* 새로고침 & 스냅샷 저장 */}
            <button
              type="button"
              onClick={onRefreshAll}
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded-lg border border-gray-700 bg-[#1d1a24] px-3 py-1.5 text-xs font-medium text-gray-200 transition hover:border-amber-500/40 hover:text-amber-300 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
              <span>{formattedTime}</span>
            </button>

            {/* API Key 상태 및 설정 버튼 */}
            <button
              type="button"
              onClick={onOpenKeyModal}
              className="flex items-center gap-1 rounded-lg border border-gray-800 bg-[#16141c] px-2.5 py-1.5 text-[11px] text-gray-400 hover:border-gray-700 hover:text-gray-200"
              title="PD2 Trader API Key 설정"
            >
              <KeyRound className="h-3 w-3 text-emerald-400" />
              <span>{maskedKey ? `Key: ${maskedKey}` : 'API Key 등록'}</span>
            </button>
          </div>
        </div>

        {/* API Key 변경 드롭다운 바 */}
        {showKeyInput && (
          <form
            onSubmit={handleSaveKey}
            className="mx-auto flex max-w-[1600px] items-center justify-end gap-2 border-t border-gray-800/80 bg-[#0f0d14] px-4 py-2 text-xs"
          >
            <span className="text-gray-400">PD2 Trader X-API-Key:</span>
            <input
              type="text"
              value={apiKeyVal}
              onChange={(e) => setApiKeyVal(e.target.value)}
              placeholder="pd2t_..."
              className="w-72 rounded border border-gray-700 bg-[#181520] px-2.5 py-1 text-xs text-gray-100 focus:border-amber-500 focus:outline-none"
            />
            <button
              type="submit"
              className="flex items-center gap-1 rounded bg-amber-600 px-3 py-1 font-medium text-white hover:bg-amber-500"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              저장
            </button>
          </form>
        )}
      </header>
    );
  }
);
