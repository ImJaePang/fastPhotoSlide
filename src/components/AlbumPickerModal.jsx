import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { getAlbums, getAssetsFromAlbum } from '../modules/fileSource';

export default function AlbumPickerModal({ visible, onClose, onAlbumSelected }) {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (!visible) return;
    setLoading(true);
    getAlbums()
      .then((a) => setAlbums(a))
      .finally(() => setLoading(false));
  }, [visible]);

  const handleSelect = async (album) => {
    setLoading(true);
    try {
      const assets = await getAssetsFromAlbum(album);
      onAlbumSelected(assets, album.title);
    } finally {
      setLoading(false);
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modal}>
          <Text style={styles.title}>📂 앨범 선택</Text>
          {loading ? (
            <ActivityIndicator color="#fff" size="large" style={{ marginVertical: 32 }} />
          ) : (
            <FlatList
              data={albums}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.albumItem} onPress={() => handleSelect(item)}>
                  <Text style={styles.albumTitle}>{item.title}</Text>
                  <Text style={styles.albumCount}>{item.assetCount}장</Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>닫기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '55%',
    maxHeight: '70%',
    backgroundColor: 'rgba(30,30,40,0.97)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  albumItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  albumTitle: { color: '#eee', fontSize: 16 },
  albumCount: { color: '#aaa', fontSize: 14 },
  separator: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  closeBtn: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  closeBtnText: { color: '#fff', fontSize: 15 },
});
