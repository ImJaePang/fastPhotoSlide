import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import SlideViewer from './SlideViewer';
import { resolveTransitionEffect } from '../utils/transitionConfig';

const PREMIUM_EASING = Easing.bezier(0.25, 0.1, 0.25, 1);

/**
 * 두 개의 레이어를 교차하며 트랜지션 효과를 적용하는 슬라이드 뷰어.
 * - 현재 이미지(backLayer)와 다음 이미지(frontLayer)를 겹쳐 놓고,
 *   트랜지션 애니메이션으로 자연스럽게 전환합니다.
 */
export default function TransitionSlideViewer({
  asset,
  nextAsset,
  transitionTime,
  transitionSettings,
  onNext,
}) {
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const durationMs = (transitionSettings?.duration ?? 1.5) * 1000;

  // ── 두 레이어에 표시할 에셋 관리 ──
  const [displayAsset, setDisplayAsset] = useState(asset);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevAssetRef = useRef(null);

  // ── 애니메이션 shared values ──
  const progress = useSharedValue(0);  // 0 = 현재, 1 = 전환 완료

  // 트랜지션 완료 콜백
  const onTransitionComplete = useCallback(() => {
    setDisplayAsset(asset);
    setIsTransitioning(false);
    progress.value = 0;
  }, [asset, progress]);

  // asset 변경 감지 → 트랜지션 시작
  useEffect(() => {
    if (!asset) return;

    const effect = resolveTransitionEffect(transitionSettings);

    // 효과 없음 또는 첫 이미지
    if (!effect || !prevAssetRef.current) {
      setDisplayAsset(asset);
      prevAssetRef.current = asset;
      return;
    }

    // 같은 에셋이면 무시
    if (prevAssetRef.current?.id === asset?.id) return;

    // 트랜지션 시작
    setIsTransitioning(true);
    progress.value = 0;
    progress.value = withTiming(1, {
      duration: durationMs,
      easing: PREMIUM_EASING,
    }, (finished) => {
      if (finished) {
        runOnJS(onTransitionComplete)();
      }
    });

    prevAssetRef.current = asset;
  }, [asset?.id]);

  // ── 현재 결정할 효과 ──
  const currentEffect = resolveTransitionEffect(transitionSettings);

  // ── 뒤쪽 레이어 (이전 이미지) 스타일 ──
  const backLayerStyle = useAnimatedStyle(() => {
    if (!currentEffect) return { opacity: 1 };

    switch (currentEffect) {
      case 'fade':
        return { opacity: 1 - progress.value };
      case 'slide':
        return {
          opacity: 1,
          transform: [{ translateX: -screenWidth * progress.value }],
        };
      case 'zoom':
        return {
          opacity: 1 - progress.value,
          transform: [{ scale: 1 + 0.3 * progress.value }],
        };
      case 'blur':
        return { opacity: 1 - progress.value * 0.7 };
      default:
        return { opacity: 1 };
    }
  });

  // ── 앞쪽 레이어 (새 이미지) 스타일 ──
  const frontLayerStyle = useAnimatedStyle(() => {
    if (!currentEffect) return { opacity: 1 };

    switch (currentEffect) {
      case 'fade':
        return { opacity: progress.value };
      case 'slide':
        return {
          opacity: 1,
          transform: [{ translateX: screenWidth * (1 - progress.value) }],
        };
      case 'zoom':
        return {
          opacity: progress.value,
          transform: [{ scale: 0.8 + 0.2 * progress.value }],
        };
      case 'blur':
        return { opacity: progress.value };
      default:
        return { opacity: 1 };
    }
  });

  // ── Blur 오버레이 강도 ──
  const blurIntensity = useSharedValue(0);

  useEffect(() => {
    if (currentEffect === 'blur' && isTransitioning) {
      blurIntensity.value = 0;
      blurIntensity.value = withTiming(80, {
        duration: durationMs * 0.4,
        easing: PREMIUM_EASING,
      });
      // 중간에 블러 줄이기
      setTimeout(() => {
        blurIntensity.value = withTiming(0, {
          duration: durationMs * 0.6,
          easing: PREMIUM_EASING,
        });
      }, durationMs * 0.4);
    }
  }, [isTransitioning, currentEffect, durationMs]);

  const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

  const blurStyle = useAnimatedStyle(() => ({
    intensity: blurIntensity.value,
  }));

  // ── 효과 없음 모드: 직접 렌더 ──
  if (!currentEffect) {
    return (
      <SlideViewer
        asset={asset}
        transitionTime={transitionTime}
        onNext={onNext}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* 뒤쪽 레이어: 이전 이미지 (사라지는 중) */}
      <Animated.View style={[styles.layer, backLayerStyle]}>
        <SlideViewer
          asset={isTransitioning ? displayAsset : asset}
          transitionTime={transitionTime}
          onNext={onNext}
        />
      </Animated.View>

      {/* 앞쪽 레이어: 새 이미지 (나타나는 중) */}
      {isTransitioning && (
        <Animated.View style={[styles.layer, frontLayerStyle]}>
          <SlideViewer
            asset={asset}
            transitionTime={transitionTime}
            onNext={onNext}
          />
        </Animated.View>
      )}

      {/* Blur 효과 오버레이 */}
      {isTransitioning && currentEffect === 'blur' && (
        <BlurView
          style={StyleSheet.absoluteFill}
          intensity={50}
          tint="dark"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  layer: {
    ...StyleSheet.absoluteFillObject,
  },
});
