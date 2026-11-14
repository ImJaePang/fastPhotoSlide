"""AI로 만든 아이콘 이미지(라운드 사각형 + 흰 배경)에서 앱 아이콘 에셋 일체를 생성한다.

사용법: python tools/make_app_icons.py <원본 PNG> <assets 폴더> [미리보기 PNG]
생성: icon.png, android-icon-background.png, android-icon-foreground.png,
      android-icon-monochrome.png, splash-icon.png, favicon.png

방식:
  1) 원본에서 라운드 사각형 안쪽 정사각형을 잘라 icon.png로 사용
  2) 배경은 같은 색의 세로 그라디언트로 새로 생성 (적응형 아이콘 배경 레이어)
  3) 배경과 다른 픽셀(폴라로이드/링)만 키잉해 투명 전경을 만들고, 적응형 안전 영역(66%)에 맞게 축소
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter


def inner_crop(img):
    """흰 배경 위 라운드 사각형의 bbox를 찾고, 모서리가 잘리지 않는 안쪽 정사각형을 반환."""
    a = np.asarray(img.convert('RGB')).astype(int)
    dark = (a.sum(axis=2) < 330)  # 어두운 배경 픽셀
    ys, xs = np.where(dark)
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    size = min(x1 - x0, y1 - y0)
    inset = int(size * 0.075)  # 모서리 곡률 바깥을 피하는 여유
    cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
    half = size // 2 - inset
    return img.crop((cx - half, cy - half, cx + half, cy + half)).convert('RGB')


def gradient_bg(size, top, bottom):
    arr = np.zeros((size, size, 3), dtype=np.uint8)
    for y in range(size):
        t = y / (size - 1)
        arr[y, :, :] = [int(top[i] + (bottom[i] - top[i]) * t) for i in range(3)]
    return Image.fromarray(arr, 'RGB')


def main(src, assets, preview=None):
    assets = Path(assets)
    img = Image.open(src)
    crop = inner_crop(img)
    N = 1024
    icon = crop.resize((N, N), Image.LANCZOS)
    icon.save(assets / 'icon.png')

    a = np.asarray(icon).astype(float)
    # 배경 모델: 왼쪽 가장자리 열의 행별 평균색 (아트워크가 닿지 않는 영역)
    col = a[:, 4:28, :].mean(axis=1)               # (N, 3)
    top, bottom = tuple(col[8]), tuple(col[-8])
    bg_rows = np.repeat(col[:, None, :], N, axis=1)
    diff = np.abs(a - bg_rows).max(axis=2)
    alpha = np.clip((diff - 14) / 34.0, 0, 1)
    alpha = np.asarray(Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))) / 255.0

    # 전경: 키잉된 아트워크를 안전 영역(약 62%)에 맞춰 축소해 중앙 배치
    rgba = np.dstack([a, alpha * 255]).astype(np.uint8)
    art = Image.fromarray(rgba, 'RGBA')
    bbox = Image.fromarray((alpha > 0.25).astype(np.uint8) * 255).getbbox()
    art = art.crop(bbox)
    target = int(N * 0.62)
    k = target / max(art.size)
    art = art.resize((max(1, int(art.width * k)), max(1, int(art.height * k))), Image.LANCZOS)

    def on_canvas(px):
        c = Image.new('RGBA', (px, px), (0, 0, 0, 0))
        kk = px / N
        s = art.resize((max(1, int(art.width * kk)), max(1, int(art.height * kk))), Image.LANCZOS)
        c.alpha_composite(s, ((px - s.width) // 2, (px - s.height) // 2))
        return c

    fg = on_canvas(N)
    fg.save(assets / 'android-icon-foreground.png')
    bg_img = gradient_bg(N, top, bottom)
    bg_img.save(assets / 'android-icon-background.png')

    # 일반 icon.png: 같은 구도에 아트워크를 조금 더 크게(여백 포함) 합성
    big = art.resize((int(art.width * 0.74 / 0.62), int(art.height * 0.74 / 0.62)), Image.LANCZOS)
    full = bg_img.convert('RGBA')
    full.alpha_composite(big, ((N - big.width) // 2, (N - big.height) // 2))
    full.convert('RGB').save(assets / 'icon.png')
    icon = full.convert('RGB')

    # 단색(테마) 아이콘: 알파만 사용한 흰색 실루엣
    mono = Image.new('RGBA', (N, N), (255, 255, 255, 0))
    mono.putalpha(fg.getchannel('A'))
    mono.save(assets / 'android-icon-monochrome.png')

    # 스플래시: 투명 배경 아트워크 (배경색은 app.json의 splash.backgroundColor)
    on_canvas(N).save(assets / 'splash-icon.png')
    icon.resize((48, 48), Image.LANCZOS).save(assets / 'favicon.png')

    mid = tuple(int((top[i] + bottom[i]) / 2) for i in range(3))
    print('top', [int(x) for x in top], 'bottom', [int(x) for x in bottom], 'mid #%02x%02x%02x' % mid)

    if preview:
        bg = gradient_bg(N, top, bottom).convert('RGBA')
        bg.alpha_composite(fg)
        sheet = Image.new('RGB', (1500, 560), (40, 40, 44))
        sheet.paste(icon.resize((400, 400), Image.LANCZOS), (20, 20))
        m = Image.new('L', (400, 400), 0)
        ImageDraw.Draw(m).ellipse([0, 0, 399, 399], fill=255)
        sheet.paste(bg.convert('RGB').resize((400, 400), Image.LANCZOS), (450, 20), m)
        r = Image.new('L', (400, 400), 0)
        ImageDraw.Draw(r).rounded_rectangle([0, 0, 399, 399], 90, fill=255)
        sheet.paste(bg.convert('RGB').resize((400, 400), Image.LANCZOS), (880, 20), r)
        x = 450
        for s in (96, 64, 48):
            p = bg.convert('RGB').resize((s, s), Image.LANCZOS)
            mm = Image.new('L', (s, s), 0)
            ImageDraw.Draw(mm).ellipse([0, 0, s - 1, s - 1], fill=255)
            sheet.paste(p, (x, 450), mm)
            x += s + 20
        sheet.save(preview)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else None)
