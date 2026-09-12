/**
 * 트랜지션 효과 설정 상수 및 유틸리티
 */

// ─── 트랜지션 모드 ───
export const TRANSITION_MODES = {
    NONE: 'none',     // 효과 없음 (기본)
    SINGLE: 'single', // 단일 선택
    MULTI: 'multi',   // 다중 선택 랜덤
};

// ─── 트랜지션 효과 목록 ───
export const TRANSITION_EFFECTS = [
    { id: 'fade', label: 'Fade', emoji: '🌫' },
    { id: 'slide', label: 'Slide', emoji: '➡️' },
    { id: 'zoom', label: 'Zoom', emoji: '🔍' },
    { id: 'blur', label: 'Blur', emoji: '💫' },
];

// ─── 전환 시간 프리셋 (초) ───
export const DURATION_PRESETS = [0.8, 1.0, 1.5, 2.0, 3.0];

// ─── 기본 설정 ───
export const DEFAULT_TRANSITION_SETTINGS = {
    mode: TRANSITION_MODES.NONE,
    singleEffect: 'fade',        // 단일 모드 시 선택된 효과
    multiEffects: ['fade'],      // 다중 모드 시 선택된 효과들
    duration: 1.5,               // 전환 시간 (초)
};

// ─── AsyncStorage 키 ───
export const STORAGE_KEY = '@photoviewer_transition_settings';

/**
 * 다중 선택 랜덤 모드에서 선택된 효과 중 하나를 반환
 * @param {string[]} selectedEffects
 * @returns {string}
 */
export function pickRandomEffect(selectedEffects) {
    if (!selectedEffects || selectedEffects.length === 0) return 'fade';
    const idx = Math.floor(Math.random() * selectedEffects.length);
    return selectedEffects[idx];
}

/**
 * 현재 설정에 따라 적용할 트랜지션 효과를 결정
 * @param {object} settings
 * @returns {string|null} 효과 ID 또는 null (없음 모드)
 */
export function resolveTransitionEffect(settings) {
    switch (settings.mode) {
        case TRANSITION_MODES.NONE:
            return null;
        case TRANSITION_MODES.SINGLE:
            return settings.singleEffect || 'fade';
        case TRANSITION_MODES.MULTI:
            return pickRandomEffect(settings.multiEffects);
        default:
            return null;
    }
}
