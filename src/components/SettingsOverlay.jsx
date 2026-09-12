import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Slider from '@react-native-community/slider';
import {
  TRANSITION_MODES,
  TRANSITION_EFFECTS,
  DURATION_PRESETS,
} from '../utils/transitionConfig';

// ─── 라디오 버튼 컴포넌트 ───
function RadioButton({ selected, label, onPress }) {
  return (
    <TouchableOpacity style={styles.radioRow} onPress={onPress}>
      <View style={[styles.radioOuter, selected && styles.radioOuterActive]}>
        {selected && <View style={styles.radioInner} />}
      </View>
      <Text style={styles.radioLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── 체크박스 컴포넌트 ───
function CheckBox({ checked, label, onPress }) {
  return (
    <TouchableOpacity style={styles.radioRow} onPress={onPress}>
      <View style={[styles.checkOuter, checked && styles.checkOuterActive]}>
        {checked && <Text style={styles.checkMark}>✓</Text>}
      </View>
      <Text style={styles.radioLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function SettingsOverlay({
  visible,
  isPlaying,
  transitionTime,
  currentAlbumTitle,
  transitionSettings,
  onTogglePlay,
  onOpenAlbumPicker,
  onTransitionTimeChange,
  onClose,
  onTransitionModeChange,
  onSingleEffectChange,
  onMultiEffectToggle,
  onTransitionDurationChange,
}) {
  if (!visible) return null;

  const { mode, singleEffect, multiEffects, duration } = transitionSettings || {};

  return (
    <View style={styles.overlay}>
      <View style={styles.panel}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* 헤더 */}
          <View style={styles.header}>
            <Text style={styles.title}>🖼 디지털 액자 설정</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* 앨범 */}
          <View style={styles.section}>
            <Text style={styles.label}>현재 앨범</Text>
            <Text style={styles.value}>{currentAlbumTitle || '(없음)'}</Text>
            <TouchableOpacity style={styles.btn} onPress={onOpenAlbumPicker}>
              <Text style={styles.btnText}>📂 앨범 선택</Text>
            </TouchableOpacity>
          </View>

          {/* 슬라이드 전환 시간 */}
          <View style={styles.section}>
            <Text style={styles.label}>슬라이드 전환 시간: <Text style={styles.value}>{transitionTime}초</Text></Text>
            <Slider
              style={styles.slider}
              minimumValue={3}
              maximumValue={60}
              step={1}
              value={transitionTime}
              onValueChange={onTransitionTimeChange}
              minimumTrackTintColor="#6c9bff"
              maximumTrackTintColor="rgba(255,255,255,0.2)"
              thumbTintColor="#6c9bff"
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>3초</Text>
              <Text style={styles.sliderLabel}>60초</Text>
            </View>
          </View>

          {/* ─── 트랜지션 효과 섹션 ─── */}
          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎬 트랜지션 효과</Text>

            {/* 모드 선택 */}
            <Text style={styles.subLabel}>모드</Text>
            <View style={styles.modeGroup}>
              <RadioButton
                selected={mode === TRANSITION_MODES.NONE}
                label="효과 없음"
                onPress={() => onTransitionModeChange?.(TRANSITION_MODES.NONE)}
              />
              <RadioButton
                selected={mode === TRANSITION_MODES.SINGLE}
                label="단일 선택"
                onPress={() => onTransitionModeChange?.(TRANSITION_MODES.SINGLE)}
              />
              <RadioButton
                selected={mode === TRANSITION_MODES.MULTI}
                label="랜덤 선택"
                onPress={() => onTransitionModeChange?.(TRANSITION_MODES.MULTI)}
              />
            </View>

            {/* 단일 모드: 라디오 효과 선택 */}
            {mode === TRANSITION_MODES.SINGLE && (
              <View style={styles.effectGroup}>
                <Text style={styles.subLabel}>효과 선택</Text>
                {TRANSITION_EFFECTS.map((e) => (
                  <RadioButton
                    key={e.id}
                    selected={singleEffect === e.id}
                    label={`${e.emoji} ${e.label}`}
                    onPress={() => onSingleEffectChange?.(e.id)}
                  />
                ))}
              </View>
            )}

            {/* 다중 모드: 체크박스 효과 선택 */}
            {mode === TRANSITION_MODES.MULTI && (
              <View style={styles.effectGroup}>
                <Text style={styles.subLabel}>효과 선택 (복수 선택)</Text>
                {TRANSITION_EFFECTS.map((e) => (
                  <CheckBox
                    key={e.id}
                    checked={multiEffects?.includes(e.id)}
                    label={`${e.emoji} ${e.label}`}
                    onPress={() => onMultiEffectToggle?.(e.id)}
                  />
                ))}
              </View>
            )}

            {/* 전환 시간 (효과 있을 때만) */}
            {mode !== TRANSITION_MODES.NONE && (
              <View style={styles.durationGroup}>
                <Text style={styles.subLabel}>전환 속도: {duration}초</Text>
                <View style={styles.durationPresets}>
                  {DURATION_PRESETS.map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[
                        styles.presetBtn,
                        duration === d && styles.presetBtnActive,
                      ]}
                      onPress={() => onTransitionDurationChange?.(d)}
                    >
                      <Text style={[
                        styles.presetBtnText,
                        duration === d && styles.presetBtnTextActive,
                      ]}>
                        {d}s
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* 재생 제어 */}
          <TouchableOpacity
            style={[styles.btn, styles.playBtn]}
            onPress={onTogglePlay}
          >
            <Text style={styles.btnText}>{isPlaying ? '⏸ 일시정지' : '▶ 재생'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  panel: {
    width: '55%',
    maxHeight: '85%',
    backgroundColor: 'rgba(15,15,25,0.95)',
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: { color: '#fff', fontSize: 20, fontWeight: '700' },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: { color: '#fff', fontSize: 16 },
  section: { marginBottom: 20 },
  label: { color: '#aaa', fontSize: 14, marginBottom: 6 },
  value: { color: '#fff', fontSize: 15, fontWeight: '600' },
  btn: {
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: 'rgba(108,155,255,0.2)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(108,155,255,0.4)',
  },
  playBtn: {
    marginTop: 4,
    backgroundColor: 'rgba(100,220,150,0.15)',
    borderColor: 'rgba(100,220,150,0.4)',
  },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  slider: { width: '100%', marginTop: 8 },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sliderLabel: { color: '#666', fontSize: 12 },

  // ─── 트랜지션 섹션 스타일 ───
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 14,
  },
  subLabel: {
    color: '#999',
    fontSize: 13,
    marginBottom: 8,
    marginTop: 4,
  },
  modeGroup: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  effectGroup: {
    marginTop: 8,
    paddingLeft: 4,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  radioOuterActive: {
    borderColor: '#6c9bff',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#6c9bff',
  },
  radioLabel: {
    color: '#ddd',
    fontSize: 14,
  },
  checkOuter: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkOuterActive: {
    borderColor: '#6c9bff',
    backgroundColor: 'rgba(108,155,255,0.3)',
  },
  checkMark: {
    color: '#6c9bff',
    fontSize: 12,
    fontWeight: '700',
  },
  durationGroup: {
    marginTop: 12,
  },
  durationPresets: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  presetBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  presetBtnActive: {
    backgroundColor: 'rgba(108,155,255,0.25)',
    borderColor: '#6c9bff',
  },
  presetBtnText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  presetBtnTextActive: {
    color: '#6c9bff',
  },
});
