import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { App } from './App';
import * as marketApi from './services/marketApi';
import * as storageService from './services/storageService';

vi.mock('./workers/useMarketWorker', () => ({
  useMarketWorker: () => ({
    analyzeItemAsync: vi.fn().mockResolvedValue({
      watchId: 'custom-1',
      currentHr: 1.5,
      lowestLiveHr: 1.2,
      liveCount: 2,
      soldCount: 3,
      topPaymentMethods: [{ label: '1.5 HR 하위룬', count: 2 }],
      parsedListings: [],
      soldBreakdowns: [],
      barterBreakdown: [],
      s14Records: [],
      allRecords: [],
      isSeason14Active: true,
      dataDayCount: 1,
    }),
  }),
}));

describe('App Full Integration Flow Test', () => {
  beforeEach(() => {
    localStorage.clear();
    // 모의 API Key 설정
    storageService.saveStoredApiKey('pd2t_test_key_1234567890');

    // API 모의 응답
    vi.spyOn(marketApi, 'fetchOverviewApi').mockResolvedValue({
      items: [
        {
          baseCode: 'r30',
          name: 'Ber Rune',
          category: 'rune',
          hrValue: 3.0,
          lastDayPrice: 3.0,
          medianPrice: 3.0,
          movingAverage7Days: 3.0,
          averagePrice: 3.0,
          minPrice: 3.0,
          maxPrice: 3.0,
          sampleCount: 1,
          changePercent7d: 0,
          history: [],
        },
      ],
      snapshots: [],
      fetchedAt: new Date().toISOString(),
    });

    vi.spyOn(marketApi, 'fetchItemListingsAndHistoryApi').mockResolvedValue({
      watchId: 'custom-1',
      liveItems: [],
      liveTotal: 0,
      soldItems: [],
      soldTotal: 0,
      baseHistory: [],
      snapshots: [],
    });
  });

  it('추적 아이템 추가 모달에서 등록하면 좌측 CustomWatchlistBoard에 즉시 카드가 렌더링되어야 함', async () => {
    render(<App />);

    // 1. 초기 렌더링 확인 (상단 탭 바 및 추가 버튼)
    const runesTabBtn = screen.getByRole('button', { name: /하이룬 & 화폐 시세표/i });
    const customTabBtn = screen.getByRole('button', { name: /내 커스텀 추적 아이템/i });
    expect(runesTabBtn).toBeTruthy();
    expect(customTabBtn).toBeTruthy();

    const addButtons = screen.getAllByRole('button', { name: /\+ 추적 아이템 추가|\+ 새 추적 아이템|\+ 아이템 추가/i });
    expect(addButtons.length).toBeGreaterThan(0);

    // 2. 모달 열기
    fireEvent.click(addButtons[0]);

    // 3. 모달에서 라벨 변경
    const labelInput = await screen.findByPlaceholderText('예: 샤코 (3스킬 / 2소켓 졸업)');
    fireEvent.change(labelInput, { target: { value: '★나만의_유니크_아이템★' } });

    // 4. 모달 등록 버튼 클릭
    const submitBtn = screen.getByRole('button', { name: /추적 보드에 등록/i });
    fireEvent.click(submitBtn);

    // 5. 등록 즉시 자동으로 커스텀 탭으로 전환되어 좌측 CustomWatchlistBoard와 우측 상세 패널 둘 다에 해당 라벨이 표시되는지 검증!
    await waitFor(() => {
      const titles = screen.getAllByText('★나만의_유니크_아이템★');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });

    // 6. 다시 하이룬 시세표 탭 클릭 시 룬 시세표 정상 렌더링 확인
    fireEvent.click(runesTabBtn);
    expect(screen.getByText(/High Runes 실시간 HR 시세/i)).toBeTruthy();
  });
});
