import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import Slider from '@react-native-community/slider';
import { useTheme } from '../theme/ThemeProvider';
import { PALETTES, RADIUS } from '../theme/themes';
import { Button, Card, CardTitle, Label, Segmented, Chip, Separator } from './ui';
import {
  TRANSITION_MODES,
  TRANSITION_EFFECTS,
  DURATION_PRESETS,
} from '../utils/transitionConfig';

const MODE_OPTIONS = [
  { value: TRANSITION_MODES.NONE, label: '효과 없음' },
  { value: TRANSITION_MODES.SINGLE, label: '단일' },
  { value: TRANSITION_MODES.MULTI, label: '랜덤' },
];

const THEME_OPTIONS = [
  { value: 'system', label: '시스템' },
  { value: 'light', label: '라이트' },
  { value: 'dark', label: '다크' },
];

export default function SettingsOverlay({
  visible,
  isPlaying,
  transitionTime,
  currentAlbumTitle,
  transitionSettings,
  hasSlides = true,
  onTogglePlay,
  onOpenAlbumPicker,
  onTransitionTimeChange,
  onTransitionTimeCommit,
  onClose,
  onTransitionModeChange,
  onSingleEffectChange,
  onMultiEffectToggle,
  onTransitionDurationChange,
  onInteraction,
}) {
  const { colors, mode: themeMode, palette, setMode, setPalette } = useTheme();
  if (!visible) return null;

  const { mode, singleEffect, multiEffects, duration } = transitionSettings || {};

  // 설정 조작 중에는 자동 숨김 타이머를 연장
  const touch = (fn) => (...args) => {
    onInteraction?.();
    return fn?.(...args);
  };

  return (
    <View style={[styles.overlay, { backgroundColor: colors.scrim }]}>
      <View style={[styles.panel, { backgroundColor: colors.background, borderColor: colors.border }]}>
        {/* 헤더 */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.foreground }]}>설정</Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 2 }}>
              디지털 액자 슬라이드쇼를 원하는 대로 조정하세요
            </Text>
          </View>
          <Button title="닫기" variant="ghost" size="sm" onPress={onClose} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          onScrollBeginDrag={onInteraction}
          contentContainerStyle={styles.columns}
        >
          {/* ─── 왼쪽: 슬라이드쇼 + 화면 ─── */}
          <View style={styles.col}>
            <Card>
              <CardTitle description="재생할 앨범과 전환 간격">슬라이드쇼</CardTitle>

              <Label>앨범</Label>
              <View style={styles.albumRow}>
                <Text style={[styles.albumName, { color: colors.foreground }]} numberOfLines={1}>
                  {currentAlbumTitle || '선택된 앨범 없음'}
                </Text>
                <Button title="변경" variant="outline" size="sm" onPress={touch(onOpenAlbumPicker)} />
              </View>

              <Separator />

              <View style={styles.rowBetween}>
                <Label style={{ marginBottom: 0 }}>슬라이드 간격</Label>
                <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '600' }}>{transitionTime}초</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={3}
                maximumValue={60}
                step={1}
                value={transitionTime}
                onValueChange={touch(onTransitionTimeChange)}
                onSlidingComplete={onTransitionTimeCommit}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.border}
                thumbTintColor={colors.primary}
              />
              <View style={styles.rowBetween}>
                <Text style={[styles.hint, { color: colors.mutedForeground }]}>3초</Text>
                <Text style={[styles.hint, { color: colors.mutedForeground }]}>60초</Text>
              </View>

              {hasSlides && (
                <Button
                  title={isPlaying ? '일시정지' : '재생'}
                  variant={isPlaying ? 'secondary' : 'default'}
                  onPress={touch(onTogglePlay)}
                  style={{ marginTop: 16 }}
                />
              )}
            </Card>

            <Card style={{ marginTop: 16 }}>
              <CardTitle description="시스템 설정을 따르거나 직접 선택">화면</CardTitle>

              <Label>테마</Label>
              <Segmented options={THEME_OPTIONS} value={themeMode} onChange={touch(setMode)} />

              <Label style={{ marginTop: 16 }}>포인트 컬러</Label>
              <View style={styles.swatchRow}>
                {Object.entries(PALETTES).map(([id, p]) => {
                  const selected = id === palette;
                  return (
                    <Pressable
                      key={id}
                      onPress={touch(() => setPalette(id))}
                      style={[
                        styles.swatchOuter,
                        { borderColor: selected ? colors.foreground : 'transparent' },
                      ]}
                    >
                      <View style={[styles.swatch, { backgroundColor: p.swatch }]} />
                    </Pressable>
                  );
                })}
              </View>
            </Card>
          </View>

          {/* ─── 오른쪽: 트랜지션 ─── */}
          <View style={styles.col}>
            <Card>
              <CardTitle description="슬라이드가 바뀔 때의 화면 전환">전환 효과</CardTitle>

              <Segmented options={MODE_OPTIONS} value={mode} onChange={touch(onTransitionModeChange)} />

              {mode === TRANSITION_MODES.SINGLE && (
                <>
                  <Label style={{ marginTop: 16 }}>효과</Label>
                  <View style={styles.chipRow}>
                    {TRANSITION_EFFECTS.map((e) => (
                      <Chip
                        key={e.id}
                        label={e.label}
                        selected={singleEffect === e.id}
                        onPress={touch(() => onSingleEffectChange?.(e.id))}
                      />
                    ))}
                  </View>
                </>
              )}

              {mode === TRANSITION_MODES.MULTI && (
                <>
                  <Label style={{ marginTop: 16 }}>랜덤에 포함할 효과</Label>
                  <View style={styles.chipRow}>
                    {TRANSITION_EFFECTS.map((e) => (
                      <Chip
                        key={e.id}
                        label={e.label}
                        selected={multiEffects?.includes(e.id)}
                        onPress={touch(() => onMultiEffectToggle?.(e.id))}
                      />
                    ))}
                  </View>
                </>
              )}

              {mode !== TRANSITION_MODES.NONE && (
                <>
                  <Label style={{ marginTop: 16 }}>전환 속도</Label>
                  <View style={styles.chipRow}>
                    {DURATION_PRESETS.map((d) => (
                      <Chip
                        key={d}
                        label={`${d}s`}
                        selected={duration === d}
                        onPress={touch(() => onTransitionDurationChange?.(d))}
                      />
                    ))}
                  </View>
                </>
              )}
            </Card>

            <Card style={{ marginTop: 16 }}>
              <CardTitle>사용 방법</CardTitle>
              <Text style={[styles.help, { color: colors.mutedForeground }]}>
                화면 가운데를 탭하면 이 설정이 열립니다.{'\n'}
                왼쪽/오른쪽 가장자리를 탭하거나 스와이프하면 이전/다음 슬라이드로 이동합니다.{'\n'}
                설정은 10초간 조작이 없으면 자동으로 닫힙니다.
              </Text>
            </Card>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  panel: {
    width: '88%',
    maxWidth: 1000,
    maxHeight: '92%',
    borderRadius: RADIUS.xl + 4,
    borderWidth: 1,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 24, fontWeight: '700', letterSpacing: -0.4 },
  columns: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  col: { flex: 1 },
  albumRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  albumName: { flex: 1, fontSize: 16, fontWeight: '600' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  slider: { width: '100%', height: 40, marginTop: 4 },
  hint: { fontSize: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  swatchRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  swatchOuter: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatch: { width: 28, height: 28, borderRadius: 14 },
  help: { fontSize: 13, lineHeight: 20 },
});
