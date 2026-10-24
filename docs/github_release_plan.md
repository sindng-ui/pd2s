# GitHub 자동 태그 & ZIP 압축 릴리즈 CI/CD 구현 계획

## 1. 개요
- **단일 버전 관리 파일 지정**: 루트의 `package.json` 딱 하나만 수정하도록 설정.
- 형님이 `package.json`의 `"version"`을 변경(예: `"1.0.0"` ➡️ `"1.0.1"`)하여 GitHub에 push하면:
  1. GitHub Actions가 이전 태그와 비교하여 버전 변경을 자동 감지
  2. 새로운 git tag(예: `v1.0.1`)를 자동으로 생성 및 푸시
  3. Windows 러너에서 Tauri 네이티브 빌드 자동 수행
  4. 웹 브라우저 다운로드 경고/차단 문제를 방지하기 위해 `.exe` 산출물을 **`.zip`으로 자동 압축**
  5. GitHub Release 페이지에 변경 로그와 함께 ZIP 첨부파일 자동 배포

---

## 2. 세부 설계 및 구성 요소

### A. 버전 단일 관리 파일: `package.json`
- 형님은 오직 `package.json`의 `version` 필드만 수정하시면 됩니다:
  ```json
  {
    "name": "pd2-market-tracker",
    "version": "1.0.1",
    ...
  }
  ```

### B. 버전 자동 동기화 스크립트 (`scripts/sync-version.mjs`)
- `package.json`의 버전을 읽어 `src-tauri/tauri.conf.json`과 `src-tauri/Cargo.toml`의 버전을 빌드 전 자동으로 일치시켜 주는 경량 스크립트.

### C. GitHub Actions 워크플로우 (`.github/workflows/release.yml`)
1. **트리거**: `main` 브랜치에 push 발생 시 실행.
2. **버전 변경 감지 로직**:
   - `package.json`의 버전 문자열 추출 (예: `1.0.1`).
   - 원격 저장소에 `v1.0.1` 태그가 이미 존재하는지 체크.
   - 이미 있는 버전이면 빌드를 건너뛰고 종료.
   - 새로운 버전이면 자동으로 `v1.0.1` 태그 생성 후 릴리즈 파이프라인 가동.
3. **Windows 빌드 & ZIP 압축**:
   - Rust toolchain 및 Node.js 세팅.
   - `npm ci`, `npm run build`, `npx tauri build` 수행.
   - 빌드 산출물:
     - 포터블 실행 파일: `pd2-tracker.exe` ➡️ `pd2-tracker-v${VERSION}-portable-windows-x64.zip`
     - 간편 설치 프로그램: `pd2-tracker_*_x64-setup.exe` ➡️ `pd2-tracker-v${VERSION}-installer-windows-x64.zip`
4. **GitHub Release 자동 생성 및 Asset 업로드**:
   - `softprops/action-gh-release` 액션을 사용하여 ZIP 첨부파일과 함께 깔끔한 릴리즈 노트 자동 생성.
