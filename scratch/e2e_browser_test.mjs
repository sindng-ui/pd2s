import { chromium } from 'playwright';
import fs from 'node:fs';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  console.log('1. Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173');

  // API Key 주입
  await page.evaluate(() => {
    localStorage.setItem('pd2_api_key', 'pd2t_IJjlom7K_2PHqqwTGmyDQqSOwvhEjn3amAy8n5Uao');
  });
  await page.reload();

  // 대시보드 로딩 대기
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'scratch/screenshot_before_add.png' });
  console.log('Saved screenshot_before_add.png');

  // '+ 추적 아이템 추가' 버튼 클릭
  console.log('2. Clicking + 추적 아이템 추가 button...');
  const addBtn = await page.getByRole('button', { name: /\+ 추적 아이템 추가/i });
  await addBtn.click();
  await page.waitForTimeout(500);

  // 모달 입력: 라벨에 '테스트_샤코_신규추가' 입력
  console.log('3. Filling form in modal...');
  const labelInput = await page.getByPlaceholder('예: 샤코 (3스킬 / 2소켓 졸업)');
  await labelInput.fill('★테스트_등록_샤코★');

  // '추적 보드에 등록' 클릭
  console.log('4. Submitting form...');
  const submitBtn = await page.getByRole('button', { name: /추적 보드에 등록/i });
  await submitBtn.click();

  await page.waitForTimeout(2000);

  // 좌측 카드에 해당 라벨이 있는지 확인
  const cardFound = await page.locator('text=★테스트_등록_샤코★').count();
  console.log('Card found count:', cardFound);

  await page.screenshot({ path: 'scratch/screenshot_after_add.png' });
  console.log('Saved screenshot_after_add.png');

  await browser.close();
  if (cardFound === 0) {
    throw new Error('Card not found in UI!');
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
