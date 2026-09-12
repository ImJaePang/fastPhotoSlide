import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Text,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useKeepAwake } from 'expo-keep-awake';
import { Image as ExpoImage } from 'expo-image';
import { useSlideshow } from './src/hooks/useSlideshow';
import { useTransitionSettings } from './src/hooks/useTransitionSettings';
import TransitionSlideViewer from './src/components/TransitionSlideViewer';
import SettingsOverlay from './src/components/SettingsOverlay';
import AlbumPickerModal from './src/components/AlbumPickerModal';
import NavigationOverlay from './src/components/NavigationOverlay';
import { requestPermission } from './src/modules/fileSource';

const DEFAULT_TRANSITION_TIME = 10; // 초
const SETTINGS_AUTO_HIDE_MS = 5000; // 5초 후 설정 패널 자동 숨김

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ color: '#ff5555', fontSize: 20, fontWeight: 'bold', marginBottom: 12 }}>
            앱 실행 중 오류가 발생했습니다
          </Text>
          <Text style={{ color: '#eee', fontSize: 14, fontFamily: 'monospace', textAlign: 'center' }}>
            {this.state.error?.toString()}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

function App() {
  // ── 화면 꺼짐 방지 ──
  useKeepAwake();

  const [assets, setAssets] = useState([]);
  const [transitionTime, setTransitionTime] = useState(DEFAULT_TRANSITION_TIME);
  const [albumTitle, setAlbumTitle] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showAlbumPicker, setShowAlbumPicker] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const hideSettingsTimer = useRef(null);

  const { currentAsset, nextAsset, next, prev, isPlaying, pause, resume } = useSlideshow(
    assets,
    transitionTime
  );

  const {
    settings: transitionSettings,
    loaded: settingsLoaded,
    setMode,
    setSingleEffect,
    toggleMultiEffect,
    setDuration,
  } = useTransitionSettings();

  // 앱 시작 시 디스크 캐시 초기화 + 권한 요청
  useEffect(() => {
    // 저장 공간 확보를 위해 이전 디스크 캐시 삭제
    ExpoImage.clearDiskCache().catch(() => { });
    ExpoImage.clearMemoryCache().catch(() => { });
    console.log('[App] 디스크/메모리 캐시 초기화 완료');

    requestPermission().then((granted) => {
      setHasPermission(granted);
      if (granted) setShowAlbumPicker(true);
    });
  }, []);

  // 설정 패널 자동 숨김
  const scheduleHideSettings = useCallback(() => {
    if (hideSettingsTimer.current) clearTimeout(hideSettingsTimer.current);
    hideSettingsTimer.current = setTimeout(() => setShowSettings(false), SETTINGS_AUTO_HIDE_MS);
  }, []);

  const handleCenterTap = useCallback(() => {
    if (!showSettings) {
      setShowSettings(true);
      scheduleHideSettings();
    }
  }, [showSettings, scheduleHideSettings]);

  const handleCloseSettings = useCallback(() => {
    if (hideSettingsTimer.current) clearTimeout(hideSettingsTimer.current);
    setShowSettings(false);
  }, []);

  const handleAlbumSelected = useCallback((newAssets, title) => {
    setAssets(newAssets);
    setAlbumTitle(title);
    setShowSettings(false);
  }, []);

  const handleTogglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  }, [isPlaying, pause, resume]);

  const handlePrev = useCallback(() => {
    if (showSettings) return; // 설정 열려있으면 무시
    prev();
  }, [prev, showSettings]);

  const handleNext = useCallback(() => {
    if (showSettings) return;
    next();
  }, [next, showSettings]);

  // ── 권한 거부 화면 ──
  if (hasPermission === false) {
    return (
      <GestureHandlerRootView style={styles.container}>
        <StatusBar hidden />
        <Text style={styles.permissionText}>
          미디어 접근 권한이 필요합니다.{'\n'}
          설정에서 권한을 허용해 주세요.
        </Text>
      </GestureHandlerRootView>
    );
  }

  // ── 앨범 선택 전 초기 화면 ──
  if (assets.length === 0 && !showAlbumPicker) {
    return (
      <GestureHandlerRootView style={styles.container}>
        <NavigationOverlay
          onPrev={handlePrev}
          onNext={handleNext}
          onCenterTap={handleCenterTap}
        >
          <View style={styles.container}>
            <StatusBar hidden />
            <Text style={styles.emptyText}>화면을 탭하여 앨범을 선택하세요</Text>
            <SettingsOverlay
              visible={showSettings}
              isPlaying={isPlaying}
              transitionTime={transitionTime}
              currentAlbumTitle={albumTitle}
              transitionSettings={transitionSettings}
              onTogglePlay={handleTogglePlay}
              onOpenAlbumPicker={() => {
                handleCloseSettings();
                setShowAlbumPicker(true);
              }}
              onTransitionTimeChange={setTransitionTime}
              onClose={handleCloseSettings}
              onTransitionModeChange={setMode}
              onSingleEffectChange={setSingleEffect}
              onMultiEffectToggle={toggleMultiEffect}
              onTransitionDurationChange={setDuration}
            />
            <AlbumPickerModal
              visible={showAlbumPicker}
              onClose={() => setShowAlbumPicker(false)}
              onAlbumSelected={handleAlbumSelected}
            />
          </View>
        </NavigationOverlay>
      </GestureHandlerRootView>
    );
  }

  // ── 메인 슬라이드쇼 화면 ──
  return (
    <GestureHandlerRootView style={styles.container}>
      <NavigationOverlay
        onPrev={handlePrev}
        onNext={handleNext}
        onCenterTap={handleCenterTap}
      >
        <View style={styles.container}>
          <StatusBar hidden />

          <TransitionSlideViewer
            asset={currentAsset}
            nextAsset={nextAsset}
            transitionTime={transitionTime}
            transitionSettings={transitionSettings}
            onNext={next}
          />

          <SettingsOverlay
            visible={showSettings}
            isPlaying={isPlaying}
            transitionTime={transitionTime}
            currentAlbumTitle={albumTitle}
            transitionSettings={transitionSettings}
            onTogglePlay={handleTogglePlay}
            onOpenAlbumPicker={() => {
              handleCloseSettings();
              setShowAlbumPicker(true);
            }}
            onTransitionTimeChange={setTransitionTime}
            onClose={handleCloseSettings}
            onTransitionModeChange={setMode}
            onSingleEffectChange={setSingleEffect}
            onMultiEffectToggle={toggleMultiEffect}
            onTransitionDurationChange={setDuration}
          />

          <AlbumPickerModal
            visible={showAlbumPicker}
            onClose={() => setShowAlbumPicker(false)}
            onAlbumSelected={handleAlbumSelected}
          />
        </View>
      </NavigationOverlay>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionText: {
    color: '#aaa',
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 30,
  },
  emptyText: {
    color: '#555',
    fontSize: 18,
    textAlign: 'center',
  },
});

export default function AppWrapper() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}

