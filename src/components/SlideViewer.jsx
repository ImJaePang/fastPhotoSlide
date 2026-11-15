import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, PixelRatio, useWindowDimensions } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { displayTimeSec, scrollPlan } from '../utils/slideTiming';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const AnimatedExpoImage = Animated.createAnimatedComponent(ExpoImage);

const ANIMATED_IMAGE_EXTENSIONS = ['gif', 'webp'];
const VIDEO_EXTENSIONS = ['mp4', 'webm', 'mov', '3gp'];

const PIXEL_RATIO = PixelRatio.get();

// 디코딩할 비트맵의 최대 픽셀 수 (약 8MP ≒ 32MB). OOM 방지용 상한.
const MAX_DECODE_PIXELS = 8_000_000;


// 이미지 로드 실패 시 다음 슬라이드로 넘어가기까지의 대기 시간
const ERROR_SKIP_MS = 1500;

/** 디코딩 크기가 MAX_DECODE_PIXELS를 넘지 않도록 비율 유지하며 축소 */
function capPixels(width, height) {
  const pixels = width * height;
  if (pixels <= MAX_DECODE_PIXELS) return { width, height };
  const k = Math.sqrt(MAX_DECODE_PIXELS / pixels);
  return { width: Math.round(width * k), height: Math.round(height * k) };
}

function computeDownsampledSize(originalWidth, originalHeight, screenWidth) {
  const targetWidth = Math.round(screenWidth * PIXEL_RATIO);
  const targetHeight = Math.round(targetWidth * (originalHeight / originalWidth));
  return capPixels(targetWidth, targetHeight);
}

function computeLandscapeDownsampledSize(originalWidth, originalHeight, screenWidth, screenHeight) {
  const targetW = Math.round(screenWidth * PIXEL_RATIO);
  const targetH = Math.round(screenHeight * PIXEL_RATIO);
  if (!originalWidth || !originalHeight) return capPixels(targetW, targetH);
  const scale = Math.min(1, Math.max(targetW / originalWidth, targetH / originalHeight));
  return capPixels(Math.round(originalWidth * scale), Math.round(originalHeight * scale));
}

function getExtension(filename = '') {
  return filename.split('.').pop()?.toLowerCase() ?? '';
}

function isVideo(asset) {
  return asset.mediaType === 'video' || VIDEO_EXTENSIONS.includes(getExtension(asset.filename));
}

function isAnimatedImage(asset) {
  return ANIMATED_IMAGE_EXTENSIONS.includes(getExtension(asset.filename));
}

function isPortraitAsset(asset) {
  return asset.height > asset.width;
}

/**
 * source 객체를 값이 같으면 같은 참조로 유지하는 ExpoImage 래퍼.
 * 부모가 리렌더될 때마다 새 source 객체가 전달되면 이미지가 다시 로드되며 한두 프레임 비어 보임(번쩍임).
 */
function StableImage({ uri, width, height, ...rest }) {
  const source = useMemo(
    () => (width && height ? { uri, width, height } : { uri }),
    [uri, width, height]
  );
  return <ExpoImage source={source} {...rest} />;
}

/** 이미지 로드 실패 시 active 레이어만 다음 슬라이드로 넘김 */
function useSkipOnError(active, onNext, onReady) {
  return React.useCallback(() => {
    onReady?.();
    if (!active) return;
    console.warn('[SlideViewer] 이미지 로드 실패 → 다음 슬라이드로 이동');
    setTimeout(() => onNext?.(), ERROR_SKIP_MS);
  }, [active, onNext, onReady]);
}

// ─────────────────────────────────────────
// 동영상 플레이어 (expo-video)
// - 슬라이드 시간보다 짧은 영상: 루프 재생 후 슬라이드 시간에 맞춰 전환
// - 슬라이드 시간보다 긴 영상: 끝까지 재생 후 전환
// - active=false(전환 중 사라지는 레이어)는 타이머를 걸지 않음
// ─────────────────────────────────────────
function VideoPlayer({ asset, transitionTime, onNext, active, onReady }) {
  const slideMs = Math.max(3, transitionTime || 10) * 1000;
  const durationMs = (asset.duration || 0) * 1000;
  const playToEnd = durationMs > slideMs;

  const player = useVideoPlayer(asset.uri, (p) => {
    p.loop = !playToEnd;
    p.muted = true;
    p.play();
  });

  useEffect(() => {
    if (!active) return undefined;

    let timer;
    const subs = [];

    if (playToEnd) {
      subs.push(player.addListener('playToEnd', () => onNext()));
      // 안전장치: 끝 이벤트가 안 와도 영상 길이 + 3초 후에는 넘어감
      timer = setTimeout(() => onNext(), durationMs + 3000);
    } else {
      timer = setTimeout(() => onNext(), slideMs);
    }

    // 재생 오류 시 빠르게 건너뜀
    subs.push(
      player.addListener('statusChange', ({ status }) => {
        if (status === 'error') {
          console.warn('[VideoPlayer] 재생 오류 → 다음 슬라이드로 이동');
          clearTimeout(timer);
          timer = setTimeout(() => onNext(), ERROR_SKIP_MS);
        }
      })
    );

    return () => {
      clearTimeout(timer);
      subs.forEach((s) => s.remove());
    };
  }, [active, player, playToEnd, durationMs, slideMs, onNext, asset.uri]);

  return (
    <VideoView
      player={player}
      style={StyleSheet.absoluteFill}
      contentFit="contain"
      nativeControls={false}
      onFirstFrameRender={onReady}
    />
  );
}

