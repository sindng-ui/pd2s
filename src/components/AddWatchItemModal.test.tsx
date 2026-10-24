import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AddWatchItemModal } from './AddWatchItemModal';

describe('AddWatchItemModal UI Component Unit Test', () => {
  it('모달이 열렸을 때 기본 필드가 렌더링되고 제출 시 onSave 콜백이 호출되어야 함', async () => {
    const handleSave = vi.fn().mockResolvedValue(undefined);
    const handleClose = vi.fn();

    render(
      <AddWatchItemModal
        isOpen={true}
        editingItem={null}
        onClose={handleClose}
        onSave={handleSave}
      />
    );

    // 라벨 입력 필드 변경
    const labelInput = screen.getByPlaceholderText('예: 샤코 (3스킬 / 2소켓 졸업)') as HTMLInputElement;
    expect(labelInput).toBeDefined();

    fireEvent.change(labelInput, { target: { value: '테스트 베르룬 등록' } });
    expect(labelInput.value).toBe('테스트 베르룬 등록');

    // 등록 버튼 클릭
    const submitBtn = screen.getByRole('button', { name: /추적 보드에 등록/i });
    fireEvent.click(submitBtn);

    expect(handleSave).toHaveBeenCalledTimes(1);
    expect(handleSave).toHaveBeenCalledWith(
      expect.objectContaining({
        label: '테스트 베르룬 등록',
        itemName: 'Harlequin Crest',
        category: 'custom',
        corrupted: 'yes',
      })
    );
  });
});
