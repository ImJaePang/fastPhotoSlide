# 인수인계 메모 (AlbumLoop)

> 다음 세션의 Claude가 가장 먼저 읽는 문서. 마지막 갱신: 2026-11-14.
> 작업 원칙은 `CLAUDE.md`, 릴리스 절차는 `RELEASING.md` 참고. 사용자는 한국어로 대화하며, 결과물을 만들면 **전체 경로**를 알려 주길 원한다. 결과가 나쁘면 솔직히 말하고, 외부에 공개되는 작업(푸시/릴리스)은 먼저 확인받는다.

---

## 1. 한 줄 요약

앱 이름/패키지/아이콘/전환 깜빡임 수정까지 끝나서 GitHub에 푸시됨(`01df896`).
세로 사진 스크롤 개선(일정 속도, 왕복 제거, 표시 시간 자동 연장)은 코드 완성 + 실기기 시간 측정으로 확인됨(로컬 미커밋).
남은 것: 스크롤 모양 눈으로 확인 → README 스크린샷/GIF 촬영 → `v1.2.0` 릴리스.

## 2. git 상태

- 원격 `master` = `01df896` (푸시 완료). 그 이후 변경은 **전부 로컬, 커밋 안 됨**:
  - 수정: `src/components/SlideViewer.jsx`, `src/hooks/useSlideshow.js`, `src/components/ManualModal.jsx`
  - 신규: `src/utils/slideTiming.js`, `tools/comfy_gen.py`, `tools/demo_prompts.json`, `tools/make_demo_animations.py`
  - 삭제: `tools/comfy_icon_gen.py` (`comfy_gen.py`로 대체)
- 사용자가 "커밋/푸시해 줘"라고 할 때만 커밋·푸시한다. (이번 변경은 아직 요청 없음)
- (`[SCHED]` 디버그 로그는 소스에서 이미 제거함. 기기에 설치된 앱에는 아직 남아 있으니 다음 빌드 때 정리됨.)

## 3. 세로 사진 스크롤 개선 — 동작 확인됨 (남은 것: 눈으로 보는 확인)

**배경(사용자 요구)**: 세로 사진 스크롤이 슬라이드 간격에 묶여 있어서 간격이 짧으면 위아래로 허둥대며 왔다갔다 함 → "경박하다". 일정한 속도로 한 번만 내려가게 하고, 간격이 짧으면 표시 시간을 늘려 달라는 취지.

**구현** (코드 완성, 로컬 미커밋):
- `src/utils/slideTiming.js`: 스크롤 속도 100dp/초, 시작 전 1초 정지, 끝에서 2초 머묾, 최대 60초. `scrollDistanceFor` / `displayTimeSec` / `scrollPlan`
- `SlideViewer.jsx` `PortraitScrollImage`: 왕복(리바운드) 제거, `withDelay` + 단일 `withTiming`(`Easing.inOut(sin)`)
- `useSlideshow.js` `scheduleNext`: 타이머를 `displayTimeSec(asset, time, 화면폭, 화면높이)`로 계산

**실기기 측정 결과 (간격 3초 설정, 새 앱이 화면 앞에 있는 상태에서)**:
- P4(704x1920): 계산 29.9초 → 실제 표시 29.94초
- P1(832x1472): 계산 17.6초 → 실제 표시 17.68초
- 즉 표시 시간 연장은 **정상 동작**.

**주의 — 이 세션에서 한 측정 실수 (같은 실수를 반복하지 말 것)**:
- 앱 안에서 `adb shell input keyevent KEYCODE_BACK` 을 누르면 AlbumLoop가 루트 화면에서 **종료**되고, 기기에 남아 있던 예전 앱 "디지털 액자"(`com.photoviewer.digitalframe`)가 앞으로 올라온다. 그 뒤의 탭/로그(3초 간격)는 예전 앱의 것이었고, 이걸 "새 코드가 안 먹는다"고 잘못 판단했다.
- 두 앱 모두 로그 태그가 `ReactNativeJS` 로 같다. **측정 전에 반드시 앞 화면 앱과 PID를 확인**: `adb shell dumpsys window | grep mCurrentFocus`, `adb shell pidof com.imjaepang.albumloop`.
- 모달(앨범 선택/설명서)을 닫을 때는 BACK 대신 화면의 닫기/취소 버튼 좌표를 탭한다. 예전 앱은 가급적 `adb shell pm uninstall com.photoviewer.digitalframe` 로 지우는 것이 안전하나, **사용자의 기기 앱이므로 사용자에게 먼저 물어볼 것**.

**남은 확인**: 스크롤 모양(속도가 일정하고 왕복이 없는지)은 로그로 알 수 없으므로 `AlbumLoopTall` 을 화면 녹화해 눈으로 확인(위 5절 앨범 사용). 확인 후 README GIF로 재사용 가능.

