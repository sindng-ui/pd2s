# Tauri 기반 PD2 데스크탑 앱 전환 & API Key 로컬 저장 구현 계획서

> [!IMPORTANT]
> 형님의 PC 환경을 확인한 결과 **Rust 1.93.1 및 Cargo가 완벽하게 설치**되어 있습니다!
> Node.js 서버 없이 누구나 다운로드하여 `.exe` 더블클릭만으로 실행할 수 있는 초경량 데스크탑 앱으로 전환하는 계획입니다.
> 유저의 API Key는 외부로 유출되지 않고 **각 사용자의 PC 로컬 스토리지에 최초 1회만 안전하게 저장**되어 영구 사용됩니다.
> 아래 계획을 검토하시고 **Proceed** 버튼을 눌러주시면 즉시 구현에 착수하겠습니다!

---

## 1. 아키텍처 전환 목표

1. **Node.js 완전 제거**:
   - 기존의 `server/apiMiddleware.ts` 및 Express 스타일 미들웨어를 제거하거나 Tauri 백엔드로 완전히 대체합니다.
   - 사용자는 Node.js나 npm을 설치할 필요 없이 완성된 단일 실행 파일(`PD2_Market_Tracker.exe` 약 10~15MB)만 실행하면 됩니다.
2. **API Key 사용자 PC 로컬 저장 (보안 및 편의성)**:
   - 앱 최초 실행 시 API Key가 없으면 직관적인 **[API Key 등록 안내 모달]**을 띄웁니다.
   - 발급 링크(`pd2trader.com/developers/api-keys`) 원클릭 연결 버튼을 제공합니다.
   - 입력한 키는 사용자 PC(Tauri Local AppData / Web LocalStorage)에 영구 보관되어, 다음 실행부터는 다시 입력할 필요 없이 자동 로드됩니다.
   - 키 변경이나 마스킹 해제는 상단 바의 키 아이콘에서 언제든 가능합니다.
3. **네트워크 호출 구조 (Client Direct Fetch)**:
   - `pd2trader.com`이 브라우저 및 데스크탑 앱의 CORS를 전면 허용(`access-control-allow-origin: *`)하고 있으므로, 프론트엔드가 사용자의 API Key로 직접 안전하게 통신합니다.

---

## 2. 파일 및 구조 변경 계획 (500줄 제한 엄수)

```text
C:/AntigravityWorkspace/pd2s/
├── src-tauri/                       # [신규] Tauri Rust 코어
│   ├── Cargo.toml                   # Tauri 의존성 설정
│   ├── tauri.conf.json              # 창 크기, 타이틀, 아이콘, 빌드 설정
│   └── src/
│       └── main.rs                  # 초경량 데스크탑 진입점
├── src/
│   ├── services/
│   │   ├── storageService.ts        # [신규] 로컬 스토리지(LocalStorage) 기반 Watchlist, Snapshots, Config 저장
│   │   └── marketApi.ts             # [수정] Node 서버 대신 브라우저/Tauri 직접 통신 모드로 변경
│   └── components/
│       ├── ApiKeySetupModal.tsx     # [신규] 최초 실행 시 친절한 API Key 등록 모달
│       └── HeaderBar.tsx            # [수정] 키 상태 표시 및 재설정 연동
└── package.json                     # [수정] @tauri-apps/cli, @tauri-apps/api 추가
```

---

## 3. 세부 구현 단계

1. **Step 1: Tauri 초기화 및 프로젝트 패키징 환경 세팅**
   - `@tauri-apps/cli` 설치 및 `src-tauri` 생성 (타이틀: "PD2 룬 & 커스텀 시세 트래커", 해상도 1400x900 기본).
2. **Step 2: 사용자 로컬 스토리지 서비스 구현 (`src/services/storageService.ts`)**
   - `apiKey`, `watchlist`, `snapshots`, `soldHistory`를 사용자 PC 로컬에 안전하게 읽기/쓰기.
3. **Step 3: `marketApi.ts` 전환**
   - Node 로컬 서버(`/api/local/*`) 호출부를 직접 `pd2trader.com` REST/GraphQL 호출로 리팩토링.
4. **Step 4: 최초 사용자용 API Key 안내 모달(`ApiKeySetupModal.tsx`) 추가**
   - 키가 등록되어 있지 않을 때 깔끔하고 친절하게 안내.
5. **Step 5: Tauri 빌드 및 실행 검증, `APP_MAP.md` 및 `docs/test_results.txt` 갱신**
   - `npm run tsc` 및 Tauri dev 실행 점검, 500줄 제한 확인.
