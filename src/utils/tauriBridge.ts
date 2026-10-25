/**
 * C:/AntigravityWorkspace/pd2s/src/utils/tauriBridge.ts
 * 데스크탑/안드로이드 네이티브(Tauri 2)와 웹 브라우저 환경을 원활하게 브릿지하는 유틸리티
 */

// Tauri 네이티브 런타임 환경 여부 판별
export function isTauriRuntime(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean((window as any).__TAURI_INTERNALS__);
}

/**
 * CORS 차단 우회 HTTP Fetch 함수
 * 모바일(Android) 및 데스크탑 앱 환경에서는 Rust 네이티브 레벨(Reqwest)로 통신하여 CORS 제약을 원천 차단하며,
 * 웹 브라우저/개발 환경에서는 표준 window.fetch로 자동 폴백(Fallback)합니다.
 */
export async function tauriFetch(
  input: RequestInfo | URL | string,
  init?: RequestInit
): Promise<Response> {
  if (isTauriRuntime()) {
    try {
      const { fetch: nativeFetch } = await import('@tauri-apps/plugin-http');
      return await nativeFetch(input as any, init as any);
    } catch (err) {
      console.warn('[tauriFetch] Native HTTP plugin unavailable, falling back to window.fetch:', err);
    }
  }

  return window.fetch(input as any, init);
}

/**
 * 외부 링크(브라우저) 안전 열기 함수
 * 안드로이드/PC 앱 환경에서는 시스템 기본 웹 브라우저로 띄우고, 일반 웹에서는 window.open으로 동작합니다.
 */
export async function openExternalUrl(url: string): Promise<void> {
  if (!url) return;

  if (isTauriRuntime()) {
    try {
      const { openUrl } = await import('@tauri-apps/plugin-opener');
      await openUrl(url);
      return;
    } catch (err) {
      console.warn('[openExternalUrl] Opener plugin fallback to window.open:', err);
    }
  }

  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
