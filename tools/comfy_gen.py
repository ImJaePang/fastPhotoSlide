"""ComfyUI(Z-Image-Turbo [+ LoRA])로 이미지를 일괄 생성한다. (아이콘 후보, README 데모 이미지 등)

사전 조건: ComfyUI 서버가 http://127.0.0.1:8188 에서 실행 중이어야 한다.
사용법: python tools/comfy_gen.py <프롬프트 JSON> <출력 폴더> [폴더 접두어]

프롬프트 JSON 형식:
  {"태그": {"prompt": "영문 프롬프트", "w": 1344, "h": 768, "seed": 123, "lora": "Shinkai_Kyoto_Anime.safetensors", "lora_strength": 1.0}, ...}
  (w/h/seed/lora는 생략 가능. 기본 1024x1024, seed=태그 기반)
결과는 ComfyUI 출력 폴더(<접두어>/ 하위)에 저장되고, 이 스크립트가 <출력 폴더>로 복사한다.
"""
import json
import shutil
import sys
import time
import urllib.request
import uuid
import zlib
from pathlib import Path

SERVER = 'http://127.0.0.1:8188'
COMFY_OUTPUT = Path(r'H:\jjal\output')
NEGATIVE = ('photorealistic, photo, real life, 3d, realistic, ugly, bad anatomy, bad hands, missing fingers, '
            'extra fingers, text, watermark, signature, blurry, lowres, nsfw')


def api(path, data=None):
    req = urllib.request.Request(
        SERVER + path,
        data=json.dumps(data).encode() if data is not None else None,
        headers={'Content-Type': 'application/json'},
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read())


def build_prompt(spec, seed, prefix):
    """워크플로 [1]/[3]과 동일: 9 steps, cfg 1, euler/simple, AuraFlow shift 3."""
    model_src = ['1', 0]
    nodes = {
        '1': {'class_type': 'UNETLoader', 'inputs': {'unet_name': 'z_image_turbo_bf16.safetensors', 'weight_dtype': 'default'}},
        '2': {'class_type': 'CLIPLoader', 'inputs': {'clip_name': 'qwen_3_4b.safetensors', 'type': 'lumina2', 'device': 'cpu'}},
        '3': {'class_type': 'VAELoader', 'inputs': {'vae_name': 'ae.safetensors'}},
    }
    if spec.get('lora'):
        nodes['11'] = {'class_type': 'LoraLoaderModelOnly',
                       'inputs': {'model': ['1', 0], 'lora_name': spec['lora'], 'strength_model': spec.get('lora_strength', 1.0)}}
        model_src = ['11', 0]
    nodes.update({
        '4': {'class_type': 'ModelSamplingAuraFlow', 'inputs': {'model': model_src, 'shift': 3}},
        '5': {'class_type': 'CLIPTextEncode', 'inputs': {'text': spec['prompt'], 'clip': ['2', 0]}},
        '6': {'class_type': 'CLIPTextEncode', 'inputs': {'text': spec.get('negative', NEGATIVE), 'clip': ['2', 0]}},
        '7': {'class_type': 'EmptySD3LatentImage', 'inputs': {'width': spec.get('w', 1024), 'height': spec.get('h', 1024), 'batch_size': 1}},
        '8': {'class_type': 'KSampler', 'inputs': {
            'model': ['4', 0], 'positive': ['5', 0], 'negative': ['6', 0], 'latent_image': ['7', 0],
            'seed': seed, 'steps': 9, 'cfg': 1, 'sampler_name': 'euler', 'scheduler': 'simple', 'denoise': 1}},
        '9': {'class_type': 'VAEDecode', 'inputs': {'samples': ['8', 0], 'vae': ['3', 0]}},
        '10': {'class_type': 'SaveImage', 'inputs': {'images': ['9', 0], 'filename_prefix': prefix}},
    })
    return nodes


def wait(prompt_id, timeout=900):
    t0 = time.time()
    while time.time() - t0 < timeout:
        hist = api(f'/history/{prompt_id}')
        if prompt_id in hist:
            return hist[prompt_id]
        time.sleep(1.5)
    raise TimeoutError(prompt_id)


def main(prompts_json, outdir, folder='AlbumLoop_Demo'):
    prompts = json.loads(Path(prompts_json).read_text(encoding='utf-8'))
    out = Path(outdir)
    out.mkdir(parents=True, exist_ok=True)
    client = uuid.uuid4().hex
    for tag, spec in prompts.items():
        seed = spec.get('seed', zlib.crc32(tag.encode()) % 10_000_000)
        t0 = time.time()
        res = api('/prompt', {'prompt': build_prompt(spec, seed, f'{folder}/{tag}'), 'client_id': client})
        hist = wait(res['prompt_id'])
        imgs = [i for o in hist['outputs'].values() for i in o.get('images', [])]
        for im in imgs:
            shutil.copy2(COMFY_OUTPUT / im.get('subfolder', '') / im['filename'], out / f'{tag}.png')
        print(f'{tag} seed={seed} {hist.get("status", {}).get("status_str")} {time.time() - t0:.0f}s', flush=True)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else 'AlbumLoop_Demo')
