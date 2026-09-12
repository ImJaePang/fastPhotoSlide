import React, { useRef, useState, useCallback } from 'react';
import { View, StyleSheet, Dimensions, PixelRatio } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useEffect } from 'react';

const AnimatedExpoImage = Animated.createAnimatedComponent(ExpoImage);

const ANIMATED_IMAGE_EXTENSIONS = ['gif', 'webp'];
const VIDEO_EXTENSIONS = ['mp4', 'webm', 'mov', '3gp'];

// 메모리 최적화 상수
const DYNAMIC_QUALITY_THRESHOLD = 10000;
const PIXEL_RATIO = PixelRatio.get();

// 세로 스크롤 속도 비율: 내려가기 77%, 올라오기 23% (약 3.3:1 비율)
const SCROLL_DOWN_RATIO = 0.77;
const SCROLL_UP_RATIO = 0.23;

// 부드러운 가속/감속 Easing
const SMOOTH_EASING = Easing.bezier(0.42, 0, 0.58, 1);

/**
 * 가변 다운샘플링 크기를 계산합니다.
 */
function computeDownsampledSize(originalWidth, originalHeight, screenWidth) {
  const targetWidth = Math.round(screenWidth * PIXEL_RATIO);
  const aspectRatio = originalHeight / originalWidth;
  let targetHeight = Math.round(targetWidth * aspectRatio);

  if (targetHeight > DYNAMIC_QUALITY_THRESHOLD) {
    const reductionFactor = DYNAMIC_QUALITY_THRESHOLD / targetHeight;
    const clampedFactor = Math.max(0.5, reductionFactor);
    targetHeight = Math.round(targetHeight * clampedFactor);
  }

  return { width: targetWidth, height: targetHeight };
}

/**
 * 가로 사진용 다운샘플링 크기를 계산합니다.
 */
function computeLandscapeDownsampledSize(originalWidth, originalHeight, screenWidth, screenHeight) {
  const targetW = Math.round(screenWidth * PIXEL_RATIO);
  const targetH = Math.round(screenHeight * PIXEL_RATIO);
  if (!originalWidth || !originalHeight) {
    return { width: targetW, height: targetH };
  }
  const scale = Math.max(targetW / originalWidth, targetH / originalHeight);
  const clampedScale = Math.min(1, scale);
  return {
    width: Math.round(originalWidth * clampedScale),
    height: Math.round(originalHeight * clampedScale),
  };
}

function getExtension(filename = '') {
  return filename.split('.').pop()?.toLowerCase() ?? '';
}

function isVideo(asset) {
  return (
    asset.mediaType === 'video' ||
    VIDEO_EXTENSIONS.includes(getExtension(asset.filename))
  );
}

function isAnimatedImage(asset) {
  return ANIMATED_IMAGE_EXTENSIONS.includes(getExtension(asset.filename));
}

function isPortraitAsset(asset) {
  return asset.height > asset.width;
}

