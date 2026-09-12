import { useRef, useState, useCallback, useEffect } from 'react';
import { Image as ExpoImage } from 'expo-image';
import { SlideshowQueue } from '../utils/shuffle';

// 메모리 캐시 GC 주기 (이미지 교체 횟수)
const MEMORY_GC_INTERVAL = 5;

/**
 * 슬라이드쇼 상태 및 타이머 로직을 관리하는 커스텀 훅.
 * prev/next 네비게이션 + 다음 이미지 프리페치 + 메모리 GC 지원.
 *
 * slideKey를 사용하여 같은 에셋이 연속 등장해도 타이머가 반드시 재설정되도록 보장.
 */
export function useSlideshow(assets, transitionTime) {
    const queueRef = useRef(new SlideshowQueue(assets));
    const timerRef = useRef(null);
    const isPlayingRef = useRef(true);
    const slideCountRef = useRef(0);

    const [currentAsset, setCurrentAsset] = useState(() => queueRef.current.next());
    const [nextAsset, setNextAsset] = useState(null);
    const [isPlaying, setIsPlaying] = useState(true);
    // slideKey: 매번 증가시켜서, 같은 에셋이 연속으로 와도 useEffect가 반드시 실행되게 함
    const [slideKey, setSlideKey] = useState(0);

    // 에셋을 변경하고 slideKey를 증가시키는 헬퍼
    const advanceToAsset = useCallback((asset) => {
        setCurrentAsset(asset);
        setSlideKey((k) => k + 1);
    }, []);

    // assets 변경 시 큐 교체
    useEffect(() => {
        if (!assets || assets.length === 0) return;
        queueRef.current.setItems(assets);
        slideCountRef.current = 0;
        const first = queueRef.current.next();
        advanceToAsset(first);
        prefetchNext();
    }, [assets]);

    // 메모리 가비지 컬렉션: N장마다 메모리 캐시 해제
    const checkMemoryGC = useCallback(() => {
        slideCountRef.current += 1;
        if (slideCountRef.current % MEMORY_GC_INTERVAL === 0) {
            console.log(`[GC] ${slideCountRef.current}장 교체 → 메모리 캐시 정리`);
            ExpoImage.clearMemoryCache().catch(() => { });
        }
    }, []);

    // 다음 이미지 프리페치
    const prefetchNext = useCallback(() => {
        const peek = queueRef.current.peekNext();
        setNextAsset(peek);
        if (peek?.uri && peek.mediaType !== 'video') {
            ExpoImage.prefetch(peek.uri).catch(() => { });
        }
    }, []);

    const clearTimer = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const scheduleNext = useCallback((asset, time) => {
        clearTimer();
        if (asset?.mediaType === 'video') return;
        timerRef.current = setTimeout(() => {
            if (isPlayingRef.current) {
                checkMemoryGC();
                const nextItem = queueRef.current.next();
                advanceToAsset(nextItem);
                prefetchNext();
            }
        }, time * 1000);
    }, [clearTimer, prefetchNext, checkMemoryGC, advanceToAsset]);

    // slideKey가 변경될 때마다 타이머 재설정 (같은 에셋이어도 확실히 실행)
    useEffect(() => {
        if (!currentAsset) return;
        scheduleNext(currentAsset, transitionTime);
        return clearTimer;
    }, [slideKey, transitionTime, scheduleNext, clearTimer]);

    const next = useCallback(() => {
        clearTimer();
        checkMemoryGC();
        const nextItem = queueRef.current.next();
        advanceToAsset(nextItem);
        prefetchNext();
    }, [clearTimer, prefetchNext, checkMemoryGC, advanceToAsset]);

    const prev = useCallback(() => {
        clearTimer();
        const prevItem = queueRef.current.prev();
        if (prevItem) {
            advanceToAsset(prevItem);
            prefetchNext();
        }
    }, [clearTimer, prefetchNext, advanceToAsset]);

    const pause = useCallback(() => {
        isPlayingRef.current = false;
        setIsPlaying(false);
        clearTimer();
    }, [clearTimer]);

    const resume = useCallback(() => {
        isPlayingRef.current = true;
        setIsPlaying(true);
        scheduleNext(currentAsset, transitionTime);
    }, [currentAsset, transitionTime, scheduleNext]);

    return { currentAsset, nextAsset, next, prev, isPlaying, pause, resume };
}
