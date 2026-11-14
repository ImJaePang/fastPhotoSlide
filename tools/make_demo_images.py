"""README 목업/GIF용 데모 이미지 생성기 (저작권/초상권 문제가 없는 절차적 풍경 이미지).

사용법: python tools/make_demo_images.py <출력 폴더>
  - landscape 8장 (2400x1500) + 세로로 긴 파노라마 1장 (1200x3600, 세로 스크롤 시연용)
"""
import math
import random
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def gradient(w, h, stops):
    """stops: [(pos 0..1, (r,g,b)), ...] 세로 그라디언트"""
    img = Image.new('RGB', (w, h))
    d = ImageDraw.Draw(img)
    for y in range(h):
        t = y / (h - 1)
        for (p0, c0), (p1, c1) in zip(stops, stops[1:]):
            if p0 <= t <= p1:
                d.line([(0, y), (w, y)], fill=lerp(c0, c1, (t - p0) / (p1 - p0 or 1)))
                break
    return img


def ridge(d, w, base_y, amp, color, seed, freq=3.0, h=None):
    rnd = random.Random(seed)
    ph = [rnd.uniform(0, 6.28) for _ in range(3)]
    pts = []
    for x in range(0, w + 8, 8):
        y = base_y
        for i, f in enumerate((freq, freq * 2.3, freq * 5.1)):
            y += math.sin(x / w * f * 3.14 + ph[i]) * amp / (i + 1)
        pts.append((x, y))
    pts += [(w, h or base_y + 2000), (0, h or base_y + 2000)]
    d.polygon(pts, fill=color)


def sun(img, cx, cy, r, color):
    glow = Image.new('RGBA', img.size, (0, 0, 0, 0))
    g = ImageDraw.Draw(glow)
    g.ellipse([cx - r * 3, cy - r * 3, cx + r * 3, cy + r * 3], fill=color + (70,))
    glow = glow.filter(ImageFilter.GaussianBlur(r))
    img.paste(glow, (0, 0), glow)
    d = ImageDraw.Draw(img)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=color)


def stars(d, w, h, n, seed):
    rnd = random.Random(seed)
    for _ in range(n):
        x, y, s = rnd.randint(0, w), rnd.randint(0, h), rnd.choice((2, 2, 3, 4))
        d.ellipse([x, y, x + s, y + s], fill=(255, 255, 255))


SCENES = {
    'sunrise': dict(sky=[(0, (255, 183, 120)), (0.55, (255, 120, 90)), (1, (88, 52, 120))], sun=(0.5, 0.55, 70, (255, 240, 200)),
                    ridges=[(0.62, 50, (120, 60, 110)), (0.72, 40, (80, 40, 90)), (0.84, 30, (40, 24, 56))]),
    'forest': dict(sky=[(0, (190, 225, 200)), (1, (245, 250, 235))], sun=(0.75, 0.25, 55, (255, 255, 235)),
                   ridges=[(0.55, 60, (110, 160, 130)), (0.68, 55, (60, 120, 90)), (0.82, 40, (24, 78, 58))]),
    'ocean': dict(sky=[(0, (110, 170, 240)), (0.6, (200, 230, 250)), (0.6, (60, 130, 190)), (1, (20, 60, 120))], sun=(0.3, 0.3, 60, (255, 255, 255)),
                  ridges=[]),
    'desert': dict(sky=[(0, (250, 200, 120)), (1, (255, 235, 190))], sun=(0.6, 0.3, 80, (255, 250, 230)),
                   ridges=[(0.6, 40, (225, 160, 90)), (0.74, 55, (200, 125, 70)), (0.88, 35, (150, 85, 50))]),
    'snow': dict(sky=[(0, (150, 180, 230)), (1, (235, 244, 255))], sun=(0.2, 0.3, 45, (255, 255, 255)),
                 ridges=[(0.5, 90, (200, 215, 240)), (0.68, 70, (235, 242, 252)), (0.86, 40, (255, 255, 255))]),
    'night': dict(sky=[(0, (10, 14, 40)), (1, (60, 50, 110))], sun=(0.78, 0.22, 48, (245, 245, 225)), stars=True,
                  ridges=[(0.7, 45, (24, 24, 60)), (0.84, 35, (10, 10, 30))]),
    'lavender': dict(sky=[(0, (200, 170, 235)), (1, (255, 215, 235))], sun=(0.5, 0.42, 65, (255, 250, 240)),
                     ridges=[(0.6, 50, (170, 130, 200)), (0.76, 45, (130, 90, 170)), (0.9, 30, (80, 50, 120))]),
    'autumn': dict(sky=[(0, (250, 215, 160)), (1, (255, 240, 210))], sun=(0.25, 0.28, 58, (255, 255, 240)),
                   ridges=[(0.58, 55, (220, 130, 60)), (0.72, 50, (180, 80, 40)), (0.86, 35, (110, 45, 30))]),
}


def landscape(name, w=2400, h=1500, seed=1):
    sc = SCENES[name]
    img = gradient(w, h, sc['sky']).convert('RGBA')
    d = ImageDraw.Draw(img)
    if sc.get('stars'):
        stars(d, w, int(h * 0.6), 160, seed)
    sx, sy, sr, sc_col = sc['sun']
    sun(img, int(w * sx), int(h * sy), sr, sc_col)
    d = ImageDraw.Draw(img)
    for i, (by, amp, col) in enumerate(sc['ridges']):
        ridge(d, w, int(h * by), amp * 2, col, seed * 10 + i, h=h)
    if name == 'ocean':  # 반사 하이라이트
        for i in range(40):
            y = int(h * 0.62 + i * (h * 0.38) / 40)
            half = int(30 + i * 6)
            d.line([(int(w * 0.3) - half, y), (int(w * 0.3) + half, y)], fill=(255, 255, 255, 120), width=3)
    return img.convert('RGB').filter(ImageFilter.GaussianBlur(1.2))


def tall_panorama(w=1200, h=3600):
    """하늘에서 땅까지 이어지는 세로로 긴 이미지 (세로 스크롤 시연용)."""
    stops = [(0, (20, 24, 70)), (0.25, (120, 90, 170)), (0.45, (255, 150, 110)), (0.6, (255, 215, 160)), (0.62, (60, 120, 90)), (1, (18, 50, 40))]
    img = gradient(w, h, stops).convert('RGBA')
    d = ImageDraw.Draw(img)
    stars(d, w, int(h * 0.25), 140, 5)
    sun(img, int(w * 0.5), int(h * 0.5), 90, (255, 245, 210))
    d = ImageDraw.Draw(img)
    for i, (by, amp, col) in enumerate([(0.56, 80, (120, 70, 130)), (0.6, 70, (70, 100, 90)), (0.7, 90, (40, 90, 70)), (0.82, 70, (26, 66, 52))]):
        ridge(d, w, int(h * by), amp * 2, col, 40 + i, freq=2.0, h=h)
    return img.convert('RGB').filter(ImageFilter.GaussianBlur(1.2))


def main(outdir):
    out = Path(outdir)
    out.mkdir(parents=True, exist_ok=True)
    for i, name in enumerate(SCENES, 1):
        landscape(name, seed=i).save(out / f'demo_{i:02d}_{name}.jpg', quality=88)
    tall_panorama().save(out / 'demo_09_tall_panorama.jpg', quality=88)
    print('saved', len(list(out.iterdir())), 'images to', out)


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'demo-album')