## 4. 남은 작업 순서

1. 세로 스크롤 모양 확인(녹화) 후 `src/utils/slideTiming.js` 등 로컬 변경 커밋 (사용자가 요청할 때)
2. README용 스크린샷/GIF 촬영 (데모 일러스트만 사용, 아래 5절)
   - 필요한 컷: 슬라이드쇼, 설정(다크), 설정(라이트+포인트 컬러), 사용 설명서, 전환 효과 GIF, 세로 스크롤 GIF, GIF/WebP/동영상 지원 장면
   - 결과물은 `docs/images/` 에 두고 README에 삽입 (용량 주의: GIF는 가급적 2~3MB 이하로)
3. README 기능 설명 갱신 (세로 스크롤 방식 변경: 일정 속도, 간격이 짧으면 표시 시간 자동 연장)
4. 사용자 요청 시 `v1.2.0` 릴리스 (`RELEASING.md` 절차). 참고: 현재 GitHub의 `v1.1.0` APK는 전환 깜빡임이 있는 옛 빌드임
5. 태블릿 정리(데모 앨범/녹화본 삭제)

## 5. 데모 이미지 (README 촬영용)

**사용자 요구**: 데모는 가짜 풍경이 아니라 인물 일러스트, 세로 스크롤, GIF/WebP까지 보여줘야 함. **실제 사진(사용자 가족 사진 등)은 절대 README/저장소에 쓰지 않는다.**

- 생성기: `tools/comfy_gen.py` + `tools/demo_prompts.json` (가로 6장 1344x768, 세로 4장 832x1472 / 704x1920, Shinkai 애니 LoRA)
- 애니메이션 샘플: `tools/make_demo_animations.py <이미지> <출력폴더> <이름>` → `.gif`, `.webp`, `.mp4`
- 마지막에 만든 결과물은 **임시 폴더**(세션 scratchpad)에 있었고 사라졌을 수 있다. 없으면 위 스크립트로 다시 생성하면 된다 (이미지 10장 약 9분).
- 기기에는 앨범 2개를 올려 둠 (`/sdcard/Pictures/`):
  - `AlbumLoopDemo`: 일러스트 JPG 10장 + `anim_seaside.gif` + `anim_fireworks.webp` + `clip_seaside.mp4` (총 13)
  - `AlbumLoopTall`: 세로 사진 2장 (스크롤 시연용)
- **촬영이 모두 끝나면 두 앨범을 삭제하고 미디어 DB도 정리할 것**:
  `adb shell rm -rf /sdcard/Pictures/AlbumLoopDemo /sdcard/Pictures/AlbumLoopTall` 후
  `adb shell "content delete --uri content://media/external/images/media --where \"bucket_display_name='AlbumLoopDemo'\""` (Tall도 동일, 동영상은 `.../video/media`)

## 6. 태블릿(adb) 작업 요령

- **앞 화면 앱 확인 필수**: 기기에 예전 앱 "디지털 액자"가 남아 있어 BACK 키 등으로 쉽게 앞으로 올라온다. 3절 '측정 실수' 참고.
- 기기: Lenovo TB336FU, 2560x1600(= 1280x800dp), 화면 잠금/꺼짐 주의. 개발자 옵션의 "충전 중 화면 켜두기"는 사용자가 켜 둠.
- adb 경로: `C:\Users\narus\AppData\Local\Android\Sdk\platform-tools\adb.exe` (PATH에 없음)
- **Git Bash에서는 `export MSYS_NO_PATHCONV=1` 필수** (안 하면 `/sdcard`가 `C:/Program Files/Git/sdcard`로 변환됨)
- 설치 시 Play Protect "앱을 전송하시겠습니까?" 창이 뜨면 사용자에게 **"이번에만 전송"** 을 고르게 안내 (사용자가 직접 눌러야 함)
- 앱 패키지: `com.imjaepang.albumloop`. 예전 앱 `com.photoviewer.digitalframe`("디지털 액자")도 기기에 남아 있음(사용자가 삭제 예정)
- 빌드/설치: `cd android && ANDROID_HOME=...\Sdk ./gradlew app:installRelease -PreactNativeArchitectures=arm64-v8a` (증분 빌드 약 2~4분). `android/`는 `expo prebuild` 산출물(gitignore). 아이콘/app.json 변경 시 `npx expo prebuild --platform android --clean --no-install` 필요하며, 이때 Gradle이 파일을 잡고 있으면 EBUSY 실패 → 재시도.
- **설정 패널은 10초 후 자동으로 닫힘**. UI 조작은 "열기 → 조작 → 캡처"를 한 번의 명령으로 이어서 실행.
- 좌표(원본 픽셀 기준): 화면 가운데 탭 `1280 1000`(설정 열기), 설정의 앨범 "변경" `1161 517`, 닫기 `2170 192`, 테마 라이트/다크 `797 1211` / `1075 1211`, 단일 `1764 475`, 랜덤 `2042 475`.
- 앨범 선택 목록은 개수 내림차순: `selectedPhoto(144) / AlbumLoopDemo(13) / 4컷영상(4) / webp(4) / AlbumLoopTall(2) / Screenshots(1)`. **목록 행의 y 좌표는 앨범 수에 따라 바뀌므로 추측하지 말 것.** 화면 대신 로그로 확인하는 방법: 선택 후 `adb logcat -d -s ReactNativeJS | grep "Cycle 1"` 의 `(N items)` 로 어느 앨범인지 판별.
- **개인정보 주의**: `selectedPhoto`/`4컷영상` 등 사용자의 실제 앨범에는 가족 사진이 있다. 앨범이 불확실할 때 화면 캡처를 보지 말 것(배경에 비침). 녹화본은 열어 보지 말고 `blackdetect` 같은 수치 분석만 하고 즉시 삭제.

