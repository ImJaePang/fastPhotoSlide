# 릴리스 절차 (APK 배포)

APK는 저장소에 커밋하지 않고 **GitHub Releases**로만 배포합니다. (`*.apk`는 `.gitignore` 처리됨)

## 원칙

- 릴리스는 **사용자가 요청할 때만** 진행합니다. 요청 없이 빌드/업로드하지 않습니다.
- 의미 있는 변경(기능 추가, 주요 버그 수정)이 쌓이면 Claude가 "릴리스를 올릴까요?"라고 **물어보기만** 합니다.
- 버전은 [SemVer](https://semver.org/lang/ko/)를 따릅니다: 기능 추가 → minor, 버그 수정 → patch, 호환성 깨짐 → major.
- 푸시/릴리스 생성처럼 외부에 공개되는 작업은 진행 전에 버전과 릴리스 노트를 사용자에게 확인받습니다.

## 절차

1. **변경 내역 확인**
   ```bash
   git describe --tags --abbrev=0          # 직전 릴리스 태그
   git log <직전태그>..HEAD --oneline       # 이번에 포함될 변경
   ```
2. **버전 결정** → 사용자 확인
3. **버전 올리기**
   - `app.json`: `expo.version`, `expo.android.versionCode`(릴리스마다 정수 +1) 수정
   - `android/` 폴더는 생성물이라 자동 반영되지 않으므로 `android/app/build.gradle`의 `versionCode`, `versionName`도 같은 값으로 맞춥니다. (또는 `npx expo prebuild --platform android`)
4. **커밋 & 푸시**: `chore: vX.Y.Z 버전 갱신`
5. **빌드** (JDK 21, `ANDROID_HOME` 필요)
   ```bash
   cd android
   ./gradlew app:assembleRelease          # 결과: app/build/outputs/apk/release/app-release.apk
   ```
6. **검증**
   ```bash
   apksigner verify --print-certs app/build/outputs/apk/release/app-release.apk
   adb install -r app/build/outputs/apk/release/app-release.apk   # 실기기 설치 확인 (선택)
   ```
7. **릴리스 업로드**: 파일 이름은 `photoViewer.apk`로 맞춰 올립니다.
   ```bash
   cp app/build/outputs/apk/release/app-release.apk /임시경로/photoViewer.apk
   gh release create vX.Y.Z /임시경로/photoViewer.apk \
     --target master --title "vX.Y.Z - 한 줄 요약" --notes-file notes.md
   ```
8. **확인**: `gh release view vX.Y.Z` 로 태그와 첨부 파일 확인

## 릴리스 노트 템플릿

```markdown
## 변경 사항
- (사용자에게 보이는 변화 위주로 3~6줄)

## 설치
`photoViewer.apk`를 내려받아 설치하세요. (arm64-v8a / armeabi-v7a / x86 지원, 출처를 알 수 없는 앱 설치 허용 필요)
```

## 주의사항

- **서명 키**: 현재 release 빌드는 `android/app/debug.keystore`로 서명됩니다. 같은 키로 서명해야 기존 설치본 위에 업데이트됩니다. 이 파일은 `android/`와 함께 git에서 제외되므로 **다른 PC에서 빌드하면 키가 달라져 덮어쓰기 설치가 안 됩니다.** 키 파일을 별도로 백업해 두세요.
- **잘못 올렸을 때**: `gh release delete vX.Y.Z --cleanup-tag` 로 릴리스와 태그를 지우고 다시 올립니다.
- **히스토리 정리 이력**: v1.1.0 배포 시점에 과거 APK를 git 히스토리에서 제거했습니다. APK를 다시 커밋하지 마세요.
- v1.1.0 APK는 내부 버전이 `1.0.0` / `versionCode 1`로 빌드되었습니다. 다음 릴리스부터 3번 절차로 맞춥니다.
