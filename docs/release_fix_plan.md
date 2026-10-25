# GitHub Actions Windows & Android 동시 자동 릴리즈 복구 계획서 (v1.1.1)

## 1. 문제 현상 및 근본 원인 분석
- **현상**: `package.json`의 버전을 `1.1.1`로 올린 후 태그/릴리즈에 PC용 실행파일(.zip)과 모바일 APK(.apk)가 업로드되지 않고, GitHub 기본 Source code(zip, tar.gz)만 첨부되어 있음.
- **원인 1**: GitHub Actions 워크플로우(`.github/workflows/release.yml`)의 `build-android` 작업에서 `android-actions/setup-android@v3` 액션이 구형 cmdline-tools 다운로드 URL 변경으로 인해 실행 오류 발생.
- **원인 2**: `publish-release` 작업이 `[check-version, build-windows, build-android]` 세 작업 모두 성공해야만 실행되도록 묶여 있어, Windows PC 빌드는 성공했음에도 불구하고 Android 빌드 실패로 인해 릴리즈 발행 단계가 전체 취소(스킵)됨.
- **원인 3**: 파이프라인 시작 단계에서 `v1.1.1` Git 태그를 먼저 push했기 때문에, GitHub 웹에는 태그만 남아 기본 소스코드 압축본만 노출되고 정식 GitHub Release가 생성되지 못함.
- **원인 4**: 원격에 이미 `v1.1.1` 태그가 생성되어 있어, 추가 커밋 푸시 시 `Tag already exists`로 판단되어 릴리즈 빌드가 재시도되지 않고 스킵됨.

---

## 2. 해결 및 개선 계획

### A. Android 빌드 스텝 안정화 및 자동 서명 (`release.yml`)
1. **내장 SDK/NDK 직접 활용**:
   - 깨지는 구형 써드파티 액션(`android-actions/setup-android@v3`) 제거.
   - GitHub Actions `ubuntu-latest` 러너에 사전 설치된 공식 Android SDK(`$ANDROID_HOME`) 및 NDK 자동 탐색 로직 적용.
2. **비대화형 Android 초기화**:
   - `CI=true npx tauri android init --ci` 실행으로 대화형 프롬프트 대기 방지.
3. **APK 릴리즈 서명(Keystore & apksigner)**:
   - 안드로이드 기기에서 "패키지 파싱 오류"나 "설치 불가"가 발생하지 않도록, 빌드 전 임시 릴리즈 키스토어 자동 생성 및 빌드된 APK에 `apksigner` 자동 서명 적용.

### B. 배포 파이프라인 복원력(Resilience) 강화
1. **개별 플랫폼 실패 격리**:
   - Windows와 Android 중 한 플랫폼에 예기치 않은 오류가 발생하더라도, 성공한 플랫폼의 결과물이 누락되지 않고 GitHub Release에 즉시 배포되도록 조건식 보완.
2. **수동 트리거(`workflow_dispatch`) 추가**:
   - 브라우저 Actions 탭에서 필요 시 언제든 수동으로 재배포를 돌릴 수 있도록 이벤트 추가.

### C. 원격 태그 정리 및 v1.1.1 재배포 트리거
1. 원격(`origin`)에 고립된 `v1.1.1` 태그 삭제 (`git push origin --delete v1.1.1`).
2. 로컬 `v1.1.1` 태그 삭제 및 워크플로우 커밋 푸시.
3. GitHub Actions가 깨끗한 상태에서 Windows PC 빌드 및 Android APK 빌드를 완료하고, 결과물이 첨부된 정식 `v1.1.1` 릴리즈를 발행하도록 조치.

---

## 3. 검증 계획
1. Git 및 GitHub API를 통해 GitHub Actions 실행 상태 및 Job 로그 모니터링.
2. Release `v1.1.1`에 포터블 ZIP, 인스톨러 ZIP, Android APK가 정상 등록되었는지 검증.
3. `APP_MAP.md`에 변경 사항 최신화 및 보고.