## 7. 촬영/검증 방법

- ffmpeg: `pip install --user imageio-ffmpeg` 로 시스템 Python(3.12)에 설치됨. 실행 파일:
  `C:/Users/narus/AppData/Roaming/Python/Python312/site-packages/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v9.0.2.exe` (Windows 경로로 넘길 것, `/c/...` 경로는 안 먹힘). ComfyUI의 Python 환경과는 별개다.
- 화면 녹화: `adb shell "screenrecord --time-limit 14 --size 1280x800 --bit-rate 6000000 /sdcard/x.mp4" &` → `adb pull` → GIF 변환:
  `ffmpeg -ss 0.6 -t 12 -i x.mp4 -vf "fps=10,scale=720:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96[p];[b][p]paletteuse=dither=bayer:bayer_scale=4" out.gif`
- 전환 깜빡임(검은 프레임) 검사: `ffmpeg -i x.mp4 -vf "blackdetect=d=0.0:pix_th=0.08:pic_th=0.97" -an -f null -` 에서 `black_start`가 0개여야 정상 (현재 수정 빌드에서 0개 확인됨).
- 스크롤 검증 지표: `AlbumLoopTall` 재생 시 슬라이드 변경 간격(`Cycle` 로그 타임스탬프 차이)이 P1≈17.6s, P4≈29.9s 이어야 함.

## 8. ComfyUI (아이콘/데모 이미지 생성용)

**설치 위치**: `H:\jjal` (사용자의 별도 작업 공간. 거기의 `CLAUDE.md`, `README.md`, `AGENT.md`에 규칙과 환경 설명이 있으니 ComfyUI를 만지기 전에 읽을 것)
- GPU: RTX 4060 Ti 16GB, RAM 32GB, Windows 11
- 구성: `H:\jjal\ComfyUI\ComfyUI_windows_portable\` (ComfyUI 0.42, PyTorch 2.8+cu128)
- 출력 폴더: `H:\jjal\output` (아이콘 후보는 `AlbumLoop_Icon\`, 데모 이미지는 `AlbumLoop_Demo\`)

**서버 실행 (이 세션에서 쓴 방법, `AGENT.md`에 적힌 방식)**:
```powershell
$root = "H:\jjal\ComfyUI\ComfyUI_windows_portable"
Start-Process -FilePath "$root\python_embeded\python.exe" -WorkingDirectory $root -WindowStyle Minimized `
  -ArgumentList @("-s","ComfyUI\main.py","--windows-standalone-build","--reserve-vram","2.0","--output-directory","H:\jjal\output")
```
- 약 20초 후 `http://127.0.0.1:8188` 응답. (`run_comfyui.bat`도 있지만 `AGENT.md`에 "cmd /c로 띄우면 서버가 안 올라온 적이 있다"고 적혀 있어 위 방식을 사용)
- **종료/재시작 전에 반드시 큐가 비었는지 확인**: `curl http://127.0.0.1:8188/queue` 가 `queue_running`, `queue_pending` 모두 빈 배열일 때만. 사용자의 다른 작업을 끊으면 안 된다.
- **현재 이 세션에서 켠 서버가 최소화 창으로 떠 있을 수 있다.** 사용자에게 종료 여부를 물어볼 것 (VRAM을 점유함).