// ─────────────────────────────────────────
// 동영상 플레이어
// ─────────────────────────────────────────
function VideoPlayer({ asset, transitionTime, onNext }) {
  const videoRef = useRef(null);
  const timerRef = useRef(null);
  const [shouldLoop, setShouldLoop] = useState(false);
  const hasScheduled = useRef(false);

  useEffect(() => {
    hasScheduled.current = false;
    setShouldLoop(false);
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [asset.uri]);

  const handlePlaybackStatusUpdate = useCallback(
    (status) => {
      if (!status.isLoaded) return;

      if (status.durationMillis && !hasScheduled.current) {
        hasScheduled.current = true;
        const videoDurationSec = status.durationMillis / 1000;
        const transTimeSec = transitionTime;

        if (videoDurationSec < transTimeSec) {
          setShouldLoop(true);
          timerRef.current = setTimeout(() => {
            onNext();
          }, transTimeSec * 1000);
        }
      }

      if (status.didJustFinish && !shouldLoop) {
        onNext();
      }
    },
    [onNext, transitionTime, shouldLoop]
  );

  return (
    <Video
      ref={videoRef}
      source={{ uri: asset.uri }}
      style={StyleSheet.absoluteFill}
      resizeMode={ResizeMode.CONTAIN}
      shouldPlay
      isMuted
      isLooping={shouldLoop}
      onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
    />
  );
}

// ─────────────────────────────────────────
// 세로 이미지: 즉시 스크롤 시작, 균일 속도, 부드러운 Easing
// - 지연 시간 없음
// - 내려가기와 올라오기 즉시 연결
// - clamp로 유효하지 않은 영역 방지
// ─────────────────────────────────────────
function PortraitScrollImage({ uri, width, height, screenWidth, screenHeight, transitionTime }) {
  const displayHeight = screenWidth * (height / width);
  // 엄격한 스크롤 거리 제한: 절대 (이미지 높이 - 화면 높이) 초과 불가
  const scrollDistance = Math.max(0, Math.min(displayHeight - screenHeight, displayHeight));
  const translateY = useSharedValue(0);

  const downsampled = computeDownsampledSize(width, height, screenWidth);

  useEffect(() => {
    translateY.value = 0;
    if (scrollDistance <= 0) return;

    // 전체 애니메이션에 할당할 시간 (슬라이드 전환 시간의 약 90%)
    const totalAnimMs = Math.max(2000, (transitionTime - 1) * 1000);
    const scrollDownDuration = totalAnimMs * SCROLL_DOWN_RATIO;
    const reboundDuration    = totalAnimMs * SCROLL_UP_RATIO;

    // 리바운드 목표: 30% 되돌아감, clamp(0, scrollDistance) 범위 내
    const reboundTarget = Math.min(scrollDistance * 0.30, scrollDistance);
    const finalPosition = Math.max(-scrollDistance + reboundTarget, -scrollDistance);

    translateY.value = withSequence(
      // 1단계: 아래로 스크롤 (즉시 시작, 부드러운 가감속)
      withTiming(-scrollDistance, {
        duration: scrollDownDuration,
        easing: Easing.inOut(Easing.quad),
      }),
      // 2단계: 즉시 30% 리바운드 (동일한 부드러움)
      withTiming(finalPosition, {
        duration: reboundDuration,
        easing: SMOOTH_EASING,
      })
    );
  }, [uri, transitionTime, scrollDistance]);

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    // clamp: translateY가 유효 범위를 벗어나지 않도록 방어
    const clamped = Math.max(-scrollDistance, Math.min(0, translateY.value));
    return {
      transform: [{ translateY: clamped }],
    };
  });

  return (
    <AnimatedExpoImage
      source={{
        uri,
        width: downsampled.width,
        height: downsampled.height,
      }}
      style={[
        styles.portraitImage,
        { width: screenWidth, height: displayHeight },
        animatedStyle,
      ]}
      contentFit="cover"
      priority="high"
      cachePolicy="disk"
    />
  );
}

// ─────────────────────────────────────────
// 메인 SlideViewer 컴포넌트
// ─────────────────────────────────────────
export default function SlideViewer({ asset, transitionTime, onNext }) {
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  if (!asset) return <View style={styles.container} />;

  // ── 동영상 ──
  if (isVideo(asset)) {
    return (
      <View style={styles.container}>
        <VideoPlayer
          asset={asset}
          transitionTime={transitionTime}
          onNext={onNext}
        />
      </View>
    );
  }

  // ── 세로 이미지 (GIF/WebP 등 애니메이션 이미지 제외) — 스크롤 ──
  const isPortrait = !isAnimatedImage(asset) && isPortraitAsset(asset);
  if (isPortrait) {
    return (
      <View style={styles.container}>
        <PortraitScrollImage
          uri={asset.uri}
          width={asset.width}
          height={asset.height}
          screenWidth={screenWidth}
          screenHeight={screenHeight}
          transitionTime={transitionTime}
        />
      </View>
    );
  }

  // ── 세로형 GIF/WebP → contain(전체 보이기) ──
  if (isAnimatedImage(asset) && isPortraitAsset(asset)) {
    return (
      <View style={styles.container}>
        <ExpoImage
          source={{ uri: asset.uri }}
          style={StyleSheet.absoluteFill}
          contentFit="contain"
          autoplay={true}
          priority="high"
          cachePolicy="disk"
        />
      </View>
    );
  }

  // ── 가로 이미지 / 가로 GIF/WebP → cover(꽉 채움) ──
  const isAnim = isAnimatedImage(asset);
  const landscapeDownsampled = !isAnim
    ? computeLandscapeDownsampledSize(asset.width, asset.height, screenWidth, screenHeight)
    : null;

  const imageSource = landscapeDownsampled
    ? {
        uri: asset.uri,
        width: landscapeDownsampled.width,
        height: landscapeDownsampled.height,
      }
    : { uri: asset.uri };

  return (
    <View style={styles.container}>
      <ExpoImage
        source={imageSource}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        autoplay={true}
        priority="high"
        cachePolicy="disk"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  portraitImage: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
