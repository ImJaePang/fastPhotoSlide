import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
  cancelAnimation,
} from 'react-native-reanimated';
import SlideViewer from './SlideViewer';
import { resolveTransitionEffect } from '../utils/transitionConfig';

const EASING = Easing.bezier(0.25, 0.1, 0.25, 1);

// 효과 없음 모드에서도 이전 화면을 잠깐 남겨 두어 로딩 중 검은 화면 깜빡임을 방지
const CUT_HOLD_MS = 400;

// 새 이미지 로드를 기다리는 최대 시간
const READY_TIMEOUT_MS = 1200;

// 레이어 스타일 워크릿에서 쓰는 효과 코드 (0 = 전환 없음)
const EFFECT_CODE = { fade: 1, slide: 2, zoom: 3, cut: 4 };

/**
 * 더블 버퍼 방식 트랜지션 뷰어.
 *  - 슬롯 2개(A/B)를 번갈아 사용: 새 슬롯이 'in'(앞), 기존 슬롯이 'out'(뒤)이 됩니다.
 *  - 슬롯 컴포넌트는 역할이 바뀌어도 언마운트되지 않으므로 이미지/비디오 재로딩이 없습니다.
 *  - 전환이 끝나면 'out' 슬롯을 비워 메모리를 즉시 해제합니다.
 *  - 타이머/비디오 종료 콜백은 'in'(active) 슬롯만 호출합니다.
 *  - 전환 효과는 전환 시작 시 한 번만 결정됩니다.
 *  - 새 이미지가 로드(ready)된 뒤에 애니메이션을 시작해, 로딩 중 검은 화면이 끼어드는 것을 막습니다.
 *    (로드가 지연되면 READY_TIMEOUT_MS 후 그대로 진행)
 */
