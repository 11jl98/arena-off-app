import { useEffect, useState } from 'react';
import { isMobile, isIOS, isAndroid } from 'react-device-detect';

export interface DeviceDetection {
  isMobile: boolean;
  isStandalone: boolean;
  isDesktop: boolean;
  isIOS: boolean;
  isAndroid: boolean;
}

const DESKTOP_QUERY = '(min-width: 1024px)';

function getIsStandalone() {
  if (typeof window === 'undefined') return false;

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function getIsDesktop() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(DESKTOP_QUERY).matches;
}

export const useDeviceDetection = (): DeviceDetection => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceDetection>({
    isMobile,
    isIOS,
    isAndroid,
    isStandalone: getIsStandalone(),
    isDesktop: getIsDesktop(),
  });

  useEffect(() => {
    const standaloneQuery = window.matchMedia('(display-mode: standalone)');
    const desktopQuery = window.matchMedia(DESKTOP_QUERY);

    const handleChange = () => {
      setDeviceInfo({
        isMobile,
        isIOS,
        isAndroid,
        isStandalone: getIsStandalone(),
        isDesktop: getIsDesktop(),
      });
    };

    standaloneQuery.addEventListener('change', handleChange);
    desktopQuery.addEventListener('change', handleChange);

    return () => {
      standaloneQuery.removeEventListener('change', handleChange);
      desktopQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return deviceInfo;
};
