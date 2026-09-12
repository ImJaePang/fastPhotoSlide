import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    DEFAULT_TRANSITION_SETTINGS,
    STORAGE_KEY,
} from '../utils/transitionConfig';

/**
 * 트랜지션 설정을 관리하고 AsyncStorage에 영구 저장하는 훅.
 */
export function useTransitionSettings() {
    const [settings, setSettings] = useState(DEFAULT_TRANSITION_SETTINGS);
    const [loaded, setLoaded] = useState(false);

    // 앱 시작 시 저장된 설정 로드
    useEffect(() => {
        AsyncStorage.getItem(STORAGE_KEY)
            .then((json) => {
                if (json) {
                    const saved = JSON.parse(json);
                    setSettings((prev) => ({ ...prev, ...saved }));
                }
            })
            .catch(() => { })
            .finally(() => setLoaded(true));
    }, []);

    // 설정 변경 시 저장
    const persist = useCallback((next) => {
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => { });
    }, []);

    const setMode = useCallback((mode) => {
        setSettings((prev) => {
            const next = { ...prev, mode };
            persist(next);
            return next;
        });
    }, [persist]);

    const setSingleEffect = useCallback((effectId) => {
        setSettings((prev) => {
            const next = { ...prev, singleEffect: effectId };
            persist(next);
            return next;
        });
    }, [persist]);

    const toggleMultiEffect = useCallback((effectId) => {
        setSettings((prev) => {
            const current = prev.multiEffects || [];
            let updated;
            if (current.includes(effectId)) {
                updated = current.filter((e) => e !== effectId);
                // 최소 1개는 선택되어야 함
                if (updated.length === 0) updated = [effectId];
            } else {
                updated = [...current, effectId];
            }
            const next = { ...prev, multiEffects: updated };
            persist(next);
            return next;
        });
    }, [persist]);

    const setDuration = useCallback((duration) => {
        setSettings((prev) => {
            const next = { ...prev, duration };
            persist(next);
            return next;
        });
    }, [persist]);

    return {
        settings,
        loaded,
        setMode,
        setSingleEffect,
        toggleMultiEffect,
        setDuration,
    };
}
