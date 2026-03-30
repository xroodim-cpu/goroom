# 구롬 (GoRoom) v2

카카오톡 스타일 공유 캘린더 & 피드 앱

## 🗂 프로젝트 구조

```
goroom/
├── index.html              # HTML 진입점 (PWA 지원)
├── package.json            # 의존성 + 빌드 스크립트
├── vite.config.js          # Vite 빌드 설정
├── vercel.json             # Vercel SPA 라우팅
├── capacitor.config.json   # 모바일 앱 설정 (Capacitor)
├── electron/
│   └── main.js             # 데스크톱 앱 진입점 (Electron)
├── public/
│   ├── manifest.json       # PWA 매니페스트
│   ├── sw.js               # Service Worker
│   ├── icon-192.png        # 앱 아이콘 (추가 필요)
│   └── icon-512.png        # 앱 아이콘 (추가 필요)
└── src/
    ├── main.jsx            # React 진입점
    ├── supabase.js         # Supabase 클라이언트
    └── App.jsx             # 메인 앱 (전체 UI + 로직)
```

## 🚀 로컬 실행

```bash
npm install
npm run dev
# http://localhost:3000 에서 확인
```

## 🌐 Vercel 배포

1. GitHub에 push
2. Vercel에서 Import → Framework: Vite 선택
3. 자동 빌드 & 배포

## 📱 모바일 앱 빌드 (Capacitor)

```bash
# 의존성 설치
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android @capacitor/ios

# 플랫폼 추가
npm run app:add:android   # 또는 app:add:ios

# 빌드 & 동기화
npm run app:sync

# Android Studio / Xcode에서 열기
npm run app:open:android  # 또는 app:open:ios
```

## 🖥 데스크톱 프로그램 빌드 (Electron)

```bash
# 의존성 설치
npm install --save-dev electron electron-builder

# 개발 모드 (Vite 서버 먼저 실행 후)
npm run dev  # 터미널 1
npm run desktop:dev  # 터미널 2

# 프로덕션 빌드
npm run desktop:build
```

## 📱 PWA (모바일 앱처럼 사용)

Vercel 배포 후:
- 모바일 브라우저에서 사이트 접속
- "홈 화면에 추가" 선택
- 네이티브 앱처럼 동작

## 🔗 연동 정보

- **Supabase**: https://dyotbojxtcqhcmrefofb.supabase.co
- **GitHub**: xroodim-cpu/goroom
- **Vercel**: 자동 배포 연결됨

## ✅ 완성된 기능

### 친구
- 친구 목록 (검색, 즐겨찾기, 생일, 업데이트한 친구)
- 친구 추가 (코드 방식)
- 카카오 스타일 프로필 (배경+사진+이름+상태메시지)
- 인라인 프로필 편집 (배경/사진/이름/상태메시지)
- 즐겨찾기 별표

### 캘린더
- 캘린더방 생성/설정/삭제
- 멤버 초대/관리
- 기능 ON/OFF (캘린더/메모/할일/피드/가계부/알림)
- 기능별 세부 설정 (카테고리 관리 등)

### 스케줄
- 카테고리 선택 (캘린더 설정에서 관리)
- 날짜/시간 + 반복 (토글, 매일/매주/매월/매년/직접)
- 메모, 할일 체크리스트, D-day, 알람, 가계부
- 멀티 이미지 첨부
- 목록에 이미지 썸네일 (+N 표시)
- 클릭 시 상세보기

### 피드 (구 일기장)
- Threads 스타일 피드 디자인
- 기분/날씨 이모지 선택
- 멀티 이미지 업로드 + 슬라이더
- 이미지 클릭 → 풀스크린 뷰어
- 좋아요 ❤️ / 댓글 💬 / 공유 ✈️
- 댓글 스레드 (아바타+닉네임+시간+텍스트)
- 년도 포함 일시 표시

### 메모
- 카드형/리스트형 전환
- 검색, 고정, 삭제

### 할일
- 작성 일시, 완료 일시 표시
- 멀티멤버 시 작성자/완료자 표시

### 가계부
- 수입/지출/잔액 요약
- 카테고리별 분류

### 반응형
- 모바일 (480px↓): 풀스크린 페이지 스택
- 태블릿 (481~1024px): 2패널 (사이드바 320px)
- 데스크톱 (1025px↑): 2패널 (사이드바 380px)

## 📝 다음 작업 (새 대화에서)

1. Supabase 인증 연동 (로그인/회원가입)
2. Supabase 데이터 CRUD 연동
3. GitHub push → Vercel 자동 배포
4. 푸시 알림 연동
5. Electron 데스크톱 빌드
