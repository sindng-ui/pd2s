# APP_MAP.md — PD2 시세 & 실거래 추적 대시보드 (PD2 Market Tracker)

본 문서는 프로젝트의 전체 파일 구조, 모듈 역할, 데이터 흐름 및 인터페이스를 관리하는 아키텍처 맵입니다.

---

## 1. 시스템 개요
- **목적**: Project Diablo 2 (Season 14: Alliance) 하이룬(Zod~Lem), 주요 화폐(WSS, 퍼즐박스 등), 그리고 사용자가 `+` 버튼으로 세부 조건(예: `샤코 +3 올스킬 / 2소켓`)을 지정해 등록한 커스텀 아이템의 **1) 실시간 HR 시세, 2) 실제 거래 완료(Sold) 및 활성 매물 물물교환 원문 분석, 3) 시즌 날짜별 시세 변동 추이**를 추적.
- **실행 모드**:
  1. **Tauri 네이티브 단일 실행 파일 (.exe)**: Node.js 서버 필요 없이 유저가 바로 더블클릭 실행 가능 (`src-tauri/target/release/pd2-tracker.exe` 및 NSIS 설치 인스톨러)
  2. **Vite 개발 서버 모드**: `npm run dev` (`http://localhost:5173`)
- **API Key & 데이터 보관**: 외부 서버 없이 각 사용자의 **PC 로컬 저장소(LocalStorage)**에 안전하게 영구 보관 (100% Client-Side Direct Fetch).

---

## 2. 디렉토리 및 모듈 인터페이스 맵

