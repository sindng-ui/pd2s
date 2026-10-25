// C:/AntigravityWorkspace/pd2s/src/components/MobileHeader.tsx
import React from 'react';
import { Flame, RefreshCw, PlusCircle, ShieldAlert, Sword } from 'lucide-react';
import { RealmMode } from '../types/market.types';

interface MobileHeaderProps {
  realm: RealmMode;
  onChangeRealm: (next: RealmMode) => void;
  isLoading: boolean;
  onRefreshAll: () => void;
  onOpenAddModal: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = React.memo(
  ({ realm, onChangeRealm, isLoading, onRefreshAll, onOpenAddModal }) => {
    return (
      <header className="sticky top-0 z-30 border-b border-amber-500/20 bg-[#121017]/95 backdrop-blur-md px-3 py-2.5 md:hidden">
        <div className="flex items-center justify-between gap-2">
          {/* 좌측: 로고 + 시즌 14 태그 */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-500/40 bg-gradient-to-br from-amber-500/20 to-red-900/40">
              <Flame className="h-4 w-4 text-amber-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold tracking-tight text-amber-100 truncate">
                  PD2 시세
                </span>
                <span className="rounded bg-amber-500/20 px-1 py-0.2 text-[10px] font-semibold text-amber-400 border border-amber-500/30">
                  S14
                </span>
              </div>
            </div>
          </div>

          {/* 우측: 리그 전환(SC/HC) + 새로고침 + +추가 버튼 */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* SC / HC 토글 버튼 */}
            <div className="flex rounded-md border border-zinc-800 bg-zinc-900/90 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => onChangeRealm({ ...realm, isHardcore: false })}
                className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition ${
                  !realm.isHardcore
                    ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Sword className="h-3 w-3" />
                <span>SC</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeRealm({ ...realm, isHardcore: true })}
                className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition ${
                  realm.isHardcore
                    ? 'bg-red-500/20 text-red-300 font-semibold border border-red-500/40'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <ShieldAlert className="h-3 w-3" />
                <span>HC</span>
              </button>
            </div>

            {/* 새로고침 버튼 */}
            <button
              type="button"
              onClick={onRefreshAll}
              disabled={isLoading}
              title="실시간 시세 동기화"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-amber-500/40 hover:text-amber-400 transition disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
            </button>

            {/* + 아이템 추가 버튼 */}
            <button
              type="button"
              onClick={onOpenAddModal}
              title="새 관심 아이템 추가"
              className="flex h-8 items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500/20 px-2.5 text-[12px] font-semibold text-amber-300 hover:bg-amber-500/30 transition shadow-sm active:scale-95"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>추가</span>
            </button>
          </div>
        </div>
      </header>
    );
  }
);
