"""ComfyUI(Z-Image-Turbo)로 앱 아이콘 후보를 대량 생성한다.

사전 조건: ComfyUI 서버가 http://127.0.0.1:8188 에서 실행 중이어야 한다.
사용법: python tools/comfy_icon_gen.py <프롬프트 JSON> <출력 폴더> [시드 개수]

프롬프트 JSON 형식: {"태그": "영문 프롬프트", ...}
생성 결과는 ComfyUI 출력 폴더(AlbumLoop_Icon/ 하위)에 저장되고, 이 스크립트가 <출력 폴더>로 복사한다.
"""
import json
import shutil
import sys
import time
import urllib.request
import uuid
from pathlib import Path

SERVER = 'http://127.0.0.1:8188'
COMFY_OUTPUT = Path(r'H:\jjal\output')
SIZE = 1024
NEGATIVE = 'text, letters, watermark, signature, blurry, low quality, photo of a person, hands'


def api(path, data=None):
    req = urllib.request.Request(
        SERVER + path,
        data=json.dumps(data).encode() if data is not None else None,
        headers={'Content-Type': 'application/json'},
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read())


def build_prompt(text, seed, prefix):
    """Z-Image-Turbo T2I (워크플로 [1]과 동일한 구성: 9 steps, cfg 1, euler/simple, AuraFlow shift 3)."""
    return {
        '1': {'class_type': 'UNETLoader', 'inputs': {'unet_name': 'z_image_turbo_bf16.safetensors', 'weight_dtype': 'default'}},
        '2': {'class_type': 'CLIPLoader', 'inputs': {'clip_name': 'qwen_3_4b.safetensors', 'type': 'lumina2', 'device': 'cpu'}},
        '3': {'class_type': 'VAELoader', 'inputs': {'vae_name': 'ae.safetensors'}},
        '4': {'class_type': 'ModelSamplingAuraFlow', 'inputs': {'model': ['1', 0], 'shift': 3}},
        '5': {'class_type': 'CLIPTextEncode', 'inputs': {'text': text, 'clip': ['2', 0]}},
        '6': {'class_type': 'CLIPTextEncode', 'inputs': {'text': NEGATIVE, 'clip': ['2', 0]}},
        '7': {'class_type': 'EmptySD3LatentImage', 'inputs': {'width': SIZE, 'height': SIZE, 'batch_size': 1}},
        '8': {'class_type': 'KSampler', 'inputs': {
            'model': ['4', 0], 'positive': ['5', 0], 'negative': ['6', 0], 'latent_image': ['7', 0],
            'seed': seed, 'steps': 9, 'cfg': 1, 'sampler_name': 'euler', 'scheduler': 'simple', 'denoise': 1}},
        '9': {'class_type': 'VAEDecode', 'inputs': {'samples': ['8', 0], 'vae': ['3', 0]}},
        '10': {'class_type': 'SaveImage', 'inputs': {'images': ['9', 0], 'filename_prefix': prefix}},
    }


def wait(prompt_id, timeout=600):
    t0 = time.time()
    while time.time() - t0 < timeout:
        hist = api(f'/history/{prompt_id}')
        if prompt_id in hist:
            return hist[prompt_id]
        time.sleep(1.5)
    raise TimeoutError(prompt_id)


def main(prompts_json, outdir, n_seeds=4):
    prompts = json.loads(Path(prompts_json).read_text(encoding='utf-8'))
    out = Path(outdir)
    out.mkdir(parents=True, exist_ok=True)
    client = uuid.uuid4().hex
    for tag, text in prompts.items():
        for k in range(n_seeds):
            seed = 1000 + k * 7919
            prefix = f'AlbumLoop_Icon/{tag}_{seed}'
            t0 = time.time()
            res = api('/prompt', {'prompt': build_prompt(text, seed, prefix), 'client_id': client})
            hist = wait(res['prompt_id'])
            status = hist.get('status', {}).get('status_str')
            imgs = [i for o in hist['outputs'].values() for i in o.get('images', [])]
            for im in imgs:
                src = COMFY_OUTPUT / im.get('subfolder', '') / im['filename']
                shutil.copy2(src, out / f'{tag}_{seed}.png')
            print(f'{tag} seed={seed} {status} {time.time() - t0:.0f}s -> {len(imgs)} image(s)', flush=True)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 4)
