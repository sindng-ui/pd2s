import puppeteer from 'puppeteer';

async function testResponsive() {
  console.log('1. Launching Puppeteer browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    // 1. 데스크탑 뷰포트 (1440 x 900) 테스트
    console.log('2. Testing Desktop View (1440x900)...');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:4173', { waitUntil: 'networkidle2' });

    // LocalStorage 주입
    await page.evaluate(() => {
      localStorage.setItem('pd2_api_key', 'pd2t_IJjlom7K_2PHqqwTGmyDQqSOwvhEjn3amAy8n5Uao');
    });
    await page.reload({ waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 2000));

    await page.screenshot({ path: 'scratch/desktop_view_1440.png' });
    console.log('Captured scratch/desktop_view_1440.png');

    // 2. 모바일 뷰포트 (390 x 844 - iPhone 14/15) 테스트
    console.log('3. Testing Mobile View (390x844)...');
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await new Promise((r) => setTimeout(r, 1000));

    // 2-1. 모바일 룬 시세표 화면 캡처
    await page.screenshot({ path: 'scratch/mobile_view_runes.png' });
    console.log('Captured scratch/mobile_view_runes.png');

    // 2-2. 하단 내비게이션 바에서 '추적 보드' 탭 클릭
    console.log('4. Clicking Mobile Bottom Nav [추적 보드]...');
    const buttons = await page.$$('nav button');
    for (const b of buttons) {
      const text = await (await b.getProperty('innerText')).jsonValue();
      if (text.includes('추적 보드')) {
        await b.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 1000));
    await page.screenshot({ path: 'scratch/mobile_view_custom.png' });
    console.log('Captured scratch/mobile_view_custom.png');

    // 2-3. 하단 내비게이션 바에서 '상세분석' 탭 클릭
    console.log('5. Clicking Mobile Bottom Nav [상세분석]...');
    const navButtons = await page.$$('nav button');
    for (const b of navButtons) {
      const text = await (await b.getProperty('innerText')).jsonValue();
      if (text.includes('분석')) {
        await b.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 1000));
    await page.screenshot({ path: 'scratch/mobile_view_detail.png' });
    console.log('Captured scratch/mobile_view_detail.png');

    console.log('All responsive E2E captures finished successfully!');
  } finally {
    await browser.close();
  }
}

testResponsive().catch((err) => {
  console.error('Puppeteer test error:', err);
  process.exit(1);
});
