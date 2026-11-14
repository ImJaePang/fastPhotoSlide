import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@photoviewer_prefs_v1';

const DEFAULTS = {
  transitionTime: 10,
  lastAlbumId: null,
  lastAlbumTitle: '',
};

/**
 * 슬라이드 간격, 마지막으로 재생한 앨범 등 앱 환경설정을 저장/복원합니다.
 */
export function usePreferences() {
  const [prefs, setPrefs] = useState(DEFAULTS);
  const [loaded, setLoaded] = useState(false);
  const prefsRef = useRef(DEFAULTS);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((json) => {
        if (json) {
          const merged = { ...DEFAULTS, ...JSON.parse(json) };
          prefsRef.current = merged;
          setPrefs(merged);
        }
      })
      .catch(() => { })
      .finally(() => setLoaded(true));
  }, []);

  const update = useCallback((patch) => {
    const next = { ...prefsRef.current, ...patch };
    prefsRef.current = next;
    setPrefs(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => { });
  }, []);

  return { prefs, loaded, update };
}
