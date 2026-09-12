import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import {
  GestureDetector,
  Gesture,
  Directions,
} from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

const EDGE_PERCENT = 0.20; // 좌/우 20% 터치 영역

/**
 * 화면 터치/스와이프로 이전/다음 이미지 이동을 처리하는 오버레이.
 * - 좌측 20% 탭 → onPrev
 * - 우측 20% 탭 → onNext
 * - 중앙 60% 탭 → onCenterTap (설정 열기)
 * - 좌→우 스와이프 → onPrev
 * - 우→좌 스와이프 → onNext
 *
 * ⚠️ 중요: Gesture Handler v2의 onEnd는 UI thread(worklet)에서 실행됩니다.
 *    JS 함수를 호출하려면 반드시 runOnJS()로 감싸야 합니다.
 */
export default function NavigationOverlay({
  onPrev,
  onNext,
  onCenterTap,
  children,
}) {
  const { width: screenWidth } = Dimensions.get('window');
  const leftEdge = screenWidth * EDGE_PERCENT;
  const rightEdge = screenWidth * (1 - EDGE_PERCENT);

  // 탭 제스처 — runOnJS로 안전하게 JS thread 콜백 호출
  const tapGesture = Gesture.Tap()
    .onEnd((event) => {
      'worklet';
      const x = event.x;
      if (x < leftEdge) {
        if (onPrev) runOnJS(onPrev)();
      } else if (x > rightEdge) {
        if (onNext) runOnJS(onNext)();
      } else {
        if (onCenterTap) runOnJS(onCenterTap)();
      }
    });

  // 스와이프 제스처 (좌→우 = 이전)
  const swipeRight = Gesture.Fling()
    .direction(Directions.RIGHT)
    .onEnd(() => {
      'worklet';
      if (onPrev) runOnJS(onPrev)();
    });

  // 스와이프 제스처 (우→좌 = 다음)
  const swipeLeft = Gesture.Fling()
    .direction(Directions.LEFT)
    .onEnd(() => {
      'worklet';
      if (onNext) runOnJS(onNext)();
    });

  // 모든 제스처를 동시에 감지
  const composedGesture = Gesture.Race(
    tapGesture,
    Gesture.Simultaneous(swipeLeft, swipeRight),
  );

  return (
    <GestureDetector gesture={composedGesture}>
      <View style={styles.container}>
        {children}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
