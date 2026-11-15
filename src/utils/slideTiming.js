/**
 * 슬라이드별 표시 시간 / 세로 사진 스크롤 계획.
 *
 * 세로로 긴 사진은 화면 폭에 맞춰 확대되어 화면보다 길어지므로 위→아래로 천천히 스크롤한다.
 * 스크롤 속도를 사람이 편하게 볼 수 있는 값으로 고정하고(SCROLL_SPEED),
 * 슬라이드 간격이 그보다 짧으면 (긴 동영상처럼) 표시 시간을 늘려 끝까지 보여 준다.
 * 애니메이션(SlideViewer)과 타이머(useSlideshow)가 같은 계산을 쓰도록 이 파일에 모았다.
 */

const SCROLL_SPEED = 100; // dp/초 — 읽기 편한 스크롤 속도
const SCROLL_HEAD_SEC = 1.0; // 스크롤 시작 전 정지
const SCROLL_TAIL_SEC = 2.0; // 끝에서 머무는 시간
const MAX_DISPLAY_SEC = 60; // 아무리 길어도 이 시간을 넘기지 않음 (넘으면 스크롤이 조금 빨라짐)

const ANIMATED_EXT = ['gif', 'webp'];

function extOf(filename = '') {
  return filename.split('.').pop()?.toLowerCase() ?? '';
}

/** 스크롤이 필요한 세로 사진이면 스크롤 거리(dp), 아니면 0 */
export function scrollDistanceFor(asset, screenW, screenH) {
  if (!asset || asset.mediaType === 'video') return 0;
  if (ANIMATED_EXT.includes(extOf(asset.filename))) return 0;
  if (!(asset.height > asset.width) || !asset.width) return 0;
  const displayHeight = screenW * (asset.height / asset.width);
  return Math.max(0, displayHeight - screenH);
}

/** 이 슬라이드를 보여 줄 시간(초) */
export function displayTimeSec(asset, baseSec, screenW, screenH) {
  const dist = scrollDistanceFor(asset, screenW, screenH);
  if (dist <= 0) return baseSec;
  const needed = SCROLL_HEAD_SEC + dist / SCROLL_SPEED + SCROLL_TAIL_SEC;
  return Math.min(Math.max(baseSec, needed), MAX_DISPLAY_SEC);
}

/** 스크롤 애니메이션 계획: 시작 지연과 이동 시간(ms) */
export function scrollPlan(distance, displaySec) {
  const durationSec = Math.max(2, displaySec - SCROLL_HEAD_SEC - SCROLL_TAIL_SEC);
  return { delayMs: SCROLL_HEAD_SEC * 1000, durationMs: durationSec * 1000 };
}