**사용한 모델/설정** (`H:\jjal\AGENT.md` 워크플로 [1],[3] 기준):
- UNet `z_image_turbo_bf16.safetensors`, CLIP `qwen_3_4b.safetensors`(type `lumina2`, device `cpu`), VAE `ae.safetensors`
- KSampler: 9 steps, cfg 1, euler / simple, `ModelSamplingAuraFlow` shift 3 (cfg 1이라 네거티브 프롬프트 영향은 작음)
- 애니 스타일: LoRA `Shinkai_Kyoto_Anime.safetensors` (강도 1.0)
- 속도: 1344x768 약 40초, 832x1472 약 55초, 704x1920 약 60초 / 장
- 프롬프트는 **영어**로 쓸 것(한국어는 세부 단어가 소실됨 — `AGENT.md` 메모). 한글 텍스트는 이 모델이 오타를 내므로 이미지에 글자를 넣지 말 것.

**API로 실행하는 방법**: `tools/comfy_gen.py <프롬프트 JSON> <출력 폴더> [출력 폴더 접두어]` (ComfyUI 서버가 켜져 있어야 함). JSON 형식은 파일 상단 docstring 참고. 서버를 UI 없이 API로만 쓰므로 사용자의 워크플로 파일은 건드리지 않는다.

**ComfyUI 관련 규칙 (`H:\jjal\CLAUDE.md`)**:
- pip 패키지/커스텀 노드 설치, 모델 다운로드는 사용자의 환경을 바꾸는 일이므로 **먼저 물어본다**. (이 세션에서 ComfyUI 환경에는 아무것도 설치하지 않았음)
- 결과물을 만들면 전체 경로를 알려 준다. 품질이 나쁘면 솔직히 말한다.
- 기능을 추가했다면 그 폴더의 `README.md`/`AGENT.md` 갱신 의무가 있으나, 이번 작업은 API 호출만 했고 설치/변경이 없어서 갱신하지 않았다.

**아이콘**: 사용자가 PIL로 그린 시안 3종은 모두 별로라고 했고, ComfyUI로 16장을 만들어 `polaroids_1000`(폴라로이드 3장 + 빛나는 루프 링)을 선택. 원본은 `docs/icon-source/polaroids_1000.png`, 에셋 생성은 `tools/make_app_icons.py <원본> assets/`. 이미 적용·푸시됨.

## 9. 앱 구조 메모 (이번에 만든/바꾼 것)

- 테마: `src/theme/themes.js`(토큰, 팔레트 6종), `ThemeProvider.jsx`(시스템/라이트/다크). 공용 컴포넌트 `src/components/ui/index.jsx`. 새 화면은 `useTheme()`의 `colors`를 쓸 것. `Button`은 안드로이드에서 `Pressable` 함수형 style이 테마 전환 직후 배경이 늦게 바뀌는 문제가 있어 정적 View + 안쪽 Pressable 구조로 만들었음 (되돌리지 말 것).
- 전환: `TransitionSlideViewer.jsx` 더블 버퍼. **전환 시작 때마다 화면이 검게 번쩍이던 원인과 해결**:
  - 원인 1: `useAnimatedStyle` 의존성이 바뀌면 Reanimated가 스타일 등록을 새로 해서 1~2프레임 초기(투명) 스타일로 돌아감 → 레이어 스타일 워크릿이 **공유 값만** 읽도록 변경
  - 원인 2: 새 레이어의 첫 프레임에 검은 배경이 보임 → 이미지 `onLoad` 후 전환 시작 + 준비 전에는 바깥 일반 `View`에서 정적으로 `opacity: 0`
  - 이 구조를 단순화하거나 되돌리면 깜빡임이 다시 생긴다. 수정 후 `blackdetect`로 반드시 검증할 것.
- 영상: `expo-video`. 짧은 영상은 반복, 긴 영상은 끝까지 재생.
- 사용 설명서: `src/components/ManualModal.jsx` (설정 → "설명서 보기", 초기 화면의 "설명서" 버튼). 기능이 바뀌면 문구도 같이 갱신.
- 서명 키: release도 `android/app/debug.keystore`로 서명. `android/`를 재생성해도 키 해시가 같아서 덮어쓰기 설치가 됨. 다른 PC에서 빌드하면 키가 달라지니 백업 필요(`RELEASING.md` 참고).

## 10. 정리해야 할 임시 상태 체크리스트

- [x] `useSlideshow.js` 의 `[SCHED]` 디버그 로그 제거 완료 (설치된 앱에는 아직 로그 버전이 깔려 있음 → 다음 빌드에서 사라짐)
- [ ] 태블릿의 `AlbumLoopDemo`, `AlbumLoopTall` 앨범과 `/sdcard/*.mp4` 삭제 + 미디어 DB 정리
- [ ] ComfyUI 서버 종료 여부 사용자에게 확인 (큐가 비어 있을 때만 종료)
- [ ] 이전 앱 "디지털 액자"(`com.photoviewer.digitalframe`) 삭제는 사용자가 직접
- [ ] `docs/HANDOFF.md`(이 문서)는 작업이 모두 끝나면 삭제하거나 최신 상태로 정리
