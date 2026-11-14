import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { getAlbums, getAssetsFromAlbum } from '../modules/fileSource';
import { useTheme } from '../theme/ThemeProvider';
import { RADIUS } from '../theme/themes';
import { Button } from './ui';

export default function AlbumPickerModal({ visible, onClose, onAlbumSelected, currentAlbumId }) {
  const { colors } = useTheme();
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    setError(null);
    getAlbums()
      .then((a) => setAlbums([...a].sort((x, y) => (y.assetCount || 0) - (x.assetCount || 0))))
      .catch((e) => setError(String(e?.message || e)))
      .finally(() => setLoading(false));
  }, [visible]);

  const handleSelect = async (album) => {
    setLoading(true);
    try {
      const assets = await getAssetsFromAlbum(album);
      onAlbumSelected(assets, album.title, album.id);
      onClose();
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={[styles.backdrop, { backgroundColor: colors.scrim }]}>
        <View style={[styles.dialog, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.foreground }]}>앨범 선택</Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 2, marginBottom: 16 }}>
            슬라이드쇼로 재생할 앨범을 고르세요
          </Text>

          {loading ? (
            <ActivityIndicator color={colors.primary} size="large" style={{ marginVertical: 48 }} />
          ) : error ? (
            <Text style={{ color: colors.destructive, marginVertical: 24 }}>{error}</Text>
          ) : (
            <FlatList
              data={albums}
              keyExtractor={(item) => item.id}
              style={{ flexGrow: 0 }}
              ListEmptyComponent={
                <Text style={{ color: colors.mutedForeground, textAlign: 'center', paddingVertical: 32 }}>
                  앨범이 없습니다
                </Text>
              }
              renderItem={({ item }) => {
                const selected = item.id === currentAlbumId;
                return (
                  <Pressable
                    onPress={() => handleSelect(item)}
                    android_ripple={{ color: colors.accent }}
                    style={({ pressed }) => [
                      styles.item,
                      { backgroundColor: selected || pressed ? colors.accent : 'transparent' },
                    ]}
                  >
                    <Text style={[styles.itemTitle, { color: colors.foreground }]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
                      <Text style={{ color: colors.secondaryForeground, fontSize: 12, fontWeight: '600' }}>
                        {item.assetCount}
                      </Text>
                    </View>
                  </Pressable>
                );
              }}
            />
          )}

          <Button title="취소" variant="outline" onPress={onClose} style={{ marginTop: 16 }} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  dialog: {
    width: '48%',
    minWidth: 360,
    maxHeight: '82%',
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    padding: 24,
  },
  title: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
  },
  itemTitle: { flex: 1, fontSize: 16, fontWeight: '500', marginRight: 12 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
});
