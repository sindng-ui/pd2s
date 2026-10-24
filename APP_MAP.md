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

### A. Tauri 데스크탑 코어 (`src-tauri/`) & 로컬 스토리지 서비스
| 파일 경로 | 줄 수 | 핵심 역할 및 노출 인터페이스 |
| :--- | :---: | :--- |
| [src-tauri/tauri.conf.json](file:///C:/AntigravityWorkspace/pd2s/src-tauri/tauri.conf.json) | - | 데스크탑 창 설정(타이틀: `PD2 룬 & 커스텀 시세 트래커`, 기본 해상도: 1440x920, 번들 식별자: `com.pd2tracker.app`), 빌드 및 패키징 설정. |
| [src-tauri/src/main.rs](file:///C:/AntigravityWorkspace/pd2s/src-tauri/src/main.rs) | 12 | Tauri 네이티브 윈도우 앱 진입점 (`windows_subsystem = "windows"`로 터미널 콘솔창 숨김). |
| [src/services/storageService.ts](file:///C:/AntigravityWorkspace/pd2s/src/services/storageService.ts) | 126 | 사용자 PC 로컬 저장소(LocalStorage)에 API Key, 관심 목록, 일별 스냅샷, 거래 완료 로그 영구 저장/로드.<br>- `getStoredApiKey()`, `saveStoredApiKey(key)`<br>- `getStoredWatchlist()`, `saveStoredWatchlist(items)`<br>- `getStoredSnapshots()`, `appendStoredSnapshot(record)`<br>- `getStoredSoldHistoryMap()`, `mergeStoredSoldListings(watchKey, items)` |
| [src/services/marketApi.ts](file:///C:/AntigravityWorkspace/pd2s/src/services/marketApi.ts) | 391 | Node 서버 없이 `pd2trader.com` REST & GraphQL API로 직접 통신.<br>- `fetchOverviewApi(isLadder, isHardcore)`<br>- `fetchWatchlistApi()`, `addWatchItemApi()`, `deleteWatchItemApi()`<br>- `fetchItemListingsAndHistoryApi()`<br>- `recordCustomSnapshotApi()`<br>- `searchCatalogAutocompleteApi(query)` |
| [README.md](file:///C:/AntigravityWorkspace/pd2s/README.md) | 105 | GitHub 방문자를 위한 공식 한국어 프로젝트 소개서. 핵심 기능 5종, 캡처 이미지, 보안 안전성(이상한 곳 아님), 무료 API Key 발급 안내, ZIP 다운로드 안내. |
| [.gitignore](file:///C:/AntigravityWorkspace/pd2s/.gitignore) | 33 | Git 제외 파일 설정. `node_modules/`, `src-tauri/target/`, 빌드 산출물(`dist/`), 로컬 데이터 제외 처리. |

---

### B. 프론트엔드 타입, 상수, 서비스 및 멀티 워커 (`src/`)
| 파일 경로 | 줄 수 | 핵심 역할 및 노출 인터페이스 |
| :--- | :---: | :--- |
| [src/types/market.types.ts](file:///C:/AntigravityWorkspace/pd2s/src/types/market.types.ts) | 146 | 전체 도메인 타입 정의 (`RealmMode`, `StatFilterRule`, `WatchItemConfig`, `EconomyItemSummary`, `PriceHistoryPoint`, `RawMarketListingItem`, `BarterCategory`, `ParsedMarketListing`, `AnalyzedItemResult`, `LocalSnapshotRecord`). |
| [src/constants/defaultWatchlist.ts](file:///C:/AntigravityWorkspace/pd2s/src/constants/defaultWatchlist.ts) | 103 | 시즌 14 시작일 상수(`2026-10-23`), 하이룬 14종 메타데이터(`HIGH_RUNE_CATALOG`), 핵심 화폐 5종(`CORE_CURRENCY_CATALOG`), 기본 커스텀 관심 아이템 4종(`DEFAULT_CUSTOM_WATCHLIST` - 샤코 3스킬 2소켓 포함). |
| [src/constants/statPresets.ts](file:///C:/AntigravityWorkspace/pd2s/src/constants/statPresets.ts) | 179 | 세부 조건 빌더용 주요 스탯 프리셋(`STAT_PRESET_OPTIONS`: 올스킬, 스킬탭, FCR, IAS, ED%, PDR%, 올레지, 매찬 등) 및 인게임 `Ctrl+C` 클립보드 텍스트 파서(`parseClipboardItemText`). |
| [src/workers/marketAnalysis.worker.ts](file:///C:/AntigravityWorkspace/pd2s/src/workers/marketAnalysis.worker.ts) | 376 | 백그라운드 Web Worker. 매물의 판매자 가격 원문(`price`)을 자연어/정규식으로 파싱하여 거래 수단(`PURE_HR`, `WSS`, `RUNE_EXCHANGE`, `RUNE_BREAK`, `GEMS_MATS`, `OFFER_OTHER`)을 분류하고, 추정 HR 가치를 역산하며, 시즌 14 시계열 데이터를 집계(`analyzeWatchItemData`). |
| [src/workers/useMarketWorker.ts](file:///C:/AntigravityWorkspace/pd2s/src/workers/useMarketWorker.ts) | 81 | Web Worker 인스턴스 생명주기 관리 및 비동기 Promise 브릿지 훅(`useMarketWorker` -> `analyzeItemAsync`). |

---

### C. UI 컴포넌트 (`src/components/`)
| 파일 경로 | 줄 수 | 핵심 역할 및 UI 기능 |
| :--- | :---: | :--- |
| [src/App.tsx](file:///C:/AntigravityWorkspace/pd2s/src/App.tsx) | 450 | 전체 상태 오케스트레이션, 옵션 B 탭 분리 레이아웃(`leftTab`: 'runes' 시세표 vs 'custom' 추적 보드), 신규 아이템 추가 시 자동 탭 전환, 좌/우 완전 독립 스크롤. |
| [src/components/ApiKeySetupModal.tsx](file:///C:/AntigravityWorkspace/pd2s/src/components/ApiKeySetupModal.tsx) | 107 | 최초 실행 시 API Key 등록 안내 모달. 무료 발급 링크 안내 및 본인 PC 로컬 스토리지에 1회 영구 저장. |
| [src/components/HeaderBar.tsx](file:///C:/AntigravityWorkspace/pd2s/src/components/HeaderBar.tsx) | 189 | 상단 고정 바. 소프트코어(SC)/하드코어(HC) 전환, 시즌 14(10/23~) 순수 데이터 필터 토글, `+ 추적 아이템 추가` 버튼, 동기화/스냅샷 버튼, API Key 설정 모달 트리거. |
| [src/components/CustomWatchlistBoard.tsx](file:///C:/AntigravityWorkspace/pd2s/src/components/CustomWatchlistBoard.tsx) | 242 | 사용자가 등록한 세부 조건 아이템(예: 샤코 +3 올스킬 / 2소켓) 카드 보드. `shrink-0` 적용으로 flex 레이아웃 압축 방지. 설정된 스탯/소켓/타락 배지, 추정 시세(HR), 현재 최저가(Ask), 판매중/거래완료 건수 및 최다 거래 수단 표시. |
| [src/components/AddWatchItemModal.tsx](file:///C:/AntigravityWorkspace/pd2s/src/components/AddWatchItemModal.tsx) | 481 | `+ 추적 아이템 추가` 및 조건 수정 모달. 카탈로그 실시간 자동완성 검색, 소켓 범위/타락/에테리얼 설정, 세부 스탯 조건(`pseudo_all_skills >= 3` 등) 빌더, 인게임 `Ctrl+C` 텍스트 붙여넣기 자동 세팅. |
| [src/components/RuneMatrixTable.tsx](file:///C:/AntigravityWorkspace/pd2s/src/components/RuneMatrixTable.tsx) | 280 | 하이룬(Zod ~ Lem) 14종 실시간 HR 시세표(24h 시세, 표준 기준가, 실거래 교환 수단 태그, SVG 미니 스파크라인, 7일 등락률) 및 주요 화폐 5종 요약 카드. |
| [src/components/RuneBreakCalculator.tsx](file:///C:/AntigravityWorkspace/pd2s/src/components/RuneBreakCalculator.tsx) | 148 | 선택한 하이룬을 WSS 또는 하위 룬 조합(예: Ber -> Sur×2, Jah+Lo)으로 쪼갤 때의 실시간 손익 계산기. |
| [src/components/ItemDetailPanel.tsx](file:///C:/AntigravityWorkspace/pd2s/src/components/ItemDetailPanel.tsx) | 162 | 우측 독립 스크롤 심층 분석 컨테이너. 선택한 룬/커스텀 아이템의 요약 배너 + 날짜별 시세 추이 차트 + 실거래 원문 분석 뷰 결합. |
| [src/components/PriceTrendChart.tsx](file:///C:/AntigravityWorkspace/pd2s/src/components/PriceTrendChart.tsx) | 336 | 시즌 14 날짜별 시세 변동 인터랙티브 SVG 차트(평균 시세선, 7일 이동평균선, 시즌 14 포인트 하이라이트, 호버 툴팁) 및 최근 일자별 데이터 테이블. |
| [src/components/TradeBreakdownView.tsx](file:///C:/AntigravityWorkspace/pd2s/src/components/TradeBreakdownView.tsx) | 313 | "실제 무엇으로 거래되고 있는가?" 분석 뷰. 거래 수단 카테고리 비율 바, 최다 등장 지불 조건 TOP 랭킹 카드, 거래완료(`SOLD`) 및 판매중(`LIVE`) 매물의 원문(`price`) 타임라인. 옵셔널 체이닝으로 방어 코드 완비. |

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
| [.github/workflows/release.yml](file:///C:/AntigravityWorkspace/pd2s/.github/workflows/release.yml) | 110 | GitHub Actions 자동 릴리즈 워크플로우. `package.json`의 버전 변경 감지 ➡️ Git Tag(`vX.Y.Z`) 자동 발행 ➡️ Tauri 윈도우 빌드 ➡️ `.exe` 파일들을 브라우저 차단 방지용 `.zip`으로 압축 ➡️ GitHub Release 생성 및 첨부파일 자동 업로드. |
| [scripts/sync-version.mjs](file:///C:/AntigravityWorkspace/pd2s/scripts/sync-version.mjs) | 43 | 단일 버전 동기화 스크립트. `package.json`의 버전을 읽어 `src-tauri/tauri.conf.json`과 `src-tauri/Cargo.toml`의 버전을 자동으로 일치시킴 (`npm run version:sync` 또는 빌드 전 자동 실행). |
| [docs/github_release_plan.md](file:///C:/AntigravityWorkspace/pd2s/docs/github_release_plan.md) | 48 | GitHub 자동 태그 & ZIP 압축 릴리즈 CI/CD 아키텍처 문서. |
