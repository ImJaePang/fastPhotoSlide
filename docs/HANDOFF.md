# 인수인계 메모 (AlbumLoop)

> 다음 세션의 Claude가 가장 먼저 읽는 문서. 마지막 갱신: 2026-11-15.
> 작업 원칙은 `CLAUDE.md`, 릴리스 절차는 `RELEASING.md` 참고. 사용자는 한국어로 대화하며, 결과물을 만들면 **전체 경로**를 알려 주길 원한다. 결과가 나쁘면 솔직히 말하고, 외부에 공개되는 작업(푸시/릴리스)은 먼저 확인받는다.

---

## 1. 한 줄 요약

`v1.2.0` 릴리스까지 끝났다 (이름/아이콘/전환 깜빡임 수정, 세로 스크롤 개선, 설명서, README 미리보기).
진행 중인 작업은 없다. 다음 작업은 사용자가 새로 요청할 때 시작한다.

## 2. 현재 상태

- git: `master` = `origin/master`, 로컬 미커밋 변경 없음 (마지막 커밋은 이 문서 정리 커밋. 그 앞이 `chore: v1.2.0 버전 갱신`).
- GitHub 릴리스: [v1.2.0](https://github.com/ImJaePang/fastPhotoSlide/releases/tag/v1.2.0) (`photoViewer.apk`, versionName 1.2.0 / versionCode 2). 이전 `v1.1.0`은 전환 깜빡임이 있는 옛 빌드.
- 태블릿(Lenovo TB336FU): 기존 AlbumLoop와 예전 앱 "디지털 액자"(`com.photoviewer.digitalframe`)를 삭제하고 **v1.2.0 릴리스 APK를 새로 설치**함. 설정(앨범/테마 등)은 초기화됐으므로 사용자가 앱에서 앨범을 다시 골라야 한다.
- 데모 앨범(`AlbumLoopDemo`, `AlbumLoopTall`)과 녹화본은 기기에서 삭제했고 미디어 DB도 정리함.
- ComfyUI 서버는 종료돼 있음 (사용자 확인).
- README 미리보기 이미지는 `docs/images/` 에 있다 (슬라이드쇼/설정 다크·라이트/설명서 JPG, 전환·세로 스크롤·애니메이션 GIF 3종, 모두 데모 일러스트).

## 2-1. 2026-11-15 세션 기록 (여기까지 진행하고 종료)

한 일 (순서대로):
1. 세로 스크롤을 40초 화면 녹화로 눈 확인 → 일정 속도, 한 방향, 왕복 없음 (P4 약 30초, P1 약 18초 표시).
2. 로컬 변경 커밋 (`dc722e6`): 스크롤 개선, ComfyUI 도구, 설명서 문구, HANDOFF/CLAUDE.md.
3. README용 이미지/GIF를 데모 앨범으로 촬영해 `docs/images/`에 저장하고 README에 "미리보기" 섹션 추가, 세로 스크롤 설명 갱신 (`6e387bb`).
4. 태블릿 정리: 데모 앨범 2개 + 미디어 DB 삭제, 예전 앱 "디지털 액자" 삭제.
5. `v1.2.0` 릴리스: `app.json`/`build.gradle` 버전 갱신(`d887f07`) → 푸시 → 릴리스 APK 빌드 → 서명/버전 검증 → GitHub 릴리스 업로드.
6. 태블릿의 AlbumLoop를 삭제 후 v1.2.0 릴리스 APK로 새로 설치(`adb install -g`), 정상 실행 확인.
7. 이 문서를 최신 상태로 재작성.

**다음 세션 시작 시**: 진행 중인 작업이 없으므로 사용자 요청을 먼저 확인한다. 태블릿은 설정이 초기화된 새 설치 상태라 앨범 선택부터 필요하다. 후속 후보는 아래 3절.

## 3. 남은 일 / 후속 후보

- GIF 3개(각 3.6~4.5MB)가 목표(2~3MB)보다 크다. 저장소 용량이 문제 되면 길이/해상도를 줄여 다시 만든다 (7절 방법).
- 동영상(`.mp4`) 재생 장면은 README에 따로 없다.
- 세로 스크롤 속도/정지 시간 상수(100dp/초, 시작 1초, 끝 2초, 최대 60초)는 `src/utils/slideTiming.js`. 사용자 피드백에 따라 조정 가능.
- 이 문서는 새 작업이 시작되면 그 내용에 맞게 갱신하거나, 더 필요 없으면 삭제한다.

## 4. 이전에 겪은 함정 (재발 방지)

- **측정 전에 앞 화면 앱 확인**: 앱 안에서 `KEYCODE_BACK`을 누르면 AlbumLoop가 루트에서 종료되어 다른 앱이 앞으로 올라올 수 있다. 두 앱 모두 로그 태그가 `ReactNativeJS`로 같으니 `adb shell dumpsys window | grep mCurrentFocus`, `adb shell pidof com.imjaepang.albumloop`로 확인. 모달은 BACK 대신 닫기 버튼 좌표를 탭한다.
- **UI 좌표는 추측하지 말 것**: 앨범 선택 목록의 행 위치는 앨범 수에 따라 바뀐다. 캡처 대신 `uiautomator dump`로 텍스트/bounds를 뽑아 좌표를 구한다 (캡처하면 가족 사진이 비칠 수 있음). 테마 전환 직후에는 dump가 "could not get idle state"로 실패할 수 있으니 1초 뒤 재시도.
- 설치된 앱이 어느 앨범을 재생 중인지는 로그로 판별: `adb logcat -d -s ReactNativeJS | grep "Cycle 1"` 의 `(N items)`.

## 5. 태블릿(adb) 작업 요령

- 기기: Lenovo TB336FU, 2560x1600(= 1280x800dp). 화면 꺼짐/잠금 주의 (`dumpsys window | grep isKeyguardShowing`). 개발자 옵션 "충전 중 화면 켜두기"는 사용자가 켜 둠.
- adb 경로: `C:\Users\narus\AppData\Local\Android\Sdk\platform-tools\adb.exe` (PATH에 없음)
- **Git Bash에서는 `export MSYS_NO_PATHCONV=1` 필수** (안 하면 `/sdcard`가 `C:/Program Files/Git/sdcard`로 변환됨)
- 앱 패키지: `com.imjaepang.albumloop`
- 설치: `adb install -g <apk>` (`-g`로 미디어 권한을 미리 허용). 이번에는 Play Protect 확인창 없이 설치됨. 창이 뜨면 사용자에게 **"이번에만 전송"** 을 고르게 안내(사용자가 직접 눌러야 함).
- 빌드: `cd android && ANDROID_HOME=...\Sdk ./gradlew app:assembleRelease` (또는 설치까지 `app:installRelease -PreactNativeArchitectures=arm64-v8a`). 증분 약 2분. `android/`는 `expo prebuild` 산출물(gitignore). 아이콘/`app.json` 변경 시 `npx expo prebuild --platform android --clean --no-install` 필요 (Gradle이 파일을 잡고 있으면 EBUSY → 재시도). 버전은 `app.json`과 `android/app/build.gradle` 양쪽을 맞춘다(`RELEASING.md`).
- **설정 패널은 10초 후 자동으로 닫힘**. UI 조작은 "열기 → 조작 → 캡처"를 한 번의 명령으로 이어서 실행.
- 좌표(원본 픽셀): 화면 가운데 탭 `1280 1000`(설정 열기), 앨범 "변경" `1161 517`, 닫기 `2170 192`, 테마 라이트/다크 `797 1211` / `1075 1211`, 전환 단일/랜덤 `1764 475` / `2042 475`, 포인트 컬러 첫 번째 `~(410,1377)`부터 간격 100 정도.
- **개인정보 주의**: 사용자의 실제 앨범(`selectedPhoto`, `4컷영상` 등)에는 가족 사진이 있다. 앨범이 불확실하면 화면 캡처를 보지 말 것. 실제 사진은 README/저장소에 절대 쓰지 않는다.

## 6. 데모 이미지 / 도구

- 생성기: `tools/comfy_gen.py` + `tools/demo_prompts.json` (가로 6장 1344x768, 세로 4장 832x1472 / 704x1920, Shinkai 애니 LoRA). 애니메이션 샘플: `tools/make_demo_animations.py <이미지> <출력폴더> <이름>` → `.gif`, `.webp`, `.mp4`.
- 아이콘: `docs/icon-source/polaroids_1000.png` 에서 `tools/make_app_icons.py <원본> assets/` 로 에셋 생성.
- 데모 이미지를 다시 쓰려면 ComfyUI로 재생성(10장 약 9분)해서 기기 `/sdcard/Pictures/AlbumLoopDemo` 등에 올리고, 끝나면 반드시 삭제 + 미디어 DB 정리:
  `adb shell rm -rf /sdcard/Pictures/<앨범>` 후 `adb shell "content delete --uri content://media/external/images/media --where \"bucket_display_name='<앨범>'\""` (동영상은 `.../video/media`).

## 7. 촬영/검증 방법

- ffmpeg: `pip install --user imageio-ffmpeg` 로 시스템 Python(3.12)에 설치됨. 실행 파일: `C:/Users/narus/AppData/Roaming/Python/Python312/site-packages/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v9.0.2.exe` (Windows 경로로 넘길 것).
- 화면 녹화: `adb shell "screenrecord --time-limit 40 --size 1280x800 --bit-rate 4000000 /sdcard/x.mp4"` → `adb pull`. GIF 변환(용량 작게): `ffmpeg -ss 1 -t 14 -i x.mp4 -vf "fps=8,scale=440:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=48:stats_mode=diff[p];[b][p]paletteuse=dither=none:diff_mode=rectangle" out.gif`
- 정지 화면: `adb exec-out screencap -p > x.png` 후 JPG(`-vf scale=1600:-1 -q:v 4`)로 변환해 용량 절약.
- 전환 깜빡임 검사: `ffmpeg -i x.mp4 -vf "blackdetect=d=0.0:pix_th=0.08:pic_th=0.97" -an -f null -` 에서 `black_start`가 0개여야 정상.
- 세로 스크롤 검증: `Cycle` 로그 타임스탬프 간격이 P1(832x1472)≈17.6s, P4(704x1920)≈29.9s (간격 3초 설정 시). 모양은 녹화 후 프레임을 일정 간격으로 뽑아 눈으로 확인 (v1.2.0 때 확인 완료: 일정 속도, 왕복 없음).

## 8. ComfyUI (아이콘/데모 이미지 생성용)

**설치 위치**: `H:\jjal` (사용자의 별도 작업 공간. 거기의 `CLAUDE.md`, `README.md`, `AGENT.md`에 규칙과 환경 설명이 있으니 만지기 전에 읽을 것). GPU RTX 4060 Ti 16GB, RAM 32GB. 구성: `H:\jjal\ComfyUI\ComfyUI_windows_portable\`. 출력: `H:\jjal\output` (`AlbumLoop_Icon\`, `AlbumLoop_Demo\`).

**서버 실행** (`AGENT.md` 방식, cmd /c로 띄우면 안 올라온 적이 있음):
```powershell
$root = "H:\jjal\ComfyUI\ComfyUI_windows_portable"
Start-Process -FilePath "$root\python_embeded\python.exe" -WorkingDirectory $root -WindowStyle Minimized `
  -ArgumentList @("-s","ComfyUI\main.py","--windows-standalone-build","--reserve-vram","2.0","--output-directory","H:\jjal\output")
```
약 20초 후 `http://127.0.0.1:8188` 응답. **종료/재시작 전에 큐가 비었는지 확인**(`curl http://127.0.0.1:8188/queue`의 `queue_running`, `queue_pending`이 모두 빈 배열일 때만). 사용자가 켜 둔 서버를 함부로 끄지 않는다.

**모델/설정**: UNet `z_image_turbo_bf16.safetensors`, CLIP `qwen_3_4b.safetensors`(type `lumina2`, device `cpu`), VAE `ae.safetensors`, KSampler 9 steps / cfg 1 / euler simple / `ModelSamplingAuraFlow` shift 3, 애니 LoRA `Shinkai_Kyoto_Anime.safetensors` 1.0. 1344x768 약 40초, 832x1472 약 55초, 704x1920 약 60초 / 장. 프롬프트는 **영어**로(한국어는 세부가 소실됨), 이미지에 글자를 넣지 말 것(오타).

**실행**: `tools/comfy_gen.py <프롬프트 JSON> <출력 폴더> [접두어]` (서버가 켜져 있어야 함, JSON 형식은 파일 상단 docstring).

**ComfyUI 규칙 (`H:\jjal\CLAUDE.md`)**: pip 패키지/커스텀 노드 설치, 모델 다운로드는 사용자 환경을 바꾸는 일이므로 먼저 물어본다. 결과물은 전체 경로를 알려 주고, 품질이 나쁘면 솔직히 말한다. 기능을 추가하면 그 폴더의 `README.md`/`AGENT.md` 갱신 의무가 있다 (지금까지는 API 호출만 해서 갱신 안 함).

## 9. 앱 구조 메모

- 테마: `src/theme/themes.js`(토큰, 팔레트 6종), `ThemeProvider.jsx`(시스템/라이트/다크). 공용 컴포넌트 `src/components/ui/index.jsx`. 새 화면은 `useTheme()`의 `colors`를 쓸 것. `Button`은 안드로이드에서 `Pressable` 함수형 style이 테마 전환 직후 배경이 늦게 바뀌는 문제가 있어 정적 View + 안쪽 Pressable 구조임 (되돌리지 말 것).
- 전환: `TransitionSlideViewer.jsx` 더블 버퍼. 전환 시작 때 화면이 검게 번쩍이던 원인과 해결:
  - `useAnimatedStyle` 의존성이 바뀌면 스타일 등록이 새로 되어 1~2프레임 초기(투명) 스타일로 돌아감 → 레이어 스타일 워크릿이 **공유 값만** 읽도록 함
  - 새 레이어 첫 프레임에 검은 배경이 보임 → 이미지 `onLoad` 후 전환 시작 + 준비 전에는 바깥 일반 `View`에서 정적으로 `opacity: 0`
  - 이 구조를 단순화하거나 되돌리면 깜빡임이 다시 생긴다. 수정 후 `blackdetect`로 반드시 검증.
- 세로 사진 스크롤: `src/utils/slideTiming.js`(`scrollDistanceFor` / `displayTimeSec` / `scrollPlan`) + `SlideViewer.jsx`의 `PortraitScrollImage`(단일 `withTiming`, 왕복 없음) + `useSlideshow.js`의 `scheduleNext`(표시 시간 자동 연장).
- 영상: `expo-video`. 짧은 영상은 반복, 긴 영상은 끝까지 재생.
- 사용 설명서: `src/components/ManualModal.jsx` (설정 → "설명서 보기", 초기 화면의 "설명서" 버튼). 기능이 바뀌면 문구도 같이 갱신.
- 서명 키: release도 `android/app/debug.keystore`로 서명. `android/`를 재생성해도 키 해시가 같아 덮어쓰기 설치가 된다. 다른 PC에서 빌드하면 키가 달라지니 백업 필요(`RELEASING.md`).