// ─────────────────────────────────────────
// 세로 이미지: 위→아래로 천천히 스크롤했다가 일부 되돌아옴
// ─────────────────────────────────────────
function PortraitScrollImage({ uri, width, height, screenWidth, screenHeight, transitionTime, onError, onReady }) {
  const displayHeight = screenWidth * (height / width);
  const scrollDistance = Math.max(0, displayHeight - screenHeight);
  const translateY = useSharedValue(0);
  const downsampled = computeDownsampledSize(width, height, screenWidth);
  const source = useMemo(
    () => ({ uri, width: downsampled.width, height: downsampled.height }),
    [uri, downsampled.width, downsampled.height]
  );

  useEffect(() => {
    translateY.value = 0;
    if (scrollDistance <= 0) return;

    // 표시 시간은 slideTiming 유틸과 동일한 계산 (타이머와 어긋나지 않게)
    const displaySec = displayTimeSec({ width, height, filename: '' }, transitionTime, screenWidth, screenHeight);
    const { delayMs, durationMs } = scrollPlan(scrollDistance, displaySec);

    // 위 → 아래로 한 번만, 일정한 속도로 부드럽게 (왕복 없음)
    translateY.value = withDelay(
      delayMs,
      withTiming(-scrollDistance, { duration: durationMs, easing: Easing.inOut(Easing.sin) })
    );
  }, [uri, transitionTime, scrollDistance, translateY]);

  const animatedStyle = useAnimatedStyle(() => {
    const clamped = Math.max(-scrollDistance, Math.min(0, translateY.value));
    return { transform: [{ translateY: clamped }] };
  });

  return (
    <AnimatedExpoImage
      source={source}
      style={[styles.portraitImage, { width: screenWidth, height: displayHeight }, animatedStyle]}
      contentFit="cover"
      priority="high"
      cachePolicy="memory"
      transition={0}
      onLoad={onReady}
      onError={onError}
    />
  );
}

// ─────────────────────────────────────────
// 메인 SlideViewer
// ─────────────────────────────────────────
export default function SlideViewer({ asset, transitionTime, onNext, active = true, onReady }) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const handleError = useSkipOnError(active, onNext, onReady);

  if (!asset) return <View style={styles.container} />;

  // ── 동영상 ──
  if (isVideo(asset)) {
    return (
      <View style={styles.container}>
        <VideoPlayer
          key={asset.id}
          asset={asset}
          transitionTime={transitionTime}
          onNext={onNext}
          active={active}
          onReady={onReady}
        />
      </View>
    );
  }

  const isAnim = isAnimatedImage(asset);
  const portrait = isPortraitAsset(asset);

  // ── 세로 이미지 → 스크롤 ──
  if (!isAnim && portrait) {
    return (
      <View style={styles.container}>
        <PortraitScrollImage
          key={asset.id}
          uri={asset.uri}
          width={asset.width}
          height={asset.height}
          screenWidth={screenWidth}
          screenHeight={screenHeight}
          transitionTime={transitionTime}
          onError={handleError}
          onReady={onReady}
        />
      </View>
    );
  }

  // ── 세로형 GIF/WebP → contain ──
  if (isAnim && portrait) {
    return (
      <View style={styles.container}>
        <StableImage
          key={asset.id}
          uri={asset.uri}
          style={StyleSheet.absoluteFill}
          contentFit="contain"
          autoplay
          priority="high"
          cachePolicy="memory"
          transition={0}
          onLoad={onReady}
          onError={handleError}
        />
      </View>
    );
  }

  // ── 가로 이미지 / 가로 GIF/WebP → cover ──
  const ds = !isAnim
    ? computeLandscapeDownsampledSize(asset.width, asset.height, screenWidth, screenHeight)
    : null;

  return (
    <View style={styles.container}>
      <StableImage
        key={asset.id}
        uri={asset.uri}
        width={ds?.width}
        height={ds?.height}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        autoplay
        priority="high"
        cachePolicy="memory"
        transition={0}
        onLoad={onReady}
        onError={handleError}
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
