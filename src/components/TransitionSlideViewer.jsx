import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import SlideViewer from './SlideViewer';
import { resolveTransitionEffect } from '../utils/transitionConfig';

const EASING = Easing.bezier(0.25, 0.1, 0.25, 1);

// 효과 없음 모드에서도 이전 화면을 잠깐 남겨 두어 로딩 중 검은 화면 깜빡임을 방지
const CUT_HOLD_MS = 400;

/**
 * 더블 버퍼 방식 트랜지션 뷰어.
 *  - 슬롯 2개(A/B)를 번갈아 사용: 새 슬롯이 'in'(앞), 기존 슬롯이 'out'(뒤)이 됩니다.
 *  - 슬롯 컴포넌트는 역할이 바뀌어도 언마운트되지 않으므로 이미지/비디오 재로딩이 없습니다.
 *  - 전환이 끝나면 'out' 슬롯을 비워 메모리를 즉시 해제합니다.
 *  - 타이머/비디오 종료 콜백은 'in'(active) 슬롯만 호출합니다.
 *  - 전환 효과는 전환 시작 시 한 번만 결정됩니다.
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
  }));

  // asset 변경을 렌더 중에 감지해 같은 커밋에서 슬롯/효과를 확정 (깜빡임 방지)
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

  // 전환 시작
  useEffect(() => {
    if (!state.transitioning) return;
    progress.value = 0;
    progress.value = withTiming(
      1,
      { duration: state.effect === 'cut' ? CUT_HOLD_MS : durationMs, easing: EASING },
      (done) => {
        if (done) runOnJS(finish)();
      }
    );
  }, [state.cur]); // eslint-disable-line react-hooks/exhaustive-deps

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

function Layer({ asset, isFront, transitioning, effect, progress, width, transitionTime, onNext }) {
  const style = useAnimatedStyle(() => {
    if (!transitioning) {
      return { opacity: 1, transform: [{ translateX: 0 }, { scale: 1 }] };
    }
    const p = progress.value;
    if (isFront) {
      switch (effect) {
        case 'fade':
          return { opacity: p, transform: [{ translateX: 0 }, { scale: 1 }] };
        case 'slide':
          return { opacity: 1, transform: [{ translateX: width * (1 - p) }, { scale: 1 }] };
        case 'zoom':
          return { opacity: p, transform: [{ translateX: 0 }, { scale: 0.85 + 0.15 * p }] };
        default: // cut
          return { opacity: 1, transform: [{ translateX: 0 }, { scale: 1 }] };
      }
    }
    // 사라지는 레이어는 불투명을 유지해 크로스페이드 중 검은 화면이 비치지 않게 함
    switch (effect) {
      case 'slide':
        return { opacity: 1, transform: [{ translateX: -width * p }, { scale: 1 }] };
      case 'zoom':
        return { opacity: 1, transform: [{ translateX: 0 }, { scale: 1 + 0.15 * p }] };
      default:
        return { opacity: 1, transform: [{ translateX: 0 }, { scale: 1 }] };
    }
  }, [transitioning, isFront, effect, width]);

  if (!asset) return null;

  return (
    <Animated.View
      style={[styles.layer, { zIndex: isFront ? 2 : 1 }, style]}
      pointerEvents="none"
    >
      <SlideViewer asset={asset} transitionTime={transitionTime} onNext={onNext} active={isFront} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  layer: { ...StyleSheet.absoluteFillObject },
});
