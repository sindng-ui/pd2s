# APP_MAP.md — PD2 시세 & 실거래 추적 대시보드 (PD2 Market Tracker)

본 문서는 프로젝트의 전체 파일 구조, 모듈 역할, 데이터 흐름 및 인터페이스를 관리하는 아키텍처 맵입니다.

---

## 1. 시스템 개요
- **목적**: Project Diablo 2 (Season 14: Alliance) 하이룬(Zod~Lem), 주요 화폐(WSS, 퍼즐박스 등), 그리고 사용자가 `+` 버튼으로 세부 조건(예: `샤코 +3 올스킬 / 2소켓`)을 지정해 등록한 커스텀 아이템의 **1) 실시간 HR 시세, 2) 실제 거래 완료(Sold) 및 활성 매물 물물교환 원문 분석, 3) 시즌 날짜별 시세 변동 추이**를 추적.
- **실행 주소**: `http://localhost:5173` (`npm run dev`)

---

## 2. 디렉토리 및 모듈 인터페이스 맵

### A. 백엔드 & 로컬 영구 스토리지 (`server/`)
| 파일 경로 | 줄 수 | 핵심 역할 및 노출 인터페이스 |
| :--- | :---: | :--- |
| [server/storageService.ts](file:///C:/AntigravityWorkspace/pd2s/server/storageService.ts) | 142 | 로컬 `data/` 폴더 내 JSON DB(`config.json`, `watchlist.json`, `snapshots.json`, `sold_history.json`) 영구 읽기/쓰기.<br>- `getServerConfig()`, `saveServerConfig(apiKey)`<br>- `getCustomWatchlist()`, `saveCustomWatchlist(items)`<br>- `getSnapshots()`, `appendSnapshot(record)`<br>- `mergeSoldListings(watchKey, newSoldItems)` |
| [.gitignore](file:///C:/AntigravityWorkspace/pd2s/.gitignore) | 33 | Git 제외 파일 설정. `node_modules/`, 빌드 산출물(`dist/`), 민감한 API Key가 저장되는 `data/config.json`, 로컬 누적 캐시/로그(`data/snapshots.json`, `data/sold_history.json`) 제외 처리. |
| [server/pd2Client.ts](file:///C:/AntigravityWorkspace/pd2s/server/pd2Client.ts) | 314 | `pd2trader.com` REST 및 GraphQL API와 직접 통신하는 클라이언트.<br>- `fetchRunesAndCurrencyOverview(apiKey, isLadder, isHardcore)`: 하이룬 14종 & 화폐 5종 실시간 시세 및 GraphQL Alias 기반 30일 일별 히스토리 병렬 조회<br>- `searchItemListings(apiKey, config, isLadder, isHardcore, source, limit)`: 세부 조건(`socketsMin`, `socketsMax`, `corrupted`, `ethereal`, `stats`) 기반 `live` 및 `archive(sold)` 매물 검색<br>- `searchCatalogItems(apiKey, query)`: 아이템 카탈로그 자동완성 검색<br>- `fetchItemBaseHistory(apiKey, itemNameOrCode, isHardcore)` |
| [server/apiMiddleware.ts](file:///C:/AntigravityWorkspace/pd2s/server/apiMiddleware.ts) | 218 | Vite 서버에 마운트되는 로컬 REST API 라우터 (`/api/local/*`).<br>- `GET/POST /api/local/config`<br>- `GET/POST/DELETE /api/local/watchlist`<br>- `GET /api/local/overview`<br>- `POST /api/local/item-listings`<br>- `POST /api/local/snapshot-custom`<br>- `GET /api/local/catalog-search` |

---

### B. 프론트엔드 타입, 상수, 서비스 및 멀티 워커 (`src/`)
| 파일 경로 | 줄 수 | 핵심 역할 및 노출 인터페이스 |
| :--- | :---: | :--- |
| [src/types/market.types.ts](file:///C:/AntigravityWorkspace/pd2s/src/types/market.types.ts) | 146 | 전체 도메인 타입 정의 (`RealmMode`, `StatFilterRule`, `WatchItemConfig`, `EconomyItemSummary`, `PriceHistoryPoint`, `RawMarketListingItem`, `BarterCategory`, `ParsedMarketListing`, `AnalyzedItemResult`, `LocalSnapshotRecord`). |
| [src/constants/defaultWatchlist.ts](file:///C:/AntigravityWorkspace/pd2s/src/constants/defaultWatchlist.ts) | 103 | 시즌 14 시작일 상수(`2026-10-23`), 하이룬 14종 메타데이터(`HIGH_RUNE_CATALOG`), 핵심 화폐 5종(`CORE_CURRENCY_CATALOG`), 기본 커스텀 관심 아이템 4종(`DEFAULT_CUSTOM_WATCHLIST` - 샤코 3스킬 2소켓 포함). |
| [src/constants/statPresets.ts](file:///C:/AntigravityWorkspace/pd2s/src/constants/statPresets.ts) | 179 | 세부 조건 빌더용 주요 스탯 프리셋(`STAT_PRESET_OPTIONS`: 올스킬, 스킬탭, FCR, IAS, ED%, PDR%, 올레지, 매찬 등) 및 인게임 `Ctrl+C` 클립보드 텍스트 파서(`parseClipboardItemText`). |
| [src/workers/marketAnalysis.worker.ts](file:///C:/AntigravityWorkspace/pd2s/src/workers/marketAnalysis.worker.ts) | 376 | 백그라운드 Web Worker. 매물의 판매자 가격 원문(`price`)을 자연어/정규식으로 파싱하여 거래 수단(`PURE_HR`, `WSS`, `RUNE_EXCHANGE`, `RUNE_BREAK`, `GEMS_MATS`, `OFFER_OTHER`)을 분류하고, 추정 HR 가치를 역산하며, 시즌 14 시계열 데이터를 집계(`analyzeWatchItemData`). |
| [src/workers/useMarketWorker.ts](file:///C:/AntigravityWorkspace/pd2s/src/workers/useMarketWorker.ts) | 81 | Web Worker 인스턴스 생명주기 관리 및 비동기 Promise 브릿지 훅(`useMarketWorker` -> `analyzeItemAsync`). |
| [src/services/marketApi.ts](file:///C:/AntigravityWorkspace/pd2s/src/services/marketApi.ts) | 131 | 프론트엔드 UI와 `/api/local/*` 백엔드 간의 HTTP 통신 함수 모음. |

---

### C. 프론트엔드 UI 컴포넌트 (`src/components/` & `src/App.tsx`)
| 파일 경로 | 줄 수 | 핵심 역할 및 UI 기능 |
| :--- | :---: | :--- |
| [src/App.tsx](file:///C:/AntigravityWorkspace/pd2s/src/App.tsx) | 363 | 전체 상태 오케스트레이션, 2-Column 반응형 대시보드 레이아웃, 백그라운드 배치 분석 스케줄링. |
| [src/components/HeaderBar.tsx](file:///C:/AntigravityWorkspace/pd2s/src/components/HeaderBar.tsx) | 194 | 상단 고정 바. 소프트코어(SC)/하드코어(HC) 전환, 시즌 14(10/23~) 순수 데이터 필터 토글, `+ 추적 아이템 추가` 버튼, 동기화/스냅샷 버튼, API Key 설정 드롭다운. |
| [src/components/CustomWatchlistBoard.tsx](file:///C:/AntigravityWorkspace/pd2s/src/components/CustomWatchlistBoard.tsx) | 243 | 사용자가 등록한 세부 조건 아이템(예: 샤코 +3 올스킬 / 2소켓) 카드 보드. 설정된 스탯/소켓/타락 배지, 추정 시세(HR), 현재 최저가(Ask), 판매중/거래완료 건수 및 최다 거래 수단 표시. |
| [src/components/AddWatchItemModal.tsx](file:///C:/AntigravityWorkspace/pd2s/src/components/AddWatchItemModal.tsx) | 481 | `+ 추적 아이템 추가` 및 조건 수정 모달. 카탈로그 실시간 자동완성 검색, 소켓 범위/타락/에테리얼 설정, 세부 스탯 조건(`pseudo_all_skills >= 3` 등) 빌더, 인게임 `Ctrl+C` 텍스트 붙여넣기 자동 세팅. |
| [src/components/RuneMatrixTable.tsx](file:///C:/AntigravityWorkspace/pd2s/src/components/RuneMatrixTable.tsx) | 281 | 하이룬(Zod ~ Lem) 14종 실시간 HR 시세표(24h 시세, 표준 기준가, 실거래 교환 수단 태그, SVG 미니 스파크라인, 7일 등락률) 및 주요 화폐 5종 요약 카드. |
| [src/components/RuneBreakCalculator.tsx](file:///C:/AntigravityWorkspace/pd2s/src/components/RuneBreakCalculator.tsx) | 149 | 선택한 하이룬을 WSS 또는 하위 룬 조합(예: Ber -> Sur×2, Jah+Lo)으로 쪼갤 때의 실시간 손익 계산기. |
| [src/components/ItemDetailPanel.tsx](file:///C:/AntigravityWorkspace/pd2s/src/components/ItemDetailPanel.tsx) | 162 | 우측 고정(Sticky) 심층 분석 컨테이너. 선택한 룬/커스텀 아이템의 요약 배너 + 날짜별 시세 추이 차트 + 실거래 원문 분석 뷰 결합. |
| [src/components/PriceTrendChart.tsx](file:///C:/AntigravityWorkspace/pd2s/src/components/PriceTrendChart.tsx) | 336 | 시즌 14 날짜별 시세 변동 인터랙티브 SVG 차트(평균 시세선, 7일 이동평균선, 시즌 14 포인트 하이라이트, 호버 툴팁) 및 최근 일자별 데이터 테이블. |
| [src/components/TradeBreakdownView.tsx](file:///C:/AntigravityWorkspace/pd2s/src/components/TradeBreakdownView.tsx) | 314 | "실제 무엇으로 거래되고 있는가?" 분석 뷰. 거래 수단 카테고리 비율 바, 최다 등장 지불 조건 TOP 랭킹 카드, 거래완료(`SOLD`) 및 판매중(`LIVE`) 매물의 원문(`price`) 타임라인. |