export default function TransitionSlideViewer({ asset, transitionTime, transitionSettings, onNext }) {
  const { width } = useWindowDimensions();
  const durationMs = (transitionSettings?.duration ?? 1.5) * 1000;
  const progress = useSharedValue(0);
  const settingsRef = useRef(transitionSettings);
  settingsRef.current = transitionSettings;

  const [state, setState] = useState(() => ({
    cur: asset,
    slots: [asset, null],
    front: 0,
    effect: null,
    transitioning: false,
    ready: false,
  }));

  // asset 변경을 렌더 중에 감지해 같은 커밋에서 슬롯/효과를 확정
  if (asset && asset !== state.cur) {
    const effect = state.cur ? resolveTransitionEffect(settingsRef.current) : null;
    const nextFront = 1 - state.front;
    const slots = [...state.slots];
    slots[nextFront] = asset;
    setState({
      cur: asset,
      slots,
      front: nextFront,
      effect: effect || 'cut',
      transitioning: !!state.cur,
      ready: false,
    });
  }

  const finish = useCallback(() => {
    setState((s) => {
      if (!s.transitioning) return s;
      return {
        ...s,
        slots: s.slots.map((a, i) => (i === s.front ? a : null)),
        transitioning: false,
        effect: null,
      };
    });
  }, []);

  // 새(앞쪽) 레이어의 이미지/영상이 준비되면 호출
  const markReady = useCallback((readyAsset) => {
    setState((s) => {
      if (!s.transitioning || s.ready) return s;
      if (readyAsset && s.slots[s.front] !== readyAsset) return s;
      return { ...s, ready: true };
    });
  }, []);

  // 준비 대기 중에는 이전 애니메이션을 멈추고 진행도를 0으로 유지 + 타임아웃 안전장치
  useEffect(() => {
    if (!state.transitioning || state.ready) return undefined;
    cancelAnimation(progress);
    progress.value = 0;
    const t = setTimeout(() => markReady(null), READY_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [state.cur, state.transitioning, state.ready, markReady, progress]);

  // 전환 시작 (준비된 뒤)
  useEffect(() => {
    if (!state.transitioning || !state.ready) return;
    progress.value = 0;
    progress.value = withTiming(
      1,
      { duration: state.effect === 'cut' ? CUT_HOLD_MS : durationMs, easing: EASING },
      (done) => {
        if (done) runOnJS(finish)();
      }
    );
  }, [state.cur, state.ready]); // eslint-disable-line react-hooks/exhaustive-deps

  // 전환이 끝나면 진행도를 0으로 되돌려 다음 전환 준비
  useEffect(() => {
    if (!state.transitioning) progress.value = 0;
  }, [state.transitioning, progress]);

  return (
    <View style={styles.container}>
      {state.slots.map((slotAsset, i) => (
        <Layer
          key={i}
          asset={slotAsset}
          isFront={i === state.front}
          transitioning={state.transitioning}
          ready={state.ready}
          onReady={markReady}
          effect={state.effect}
          progress={progress}
          width={width}
          transitionTime={transitionTime}
          onNext={onNext}
        />
      ))}
    </View>
  );
}

/**
 * 한 슬롯의 레이어.
 *
 * 중요: 스타일 워크릿이 클로저(props)가 아니라 **공유 값(shared value)만** 읽도록 했습니다.
 * useAnimatedStyle의 의존성이 바뀌면 Reanimated가 애니메이션 스타일 등록을 새로 하는데,
 * 그 사이 1~2프레임 동안 레이어가 '처음 마운트될 때의 초기 스타일(투명)'로 되돌아가
 * 슬라이드가 바뀔 때마다 화면이 검게 번쩍였습니다. 공유 값은 의존성이 바뀌지 않으므로 이 문제가 없습니다.
 */
function Layer({ asset, isFront, transitioning, ready, onReady, effect, progress, width, transitionTime, onNext }) {
  const frontSV = useSharedValue(isFront ? 1 : 0);
  const readySV = useSharedValue(ready ? 1 : 0);
  const modeSV = useSharedValue(transitioning ? EFFECT_CODE[effect] || EFFECT_CODE.cut : 0);

  // 렌더 직후(페인트 전) 공유 값 동기화
  useLayoutEffect(() => {
    frontSV.value = isFront ? 1 : 0;
    readySV.value = ready ? 1 : 0;
    modeSV.value = transitioning ? EFFECT_CODE[effect] || EFFECT_CODE.cut : 0;
  }, [isFront, ready, transitioning, effect, frontSV, readySV, modeSV]);

  const style = useAnimatedStyle(() => {
    const mode = modeSV.value;
    if (mode === 0) {
      return { opacity: 1, transform: [{ translateX: 0 }, { scale: 1 }] };
    }
    const front = frontSV.value === 1;
    // 새 이미지가 준비되기 전: 투명 + 화면 밖으로 완전히 숨김
    if (front && readySV.value === 0) {
      return { opacity: 0, transform: [{ translateX: width }, { scale: 1 }] };
    }
    const p = progress.value;
    if (front) {
      if (mode === 1) return { opacity: p, transform: [{ translateX: 0 }, { scale: 1 }] };
      if (mode === 2) return { opacity: 1, transform: [{ translateX: width * (1 - p) }, { scale: 1 }] };
      if (mode === 3) return { opacity: p, transform: [{ translateX: 0 }, { scale: 0.85 + 0.15 * p }] };
      return { opacity: 1, transform: [{ translateX: 0 }, { scale: 1 }] }; // cut
    }
    // 사라지는 레이어는 불투명을 유지해 크로스페이드 중 검은 화면이 비치지 않게 함
    if (mode === 2) return { opacity: 1, transform: [{ translateX: -width * p }, { scale: 1 }] };
    if (mode === 3) return { opacity: 1, transform: [{ translateX: 0 }, { scale: 1 + 0.15 * p }] };
    return { opacity: 1, transform: [{ translateX: 0 }, { scale: 1 }] };
  });

  if (!asset) return null;

  // 새 이미지가 준비되기 전에는 바깥 View(일반 View)에서 정적으로 숨김.
  // React 커밋과 같은 순간에 적용되므로, Reanimated 스타일이 적용되기 전 첫 프레임에
  // 검은 배경의 새 레이어가 잠깐 보이는 현상을 막는다.
  const hidden = isFront && transitioning && !ready;

  return (
    <View style={[styles.layer, { zIndex: isFront ? 2 : 1 }, hidden && styles.hidden]} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, style]}>
        <SlideViewer
          asset={asset}
          transitionTime={transitionTime}
          onNext={onNext}
          active={isFront}
          onReady={() => {
            if (isFront) onReady(asset);
          }}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  layer: { ...StyleSheet.absoluteFillObject },
  hidden: { opacity: 0 },
});
