import puppeteer from 'puppeteer';

async function clickButtonWithText(page, text) {
  const clicked = await page.evaluate((targetText) => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find((b) => b.innerText.includes(targetText));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  }, text);
  if (!clicked) {
    throw new Error(`Button containing text "${text}" not found!`);
  }
}

async function run() {
  console.log('1. Launching Puppeteer browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('2. Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });

  // API Key 주입
  await page.evaluate(() => {
    localStorage.setItem('pd2_api_key', 'pd2t_IJjlom7K_2PHqqwTGmyDQqSOwvhEjn3amAy8n5Uao');
  });
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 2000));

  // 1단계: 기본 탭 = 하이룬 시세표
  console.log('3. Capturing initial Runes Tab view...');
  await page.screenshot({ path: 'tab_runes_initial.png' });
  console.log('Saved tab_runes_initial.png');

  // 2단계: '내 커스텀 추적 아이템' 탭 클릭
  console.log('4. Clicking Custom Watchlist Tab...');
  await clickButtonWithText(page, '내 커스텀 추적 아이템');
  await new Promise((r) => setTimeout(r, 600));

  await page.screenshot({ path: 'tab_custom_view.png' });
  console.log('Saved tab_custom_view.png');

  // 3단계: '+ 아이템 추가' 모달 열고 새 아이템 등록
  console.log('5. Opening add modal and creating a new tracked item...');
  await clickButtonWithText(page, '아이템 추가');
  await new Promise((r) => setTimeout(r, 600));

  const labelInput = await page.waitForSelector('input[placeholder="예: 샤코 (3스킬 / 2소켓 졸업)"]');
  await labelInput.click({ clickCount: 3 });
  await labelInput.type('★옵션B_탭분리_샤코★');

  await clickButtonWithText(page, '추적 보드에 등록');
  await new Promise((r) => setTimeout(r, 2000));

  // 4단계: 등록 후 화면 캡처 및 새 카드가 커스텀 탭에 있는지 검증
  await page.screenshot({ path: 'tab_after_add.png' });
  console.log('Saved tab_after_add.png');

  const pageContent = await page.content();
  const cardFound = pageContent.includes('★옵션B_탭분리_샤코★');
  console.log('Check result - Card visible in Custom Tab:', cardFound);

  // 5단계: 다시 '하이룬 & 화폐 시세표' 탭 클릭
  console.log('6. Clicking back to Runes Tab...');
  await clickButtonWithText(page, '하이룬 & 화폐 시세표');
  await new Promise((r) => setTimeout(r, 600));

  await page.screenshot({ path: 'tab_back_to_runes.png' });
  console.log('Saved tab_back_to_runes.png');

  await browser.close();

  if (!cardFound) {
    throw new Error('Verification failed: Card not found in Custom Tab!');
  }
  console.log('=== OPTION B TAB SEPARATION VERIFICATION PASSED! ===');
}

run().catch((err) => {
  console.error('Puppeteer Test Error:', err);
  process.exit(1);
});
