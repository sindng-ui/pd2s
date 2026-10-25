import React from 'react';
import { Coins, BookmarkCheck, LineChart, Settings } from 'lucide-react';

export type MobileTab = 'runes' | 'custom' | 'detail';

interface MobileBottomNavProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  hasSelectedItem: boolean;
  selectedItemName?: string;
  onOpenSettings: () => void;
  customItemCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
  hasSelectedItem,
  selectedItemName,
  onOpenSettings,
  customItemCount,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950 border-t border-zinc-800/80 px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] md:hidden">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {/* 1. 하이룬 시세 탭 */}
        <button
          type="button"
          onClick={() => onTabChange('runes')}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-lg transition-all ${
            activeTab === 'runes'
              ? 'text-amber-400 font-medium'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Coins className={`w-5 h-5 mb-0.5 ${activeTab === 'runes' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[11px] leading-tight">룬 시세</span>
        </button>

        {/* 2. 관심 추적 보드 탭 */}
        <button
          type="button"
          onClick={() => onTabChange('custom')}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-lg transition-all relative ${
            activeTab === 'custom'
              ? 'text-amber-400 font-medium'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <BookmarkCheck className={`w-5 h-5 mb-0.5 ${activeTab === 'custom' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[11px] leading-tight">추적 보드</span>
          {customItemCount > 0 && (
            <span className="absolute top-0.5 right-4 w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] flex items-center justify-center font-bold">
              {customItemCount}
            </span>
          )}
        </button>

        {/* 3. 상세 분석 탭 */}
        <button
          type="button"
          onClick={() => onTabChange('detail')}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-lg transition-all relative ${
            activeTab === 'detail'
              ? 'text-amber-400 font-medium'
              : hasSelectedItem
              ? 'text-zinc-200 hover:text-amber-300'
              : 'text-zinc-500 hover:text-zinc-400'
          }`}
        >
          <LineChart className={`w-5 h-5 mb-0.5 ${activeTab === 'detail' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[11px] leading-tight truncate max-w-[70px]">
            {selectedItemName ? '상세분석' : '분석'}
          </span>
          {hasSelectedItem && (
            <span className="absolute top-1 right-5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </button>

        {/* 4. 설정 탭 */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-lg text-zinc-400 hover:text-zinc-200 transition-all"
        >
          <Settings className="w-5 h-5 mb-0.5 stroke-2" />
          <span className="text-[11px] leading-tight">설정</span>
        </button>
      </div>
    </nav>
  );
};
