# PhotoViewer (디지털 액자) - Claude 작업 지침

React Native + Expo(SDK 55) 안드로이드 디지털 액자 앱. 자세한 내용은 `README.md` 참고.

## 릴리스

- APK 배포는 반드시 `RELEASING.md` 절차를 따릅니다. APK는 저장소에 커밋하지 않습니다(`*.apk` ignore).
- **릴리스는 사용자가 요청할 때만** 빌드/업로드합니다. 의미 있는 변경이 쌓였다면 "릴리스를 올릴까요?"라고 한 번만 물어봅니다.
- 푸시, 태그, 릴리스 생성 전에는 버전과 릴리스 노트를 사용자에게 확인받습니다.

## 개발 메모

- `android/` 폴더는 `expo prebuild` 산출물이라 git에서 제외됩니다. 실기기 테스트는 `cd android && ./gradlew app:installRelease -PreactNativeArchitectures=arm64-v8a` (JDK 21, `ANDROID_HOME` 필요)
- 테스트 기기 화면이 꺼져 있거나 잠겨 있으면 앱이 검은 화면으로 보입니다. `adb shell dumpsys window | grep isKeyguardShowing`로 먼저 확인하세요.
- 설정 패널은 10초 조작이 없으면 자동으로 닫힙니다. adb로 UI를 테스트할 때는 "열기 → 조작 → 캡처"를 한 번의 명령으로 이어서 실행하세요.
- 테마 색상은 `src/theme/themes.js`, 공용 UI 컴포넌트는 `src/components/ui/index.jsx`에 있습니다. 새 화면은 `useTheme()`의 `colors`를 사용하세요.
