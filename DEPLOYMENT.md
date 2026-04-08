# GoRoom Mobile App - 배포 가이드

## 개요

GoRoom 모바일 앱은 GitHub Actions를 통해 자동으로 빌드되고, Google Play Store에 배포될 수 있습니다.

## 배포 프로세스

### 1. 개발 환경

**요구사항:**
- Node.js 18+
- Android SDK (API 34)
- Java 17+
- Capacitor CLI 8.3.0

**로컬 빌드:**
```bash
# 웹 빌드
npm run build

# Capacitor 동기화
npx cap sync

# Android Debug APK 빌드
cd android && ./gradlew assembleDebug

# Android Release AAB 빌드 (Play Store용)
cd android && ./gradlew bundleRelease
```

### 2. 자동 배포 (GitHub Actions)

**작동 방식:**
- `main` 브랜치에 push하면 자동으로 빌드 시작
- 빌드 완료 후 APK/AAB 생성
- Release 버전은 GitHub Release에 업로드
- 설정되어 있으면 Play Store Internal Testing 트랙에 배포

**설정 필요:**
1. Google Play Console 등록 (자세한 방법은 아래 참고)
2. GitHub Secrets 설정:
   - `PLAY_STORE_SERVICE_ACCOUNT_JSON`: Google Play Service Account JSON

### 3. Google Play Store 설정

#### 3.1 Google Play Developer Account 등록
- Google Play Console (https://play.google.com/console)에서 개발자 계정 등록
- $25 등록비 지불
- 개발자 계정 설정 완료

#### 3.2 새 앱 생성
1. Play Console에서 "앱 만들기"
2. 앱 이름: "고룸"
3. 카테고리: 생산성/달력
4. 라이센스: Google Play SDK License Agreement

#### 3.3 앱 정보 작성
- **앱 이름**: 고룸 (GoRoom)
- **짧은 설명**: 친구들과 함께 일정을 관리하고 공유하세요
- **설명**: 캘린더, 메모, 일정, 다이어리 등을 팀 멤버와 함께 관리
- **스크린샷**: 최소 2개 (Play Store 규정)
- **프리뷰 비디오**: 선택사항
- **앱 아이콘**: 512x512px (투명 배경)
- **배너 이미지**: 1024x500px

#### 3.4 개인정보보호정책 및 이용약관
- 개인정보보호정책 URL 등록
- 이용약관 URL 등록
- 문의 이메일 주소

#### 3.5 콘텐츠 등급
- 설문지 작성 (약 5분)
- 대부분의 앱은 "Everyone" 등급

#### 3.6 Service Account 생성 (자동 배포용)
1. Google Cloud Console에서 새 프로젝트 생성
2. "Service Account" 생성
3. 역할: "Editor"
4. JSON 키 다운로드
5. GitHub Secrets에 `PLAY_STORE_SERVICE_ACCOUNT_JSON` 추가

```bash
# 또는 GitHub CLI로
gh secret set PLAY_STORE_SERVICE_ACCOUNT_JSON < ~/Downloads/service-account.json
```

### 4. 배포 버전 관리

**버전 전략:**
- `package.json`의 `version` 필드로 관리
- 형식: `MAJOR.MINOR.PATCH` (예: 2.1.0)

**버전 업데이트:**
```bash
# package.json 수정
"version": "2.1.0"

# 또는 npm 명령어
npm version minor
```

**버전 적용:**
- Git에 커밋하면 자동으로 이 버전으로 APK/AAB 생성

### 5. Play Store 배포 단계

#### Stage 1: Internal Testing (내부 테스트)
```bash
# GitHub Actions 설정에서 track: internal로 설정
# main 브랜치에 push하면 자동으로 Internal Testing에 배포
```

#### Stage 2: Closed Testing (폐쇄 테스트)
1. Play Console에서 폐쇄 테스트 그룹 생성
2. 테스터 10-50명 초대
3. 피드백 수집

#### Stage 3: Open Testing (공개 테스트)
1. Play Console에서 공개 테스트 시작
2. 최소 20명의 사용자 필요
3. 최소 1-2주 테스트 기간

#### Stage 4: Production (프로덕션)
1. Play Console에서 프로덕션 배포 요청
2. Google 심사 (1-3일)
3. 승인 후 Google Play에 공개

### 6. 배포 체크리스트

배포 전 다음을 확인하세요:

- [ ] 모든 기능 테스트 완료
- [ ] 프로덕션 빌드 성공 (5.9MB 이하)
- [ ] 스크린샷 준비 (최소 2개)
- [ ] 앱 설명 작성 완료
- [ ] 개인정보보호정책/이용약관 URL 설정
- [ ] 앱 아이콘/배너 이미지 준비
- [ ] Google Play Console 설정 완료
- [ ] GitHub Secrets 설정 완료
- [ ] Version 업데이트 및 커밋

### 7. 모니터링 및 업데이트

**배포 후:**
1. Play Console에서 설치/삭제 통계 모니터링
2. 사용자 평점 및 리뷰 확인
3. 크래시 리포트 모니터링 (Firebase 통합 권장)

**업데이트:**
```bash
# 버그 수정 또는 기능 추가 후
npm version patch  # 2.1.0 → 2.1.1
git push origin main  # 자동으로 배포 시작
```

## 트러블슈팅

### 빌드 실패
- Java/Android SDK 버전 확인
- `./gradlew clean` 실행
- Capacitor 다시 동기화: `npx cap sync`

### Play Store 배포 실패
- Service Account 권한 확인
- 앱 패키지명이 설정과 일치하는지 확인
- Play Console에서 앱 정보 작성 완료 확인

### APK/AAB 서명 오류
- `android/app/build.gradle`에서 서명 설정 확인
- 키스토어 파일 존재 여부 확인

## 추가 정보

- [Capacitor 배포 가이드](https://capacitorjs.com/docs/guides/deploying-to-app-stores)
- [Google Play Console 도움말](https://support.google.com/googleplay/android-developer)
- [GitHub Actions 문서](https://docs.github.com/en/actions)

---

**마지막 업데이트**: 2026-04-08
**상태**: 자동 배포 준비 완료
