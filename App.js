import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, StatusBar, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useKeepAwake } from 'expo-keep-awake';
import { Image as ExpoImage } from 'expo-image';
import { useSlideshow } from './src/hooks/useSlideshow';
import { useTransitionSettings } from './src/hooks/useTransitionSettings';
import { usePreferences } from './src/hooks/usePreferences';
import TransitionSlideViewer from './src/components/TransitionSlideViewer';
import SettingsOverlay from './src/components/SettingsOverlay';
import AlbumPickerModal from './src/components/AlbumPickerModal';
import ManualModal from './src/components/ManualModal';
import NavigationOverlay from './src/components/NavigationOverlay';
import { Button } from './src/components/ui';
import { ThemeProvider, useTheme } from './src/theme/ThemeProvider';
import { requestPermission, getAlbums, getAssetsFromAlbum } from './src/modules/fileSource';

const SETTINGS_AUTO_HIDE_MS = 10000; // 10초 후 설정 패널 자동 숨김
const ERROR_RESTART_MS = 3000; // 오류 발생 시 자동 복구까지 대기 시간

/**
 * 렌더링 오류가 나도 앱이 멈춰 있지 않도록 잠시 후 자동으로 다시 시작합니다.
 * (디지털 액자 앱은 사람이 곁에 없는 경우가 많기 때문)
 */
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null, attempt: 0 };
  retryTimer = null;

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    clearTimeout(this.retryTimer);
    this.retryTimer = setTimeout(() => {
      this.setState((s) => ({ hasError: false, error: null, attempt: s.attempt + 1 }));
    }, ERROR_RESTART_MS);
  }

  componentWillUnmount() {
    clearTimeout(this.retryTimer);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>오류가 발생했습니다. 잠시 후 자동으로 다시 시작합니다…</Text>
          <Text style={styles.errorBody}>{this.state.error?.toString()}</Text>
        </View>
      );
    }
    return <React.Fragment key={this.state.attempt}>{this.props.children}</React.Fragment>;
  }
}

