import { useEffect, useState } from 'react';
import { isMobile, isIOS, isAndroid } from 'react-device-detect';

export interface DeviceDetection {
  isMobile: boolean;
  isStandalone: boolean;
  isIOS: boolean;
  isAndroid: boolean;
}

function getIsStandalone() {
  if (typeof window === 'undefined') return false;

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export const useDeviceDetection = (): DeviceDetection => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceDetection>({
    isMobile,
    isIOS,
    isAndroid,
    isStandalone: getIsStandalone(),
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(display-mode: standalone)');

    const handleChange = () => {
      setDeviceInfo({
        isMobile,
        isIOS,
        isAndroid,
        isStandalone: getIsStandalone(),
      });
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return deviceInfo;
};
