"""일러스트 한 장에서 데모용 애니메이션 샘플(GIF, 애니메이션 WebP, MP4)을 만든다.

사용법: python tools/make_demo_animations.py <원본 이미지> <출력 폴더> <이름>
  -> <이름>.gif, <이름>.webp, <이름>.mp4

모션: 천천히 확대/이동(Ken Burns) + 대각선으로 지나가는 빛줄기. 앞뒤로 부드럽게 이어져 루프된다.
MP4 인코딩에는 ffmpeg(imageio-ffmpeg 패키지에 포함)를 사용한다.
"""
import math
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


def frame_at(src, t, size):
    """t: 0..1 (왕복 루프 위상). 확대/이동 + 빛줄기를 적용한 한 프레임."""
    w, h = size
    ease = 0.5 - 0.5 * math.cos(2 * math.pi * t)  # 0→1→0 부드러운 왕복
    zoom = 1.0 + 0.10 * ease
    cw, ch = src.width / zoom, src.height / zoom
    cx = src.width / 2 + (ease - 0.5) * src.width * 0.04
    cy = src.height / 2
    box = (cx - cw / 2, cy - ch / 2, cx + cw / 2, cy + ch / 2)
    im = src.crop(tuple(int(v) for v in box)).resize((w, h), Image.LANCZOS).convert('RGBA')

    # 빛줄기: 왼쪽 위 → 오른쪽 아래로 이동 (한 주기에 한 번)
    sweep = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(sweep)
    pos = -0.3 + 1.6 * t
    x0 = int(w * pos)
    d.polygon([(x0, 0), (x0 + int(w * 0.12), 0), (x0 - int(w * 0.10), h), (x0 - int(w * 0.22), h)], fill=(255, 255, 255, 70))
    sweep = sweep.filter(ImageFilter.GaussianBlur(w * 0.02))
    im.alpha_composite(sweep)
    return im.convert('RGB')


def main(src_path, outdir, name):
    out = Path(outdir)
    out.mkdir(parents=True, exist_ok=True)
    src = Image.open(src_path).convert('RGB')

    # GIF/WebP: 가볍게 (960x540, 36프레임 ≈ 3초 @12fps)
    n = 36
    small = (960, 540)
    frames = [frame_at(src, i / n, small) for i in range(n)]
    pal = [f.quantize(colors=128, method=Image.MEDIANCUT, dither=Image.NONE) for f in frames]
    pal[0].save(out / f'{name}.gif', save_all=True, append_images=pal[1:], duration=83, loop=0, optimize=True, disposal=2)
    frames[0].save(out / f'{name}.webp', save_all=True, append_images=frames[1:], duration=83, loop=0, quality=80, method=4)

    # MP4: 1280x720, 24fps, 약 6초 (2주기)
    import imageio_ffmpeg
    ff = imageio_ffmpeg.get_ffmpeg_exe()
    with tempfile.TemporaryDirectory() as td:
        total = 144
        for i in range(total):
            frame_at(src, (i % 72) / 72, (1280, 720)).save(Path(td) / f'{i:04d}.png')
        subprocess.run(
            [ff, '-y', '-loglevel', 'error', '-framerate', '24', '-i', str(Path(td) / '%04d.png'),
             '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '23', str(out / f'{name}.mp4')],
            check=True,
        )
    for ext in ('gif', 'webp', 'mp4'):
        print(ext, round((out / f'{name}.{ext}').stat().st_size / 1024), 'KB')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], sys.argv[3])
