# 모바일 상단 상태바(Status Bar) 오버랩 방지 및 UI 성능 최적화 계획서

## 1. 개요 및 요구사항
- **요구사항**: 모바일 모드 실행 시 앱이 스마트폰 상단 시스템 상태바(Status Bar - 시계, 배터리, 통신사/와이파이 아이콘 영역)까지 침범하여 헤더 콘텐츠와 겹쳐서 그려지는 현상 수정.
- **추가 최적화(규칙 준수)**: UI 렌더링 성능을 저하시키는 `backdrop-blur` 관련 CSS 속성을 전역 제거하여 저사양 스마트폰에서도 60fps의 부드러운 스크롤 성능 보장.

---

## 2. 세부 구현 계획

### A. Viewport Safe Area 설정 (`index.html`)
- `viewport-fit=cover` 옵션 추가:
  - 브라우저 및 하이브리드 웹뷰(Tauri Webview)가 디바이스의 물리적 노치/다이나믹 아일랜드 및 상태바 안전 영역(`safe-area-inset-*`)을 계산할 수 있도록 활성화.

### B. 모바일 헤더 상태바 안전 여백 확보 (`src/components/MobileHeader.tsx`)
- 최상단에 상태바 스페이서(Status Bar Spacer) 레이아웃 배치:
  - `h-[max(env(safe-area-inset-top,0px),1.75rem)]`
  - 안드로이드 웹뷰 특성상 `env(safe-area-inset-top)`이 0px로 반환되더라도 표준 상태바 높이(`1.75rem` / 28px)를 기본 보장하여 겹침 원천 방지.
  - 노치/다이나믹 아일랜드 기기에서는 해당 안전 영역 높이에 맞춰 자동 확장.
- 상태바 배경은 헤더와 동일한 다크(`#121017`)로 채워 일체감 있는 네이티브 룩 제공.
- 헤더 콘텐츠(로고, SC/HC 토글, 동기화, 추가 버튼)는 상태바 아래의 안전 영역에 안정적으로 배치.

### C. 전역 Blur 제거 성능 최적화 (규칙 준수)
- `MobileHeader.tsx`: `backdrop-blur-md` 제거 ➡️ `bg-[#121017]` 단색 적용.
- `MobileBottomNav.tsx`: `backdrop-blur-md` 제거 ➡️ `bg-zinc-950` 단색 적용.
- `HeaderBar.tsx`: `backdrop-blur-md` 제거 ➡️ `bg-[#121017]` 단색 적용.
- `AddWatchItemModal.tsx`, `ApiKeySetupModal.tsx`: `backdrop-blur-sm` 제거 ➡️ `bg-black/80` 최적화.

### D. 버전 업데이트 및 릴리즈 배포
- `package.json` 버전을 `1.1.2`로 증가.
- 자동 릴리즈 파이프라인(`release.yml`)을 통해 `v1.1.2` 태그, PC용 포터블/설치 ZIP 및 상단 상태바가 완벽히 수리된 Android APK 동시 자동 배포.