### A. Tauri 데스크탑 & 모바일 코어 (`src-tauri/`) & 로컬 스토리지 서비스
| 파일 경로 | 줄 수 | 핵심 역할 및 노출 인터페이스 |
| :--- | :---: | :--- |
| [src-tauri/tauri.conf.json](file:///C:/AntigravityWorkspace/pd2s/src-tauri/tauri.conf.json) | 65 | Tauri 2.0 정식 설정 (모바일 및 데스크탑 창 설정, 번들 식별자 `com.pd2tracker.app`, v2 권한 및 플러그인 연동). |
| [src-tauri/src/lib.rs](file:///C:/AntigravityWorkspace/pd2s/src-tauri/src/lib.rs) | 10 | Tauri 2.0 모바일/데스크탑 통합 진입점 (`#[tauri::mobile_entry_point]`, HTTP 및 Opener 플러그인 등록). |
| [src-tauri/src/main.rs](file:///C:/AntigravityWorkspace/pd2s/src-tauri/src/main.rs) | 6 | 데스크탑 윈도우 실행 진입점 (`app_lib::run()` 호출). |
| [src-tauri/capabilities/migrated.json](file:///C:/AntigravityWorkspace/pd2s/src-tauri/capabilities/migrated.json) | 14 | Tauri 2.0 보안 권한 정의 (`core:default`, `http:default`, `opener:default`, `shell:default`). |
| [src/utils/tauriBridge.ts](file:///C:/AntigravityWorkspace/pd2s/src/utils/tauriBridge.ts) | 49 | 데스크탑/안드로이드 네이티브(Tauri 2)와 웹 브라우저 환경 간 완벽 브릿지.<br>- `isTauriRuntime()`: 네이티브 런타임 여부 감지<br>- `tauriFetch(url, init)`: 모바일 웹뷰 CORS 차단 우회용 Rust Reqwest 네이티브 fetch 우선 호출<br>- `openExternalUrl(url)`: 시스템 브라우저 안전 열기 |
| [src/services/storageService.ts](file:///C:/AntigravityWorkspace/pd2s/src/services/storageService.ts) | 126 | 사용자 PC/모바일 로컬 저장소(LocalStorage)에 API Key, 관심 목록, 일별 스냅샷, 거래 완료 로그 영구 저장/로드.<br>- `getStoredApiKey()`, `saveStoredApiKey(key)`<br>- `getStoredWatchlist()`, `saveStoredWatchlist(items)`<br>- `getStoredSnapshots()`, `appendStoredSnapshot(record)`<br>- `getStoredSoldHistoryMap()`, `mergeStoredSoldListings(watchKey, items)` |
| [src/services/marketApi.ts](file:///C:/AntigravityWorkspace/pd2s/src/services/marketApi.ts) | 392 | Node 서버 없이 `pd2trader.com` REST & GraphQL API로 직접 통신 (`tauriFetch`로 모바일 CORS 원천 우회).<br>- `fetchOverviewApi(isLadder, isHardcore)`<br>- `fetchWatchlistApi()`, `addWatchItemApi()`, `deleteWatchItemApi()`<br>- `fetchItemListingsAndHistoryApi()`<br>- `recordCustomSnapshotApi()`<br>- `searchCatalogAutocompleteApi(query)` |
| [README.md](file:///C:/AntigravityWorkspace/pd2s/README.md) | 105 | GitHub 방문자를 위한 공식 한국어 프로젝트 소개서. 핵심 기능 5종, 캡처 이미지, 보안 안전성(이상한 곳 아님), 무료 API Key 발급 안내, ZIP 다운로드 안내. |
| [.gitignore](file:///C:/AntigravityWorkspace/pd2s/.gitignore) | 33 | Git 제외 파일 설정. `node_modules/`, `src-tauri/target/`, `dist/`, 로컬 데이터 제외 처리. |

---

### B. 프론트엔드 타입, 상수, 서비스, 훅 및 멀티 워커 (`src/`)
| 파일 경로 | 줄 수 | 핵심 역할 및 노출 인터페이스 |
| :--- | :---: | :--- |
| [src/types/market.types.ts](file:///C:/AntigravityWorkspace/pd2s/src/types/market.types.ts) | 146 | 전체 도메인 타입 정의 (`RealmMode`, `StatFilterRule`, `WatchItemConfig`, `EconomyItemSummary`, `PriceHistoryPoint`, `RawMarketListingItem`, `BarterCategory`, `ParsedMarketListing`, `AnalyzedItemResult`, `LocalSnapshotRecord`). |
| [src/hooks/useResponsive.ts](file:///C:/AntigravityWorkspace/pd2s/src/hooks/useResponsive.ts) | 65 | 모바일(폭 < 768px), 태블릿, 데스크탑 반응형 뷰포트 감지 훅 (`matchMedia` 기반 고성능 리사이즈 리스너). |
| [src/constants/defaultWatchlist.ts](file:///C:/AntigravityWorkspace/pd2s/src/constants/defaultWatchlist.ts) | 103 | 시즌 14 시작일 상수(`2026-10-23`), 하이룬 14종 메타데이터(`HIGH_RUNE_CATALOG`), 핵심 화폐 5종(`CORE_CURRENCY_CATALOG`), 기본 커스텀 관심 아이템 4종(`DEFAULT_CUSTOM_WATCHLIST` - 샤코 3스킬 2소켓 포함). |
| [src/constants/statPresets.ts](file:///C:/AntigravityWorkspace/pd2s/src/constants/statPresets.ts) | 179 | 세부 조건 빌더용 주요 스탯 프리셋(`STAT_PRESET_OPTIONS`: 올스킬, 스킬탭, FCR, IAS, ED%, PDR%, 올레지, 매찬 등) 및 인게임 `Ctrl+C` 클립보드 텍스트 파서(`parseClipboardItemText`). |
| [src/workers/marketAnalysis.worker.ts](file:///C:/AntigravityWorkspace/pd2s/src/workers/marketAnalysis.worker.ts) | 376 | 백그라운드 Web Worker. 매물의 판매자 가격 원문(`price`)을 자연어/정규식으로 파싱하여 거래 수단(`PURE_HR`, `WSS`, `RUNE_EXCHANGE`, `RUNE_BREAK`, `GEMS_MATS`, `OFFER_OTHER`)을 분류하고, 추정 HR 가치를 역산하며, 시즌 14 시계열 데이터를 집계(`analyzeWatchItemData`). |
| [src/workers/useMarketWorker.ts](file:///C:/AntigravityWorkspace/pd2s/src/workers/useMarketWorker.ts) | 81 | Web Worker 인스턴스 생명주기 관리 및 비동기 Promise 브릿지 훅(`useMarketWorker` -> `analyzeItemAsync`). |

---

### C. UI 컴포넌트 (`src/components/`)
| 파일 경로 | 줄 수 | 핵심 역할 및 UI 기능 |
| :--- | :---: | :--- |
| [src/App.tsx](file:///C:/AntigravityWorkspace/pd2s/src/App.tsx) | 422 | 전체 상태 오케스트레이션. `isMobile`에 따라 모바일/데스크탑 레이아웃 분기 오케스트레이션 (500줄 이하 슬림화). |
| [src/components/DesktopLayout.tsx](file:///C:/AntigravityWorkspace/pd2s/src/components/DesktopLayout.tsx) | 160 | 데스크탑 전용 2단 분할 레이아웃(좌측 7/12 탭 전환 뷰 vs 우측 5/12 상세 패널 완전 독립 스크롤). |
| [src/components/MobileLayout.tsx](file:///C:/AntigravityWorkspace/pd2s/src/components/MobileLayout.tsx) | 99 | 모바일 전용 뷰 컨테이너 (선택된 모바일 탭에 따라 룬 시세 / 커스텀 추적 보드 / 상세 분석 단일 뷰 렌더링). |
| [src/components/MobileHeader.tsx](file:///C:/AntigravityWorkspace/pd2s/src/components/MobileHeader.tsx) | 92 | 모바일 전용 슬림 상단바 (슬림 로고, 시즌 14 태그, 원터치 SC/HC 토글, 동기화, `+추가` 버튼). |
| [src/components/MobileBottomNav.tsx](file:///C:/AntigravityWorkspace/pd2s/src/components/MobileBottomNav.tsx) | 92 | 모바일 하단 고정 탭바 (룬 시세 / 추적 보드 / 상세 분석 / 설정) 및 Safe-area 패딩 지원. |
| [src/components/HeaderBar.tsx](file:///C:/AntigravityWorkspace/pd2s/src/components/HeaderBar.tsx) | 189 | 데스크탑 상단 고정 바. 소프트코어(SC)/하드코어(HC) 전환, 시즌 14 필터, `+ 추적 아이템 추가`, 동기화 버튼. |
| [src/components/CustomWatchlistBoard.tsx](file:///C:/AntigravityWorkspace/pd2s/src/components/CustomWatchlistBoard.tsx) | 242 | 커스텀 세부 조건 아이템 카드 보드. 반응형 카드 그리드, 스탯/소켓/타락 배지, 추정 시세, 최저가, 판매/완료 건수. |
| [src/components/AddWatchItemModal.tsx](file:///C:/AntigravityWorkspace/pd2s/src/components/AddWatchItemModal.tsx) | 482 | `+ 추적 아이템 추가` 및 조건 수정 모달. 반응형 패딩 적용으로 모바일 가상 키보드 가림 방지 및 스크롤 최적화. |
| [src/components/RuneMatrixTable.tsx](file:///C:/AntigravityWorkspace/pd2s/src/components/RuneMatrixTable.tsx) | 280 | 하이룬 14종 실시간 HR 시세표. 반응형 컬럼 숨김 적용으로 모바일에서도 가로 스크롤 없이 깔끔한 렌더링. |
| [src/components/RuneBreakCalculator.tsx](file:///C:/AntigravityWorkspace/pd2s/src/components/RuneBreakCalculator.tsx) | 148 | 선택한 하이룬을 WSS 또는 하위 룬 조합으로 쪼갤 때의 실시간 손익 계산기. |
| [src/components/ItemDetailPanel.tsx](file:///C:/AntigravityWorkspace/pd2s/src/components/ItemDetailPanel.tsx) | 162 | 우측 독립 스크롤 심층 분석 컨테이너 (요약 배너 + 날짜별 시세 추이 차트 + 실거래 원문 분석 뷰). |
| [src/components/PriceTrendChart.tsx](file:///C:/AntigravityWorkspace/pd2s/src/components/PriceTrendChart.tsx) | 336 | 시즌 14 날짜별 시세 변동 인터랙티브 SVG 차트 및 최근 일자별 데이터 테이블. |
| [src/components/TradeBreakdownView.tsx](file:///C:/AntigravityWorkspace/pd2s/src/components/TradeBreakdownView.tsx) | 313 | 거래 수단 카테고리 비율 바, 최다 등장 지불 조건 TOP 랭킹 카드, 거래완료/판매중 원문 타임라인. |

---

### D. 테스트 및 자동화 검증 스위트
| 파일 경로 | 테스트 대상 및 내용 |
| :--- | :--- |
| [src/services/watchlist.test.ts](file:///C:/AntigravityWorkspace/pd2s/src/services/watchlist.test.ts) | 로컬 스토리지 Watchlist 추가/삭제/기본값 로드 로직 단위 테스트 (Vitest + jsdom). (3 tests passed) |
| [src/components/AddWatchItemModal.test.tsx](file:///C:/AntigravityWorkspace/pd2s/src/components/AddWatchItemModal.test.tsx) | `+ 추적 아이템 추가` 모달 렌더링, 폼 입력 및 `onSave` 콜백 전달 검증 단위 테스트. (1 test passed) |
| [src/App.test.tsx](file:///C:/AntigravityWorkspace/pd2s/src/App.test.tsx) | 전체 App 통합 테스트: 모달 열기 -> 새 아이템 등록 -> 좌측 카드 보드 및 우측 상세 패널 즉시 렌더링 검증. (1 test passed) |
| [scratch/puppeteer_e2e.mjs](file:///C:/AntigravityWorkspace/pd2s/scratch/puppeteer_e2e.mjs) | 실제 브라우저(Headless Chrome) 자동 제어 E2E 테스트. 브라우저 렌더링, 모달 열기, 아이템 추가, 좌측 카드 렌더링 및 스크린샷 캡처 자동 검증. |
| [docs/unit_test_results.txt](file:///C:/AntigravityWorkspace/pd2s/docs/unit_test_results.txt) | 전체 단위 테스트 및 E2E 브라우저 검증 결과 보고서. |

---

### E. CI/CD 및 자동 배포 파이프라인
| 파일 경로 | 줄 수 | 핵심 역할 및 기능 |
| :--- | :---: | :--- |
| [.github/workflows/release.yml](file:///C:/AntigravityWorkspace/pd2s/.github/workflows/release.yml) | 249 | GitHub Actions 동시 자동 릴리즈 워크플로우. `package.json`의 버전 변경 감지 ➡️ Git Tag(`vX.Y.Z`) 자동 발행 ➡️ Windows 빌드(포터블/인스톨러 ZIP) & Android 빌드(Universal APK) 병렬 수행 ➡️ 단일 GitHub Release 동시 업로드 및 배포. |
| [scripts/sync-version.mjs](file:///C:/AntigravityWorkspace/pd2s/scripts/sync-version.mjs) | 51 | 단일 버전 동기화 스크립트. `package.json`의 버전을 읽어 `src-tauri/tauri.conf.json`과 `src-tauri/Cargo.toml`의 버전을 자동으로 일치시킴 (`npm run version:sync` 또는 빌드 전 자동 실행). |
| [docs/github_release_plan.md](file:///C:/AntigravityWorkspace/pd2s/docs/github_release_plan.md) | 58 | GitHub 자동 태그 & Windows·Android 동시 자동 배포 CI/CD 파이프라인 아키텍처 문서. |
| [docs/android_and_pc_publish_plan.md](file:///C:/AntigravityWorkspace/pd2s/docs/android_and_pc_publish_plan.md) | 120 | 모바일 반응형 UI 구축 & PC·Android 동시 자동 배포 CI/CD 종합 아키텍처 계획서. |
