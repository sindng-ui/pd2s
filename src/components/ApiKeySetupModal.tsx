// C:/AntigravityWorkspace/pd2s/src/components/ApiKeySetupModal.tsx
import React, { useState } from 'react';
import { KeyRound, ExternalLink, ShieldCheck, Check } from 'lucide-react';
import { open } from '@tauri-apps/api/shell';
import { saveStoredApiKey } from '../services/storageService';

interface ApiKeySetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (key: string) => void;
}

export const ApiKeySetupModal: React.FC<ApiKeySetupModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [keyInput, setKeyInput] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleOpenLink = async (e: React.MouseEvent) => {
    e.preventDefault();
    const url = 'https://pd2trader.com/developers/api-keys';
    try {
      await open(url);
    } catch {
      window.open(url, '_blank');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = keyInput.trim();
    if (!trimmed) {
      setError('API Key를 입력해 주세요.');
      return;
    }
    if (!trimmed.startsWith('pd2t_')) {
      setError('올바른 PD2 Trader API Key 형식이 아닙니다 (pd2t_ 로 시작해야 함).');
      return;
    }
    saveStoredApiKey(trimmed);
    onSaved(trimmed);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-amber-500/40 bg-[#16131e] p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-500/20 text-amber-300">
            <KeyRound className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-amber-100">
              PD2 Trader API Key 등록
            </h2>
            <p className="text-xs text-gray-400">
              최초 1회 등록 시 본인 PC에만 안전하게 영구 저장됩니다.
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-gray-800 bg-[#110f17] p-3 text-xs text-gray-300 space-y-2">
          <div className="flex items-center gap-1.5 font-semibold text-emerald-300">
            <ShieldCheck className="h-4 w-4" />
            외부 서버 전송 없는 100% 로컬 보안 저장
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            Project Diablo 2 공식 승인 거래소(PD2 Trader)의 실시간 시세와 매물 조회를 위해 무료 API Key가 필요합니다.
          </p>
          <button
            type="button"
            onClick={handleOpenLink}
            className="inline-flex items-center gap-1 rounded bg-amber-500/20 px-2.5 py-1 text-xs font-bold text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition cursor-pointer"
          >
            👉 무료 API Key 발급받기 (클릭)
            <ExternalLink className="h-3 w-3" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-300">
              API Key 붙여넣기 (pd2t_...)
            </label>
            <input
              type="text"
              required
              value={keyInput}
              onChange={(e) => {
                setKeyInput(e.target.value);
                setError('');
              }}
              placeholder="pd2t_..."
              className="w-full rounded-lg border border-gray-700 bg-[#1c1826] px-3 py-2 text-xs font-mono text-amber-200 focus:border-amber-500 focus:outline-none"
            />
            {error && <p className="mt-1 text-[11px] text-rose-400">{error}</p>}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-amber-500 py-2.5 text-xs font-bold text-gray-950 transition hover:bg-amber-400"
            >
              <Check className="h-4 w-4 stroke-[2.5]" />
              내 PC에 저장하고 시작하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
