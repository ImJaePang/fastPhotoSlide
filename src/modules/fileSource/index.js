/**
 * fileSource 모듈의 진입점.
 * 미래에 네트워크 소스(SMB/SFTP)로 교체할 때 이 파일만 수정하면 됩니다.
 *
 * 예시:
 *   import { requestPermission, getAlbums, getAssetsFromAlbum } from './networkFileSource';
 */
export {
    requestPermission,
    getAlbums,
    getAssetsFromAlbum,
} from './localMediaSource';
