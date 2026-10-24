import puppeteer from 'puppeteer';

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

  // 1단계: 초기 화면 스크린샷
  await page.screenshot({ path: 'scratch_after_fix_initial.png' });
  console.log('Saved scratch_after_fix_initial.png');

  // 2단계: '+ 추적 아이템 추가' 버튼 클릭 (HeaderBar 또는 CustomWatchlistBoard)
  console.log('3. Clicking + 추적 아이템 추가 button...');
  // 헤더의 '+ 추적 아이템 추가 (세부 조건)' 버튼 클릭
  const buttons = await page.$$('button');
  let addBtn = null;
  for (const b of buttons) {
    const text = await (await b.getProperty('innerText')).jsonValue();
    if (text.includes('추적 아이템 추가') || text.includes('+ 아이템 추가')) {
      addBtn = b;
      break;
    }
  }
  if (!addBtn) {
    throw new Error('Add button not found!');
  }
  await addBtn.click();
  await new Promise((r) => setTimeout(r, 600));

  // 3단계: 모달 입력 폼
  console.log('4. Filling modal form for new tracked item...');
  const labelInput = await page.waitForSelector('input[placeholder="예: 샤코 (3스킬 / 2소켓 졸업)"]');
  await labelInput.click({ clickCount: 3 });
  await labelInput.type('★신규_직접추적_아이템★');

  // 모달 스크린샷
  await page.screenshot({ path: 'scratch_modal_open.png' });
  console.log('Saved scratch_modal_open.png');

  // 4단계: '추적 보드에 등록' 버튼 클릭
  console.log('5. Clicking submit in modal...');
  const submitBtns = await page.$$('button');
  let submitBtn = null;
  for (const sb of submitBtns) {
    const text = await (await sb.getProperty('innerText')).jsonValue();
    if (text.includes('추적 보드에 등록') || text.includes('보드에 등록')) {
      submitBtn = sb;
      break;
    }
  }
  if (!submitBtn) {
    throw new Error('Submit button in modal not found!');
  }
  await submitBtn.click();

  // 대기
  await new Promise((r) => setTimeout(r, 2000));

  // 5단계: 화면 캡처 및 좌측 보드에 '★신규_직접추적_아이템★'이 렌더링되었는지 검증
  await page.screenshot({ path: 'scratch_after_add_success.png' });
  console.log('Saved scratch_after_add_success.png');

  const pageContent = await page.content();
  const cardAdded = pageContent.includes('★신규_직접추적_아이템★');
  console.log('Check result - Item found on page:', cardAdded);

  await browser.close();

  if (!cardAdded) {
    throw new Error('Verification failed: Added item card is not visible on page!');
  }
  console.log('=== E2E Browser Control & UI Verification PASSED! ===');
}

run().catch((err) => {
  console.error('E2E ERROR:', err);
  process.exit(1);
});