function App() {
  useKeepAwake();
  const { colors } = useTheme();

  const { prefs, loaded: prefsLoaded, update: updatePrefs } = usePreferences();
  const transitionTime = prefs.transitionTime;

  const [assets, setAssets] = useState([]);
  const [albumTitle, setAlbumTitle] = useState('');
  const [albumId, setAlbumId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showAlbumPicker, setShowAlbumPicker] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [booting, setBooting] = useState(true);
  const hideSettingsTimer = useRef(null);

  const { currentAsset, next, prev, isPlaying, pause, resume } = useSlideshow(assets, transitionTime);

  const {
    settings: transitionSettings,
    setMode,
    setSingleEffect,
    toggleMultiEffect,
    setDuration,
  } = useTransitionSettings();

  // 앱 시작 시 이미지 캐시 정리
  useEffect(() => {
    ExpoImage.clearDiskCache().catch(() => { });
    ExpoImage.clearMemoryCache().catch(() => { });
  }, []);

  const applyAlbum = useCallback((newAssets, title, id) => {
    setAssets(newAssets);
    setAlbumTitle(title);
    setAlbumId(id);
    setShowSettings(false);
    updatePrefs({ lastAlbumId: id, lastAlbumTitle: title });
  }, [updatePrefs]);

  // 권한 요청 → 마지막으로 보던 앨범 자동 재생 (없으면 앨범 선택 창)
  useEffect(() => {
    if (!prefsLoaded) return;
    let cancelled = false;
    (async () => {
      const granted = await requestPermission();
      if (cancelled) return;
      setHasPermission(granted);
      if (!granted) { setBooting(false); return; }

      if (prefs.lastAlbumId) {
        try {
          const albums = await getAlbums();
          const last = albums.find((a) => a.id === prefs.lastAlbumId);
          if (last) {
            const items = await getAssetsFromAlbum(last);
            if (!cancelled && items.length > 0) {
              setAssets(items);
              setAlbumTitle(last.title);
              setAlbumId(last.id);
              setBooting(false);
              return;
            }
          }
        } catch (e) {
          console.warn('[App] 마지막 앨범 복원 실패:', e);
        }
      }
      if (!cancelled) {
        setShowAlbumPicker(true);
        setBooting(false);
      }
    })();
    return () => { cancelled = true; };
  }, [prefsLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 설정 패널 자동 숨김 ──
  const scheduleHideSettings = useCallback(() => {
    clearTimeout(hideSettingsTimer.current);
    hideSettingsTimer.current = setTimeout(() => setShowSettings(false), SETTINGS_AUTO_HIDE_MS);
  }, []);

  useEffect(() => () => clearTimeout(hideSettingsTimer.current), []);

  const openSettings = useCallback(() => {
    setShowSettings(true);
    scheduleHideSettings();
  }, [scheduleHideSettings]);

  const handleCenterTap = useCallback(() => {
    if (!showSettings) openSettings();
  }, [showSettings, openSettings]);

  const handleCloseSettings = useCallback(() => {
    clearTimeout(hideSettingsTimer.current);
    setShowSettings(false);
  }, []);

  const handleOpenAlbumPicker = useCallback(() => {
    handleCloseSettings();
    setShowAlbumPicker(true);
  }, [handleCloseSettings]);

  const handleOpenManual = useCallback(() => {
    handleCloseSettings();
    setShowManual(true);
  }, [handleCloseSettings]);

  const handleTogglePlay = useCallback(() => (isPlaying ? pause() : resume()), [isPlaying, pause, resume]);
  const handlePrev = useCallback(() => { if (!showSettings) prev(); }, [prev, showSettings]);
  const handleNext = useCallback(() => { if (!showSettings) next(); }, [next, showSettings]);

  const settingsOverlay = (
    <SettingsOverlay
      visible={showSettings}
      isPlaying={isPlaying}
      hasSlides={assets.length > 0}
      transitionTime={transitionTime}
      currentAlbumTitle={albumTitle}
      transitionSettings={transitionSettings}
      onTogglePlay={handleTogglePlay}
      onOpenAlbumPicker={handleOpenAlbumPicker}
      onOpenManual={handleOpenManual}
      onTransitionTimeChange={(v) => updatePrefs({ transitionTime: v })}
      onClose={handleCloseSettings}
      onInteraction={scheduleHideSettings}
      onTransitionModeChange={setMode}
      onSingleEffectChange={setSingleEffect}
      onMultiEffectToggle={toggleMultiEffect}
      onTransitionDurationChange={setDuration}
    />
  );

  const albumModal = (
    <AlbumPickerModal
      visible={showAlbumPicker}
      currentAlbumId={albumId}
      onClose={() => setShowAlbumPicker(false)}
      onAlbumSelected={applyAlbum}
    />
  );

  const manualModal = <ManualModal visible={showManual} onClose={() => setShowManual(false)} />;

  // ── 권한 거부 화면 ──
  if (hasPermission === false) {
    return (
      <GestureHandlerRootView style={[styles.center, { backgroundColor: colors.background }]}>
        <StatusBar hidden />
        <Text style={[styles.heading, { color: colors.foreground }]}>미디어 접근 권한이 필요합니다</Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>
          기기 설정에서 사진 및 동영상 권한을 허용한 뒤 앱을 다시 실행해 주세요.
        </Text>
      </GestureHandlerRootView>
    );
  }

  // ── 앨범이 아직 없는 초기 화면 ──
  if (assets.length === 0) {
    return (
      <GestureHandlerRootView style={[styles.center, { backgroundColor: colors.background }]}>
        <StatusBar hidden />
        {!booting && (
          <View style={styles.emptyWrap}>
            <Text style={[styles.heading, { color: colors.foreground }]}>AlbumLoop</Text>
            <Text style={[styles.body, { color: colors.mutedForeground }]}>
              앨범을 고르면 사진과 영상이 끝없이 이어집니다.
            </Text>
            <View style={styles.emptyButtons}>
              <Button title="앨범 선택" size="lg" onPress={() => setShowAlbumPicker(true)} />
              <Button title="설정" size="lg" variant="outline" onPress={openSettings} />
              <Button title="설명서" size="lg" variant="ghost" onPress={() => setShowManual(true)} />
            </View>
          </View>
        )}
        {settingsOverlay}
        {albumModal}
        {manualModal}
      </GestureHandlerRootView>
    );
  }

  // ── 슬라이드쇼 화면 ──
  return (
    <GestureHandlerRootView style={styles.container}>
      <NavigationOverlay onPrev={handlePrev} onNext={handleNext} onCenterTap={handleCenterTap}>
        <View style={styles.container}>
          <StatusBar hidden />
          <TransitionSlideViewer
            asset={currentAsset}
            transitionTime={transitionTime}
            transitionSettings={transitionSettings}
            onNext={next}
          />
          {settingsOverlay}
          {albumModal}
          {manualModal}
        </View>
      </NavigationOverlay>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyWrap: { alignItems: 'center', gap: 12 },
  emptyButtons: { flexDirection: 'row', gap: 12, marginTop: 20 },
  heading: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5, textAlign: 'center' },
  body: { fontSize: 16, lineHeight: 24, textAlign: 'center' },
  errorBox: { flex: 1, backgroundColor: '#09090b', justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorTitle: { color: '#f87171', fontSize: 18, fontWeight: '600', marginBottom: 12 },
  errorBody: { color: '#a1a1aa', fontSize: 13, fontFamily: 'monospace', textAlign: 'center' },
});

export default function AppWrapper() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  );
}
