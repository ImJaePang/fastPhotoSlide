import * as MediaLibrary from 'expo-media-library';

/**
 * 미디어 접근 권한 요청
 * @returns {Promise<boolean>} 권한 허용 여부
 */
export async function requestPermission() {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * 기기의 앨범/폴더 목록 반환
 * @returns {Promise<MediaLibrary.Album[]>}
 */
export async function getAlbums() {
  const albums = await MediaLibrary.getAlbumsAsync({ includeSmartAlbums: false });
  return albums;
}

const SUPPORTED_EXTENSIONS = [
  'jpg', 'jpeg', 'png', 'webp', 'bmp', 'gif',
  'mp4', 'webm', 'mov', '3gp',
];

/**
 * 특정 앨범에서 지원되는 미디어 파일 목록 반환
 * @param {MediaLibrary.Album} album
 * @returns {Promise<Array<{id, uri, mediaType, width, height, duration, filename}>>}
 */
export async function getAssetsFromAlbum(album) {
  const allAssets = [];
  let after = undefined;
  let hasNextPage = true;

  while (hasNextPage) {
    const page = await MediaLibrary.getAssetsAsync({
      album: album.id,
      mediaType: [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
      first: 200,
      after,
    });
    for (const asset of page.assets) {
      const ext = asset.filename.split('.').pop()?.toLowerCase();
      if (SUPPORTED_EXTENSIONS.includes(ext)) {
        allAssets.push({
          id: asset.id,
          uri: asset.uri,
          mediaType: asset.mediaType, // 'photo' | 'video'
          width: asset.width,
          height: asset.height,
          duration: asset.duration,
          filename: asset.filename,
        });
      }
    }
    hasNextPage = page.hasNextPage;
    after = page.endCursor;
  }

  return allAssets;
}
