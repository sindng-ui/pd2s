import { useState, useEffect } from 'react';

export interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
}

/**
 * 모바일(화면 폭 < 768px), 태블릿(768px ~ 1023px), 데스크탑(>= 1024px) 반응형 뷰포트 감지 훅
 * matchMedia 리스너를 활용하여 CPU 부하 없이 화면 전환을 정밀하게 감지합니다.
 */
export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>(() => {
    if (typeof window === 'undefined') {
      return { isMobile: false, isTablet: false, isDesktop: true, width: 1440 };
    }
    const width = window.innerWidth;
    return {
      isMobile: width < 768,
      isTablet: width >= 768 && width < 1024,
      isDesktop: width >= 1024,
      width,
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

    const mediaQueryMobile = window.matchMedia('(max-width: 767px)');
    const mediaQueryTablet = window.matchMedia('(min-width: 768px) and (max-width: 1023px)');

    const updateMatches = () => {
      const width = window.innerWidth;
      setState({
        isMobile: mediaQueryMobile.matches,
        isTablet: mediaQueryTablet.matches,
        isDesktop: !mediaQueryMobile.matches && !mediaQueryTablet.matches,
        width,
      });
    };

    updateMatches();

    if (mediaQueryMobile.addEventListener) {
      mediaQueryMobile.addEventListener('change', updateMatches);
      mediaQueryTablet.addEventListener('change', updateMatches);
      return () => {
        mediaQueryMobile.removeEventListener('change', updateMatches);
        mediaQueryTablet.removeEventListener('change', updateMatches);
      };
    } else {
      // 구형 브라우저 대응
      mediaQueryMobile.addListener(updateMatches);
      mediaQueryTablet.addListener(updateMatches);
      return () => {
        mediaQueryMobile.removeListener(updateMatches);
        mediaQueryTablet.removeListener(updateMatches);
      };
    }
  }, []);

  return state;
}
