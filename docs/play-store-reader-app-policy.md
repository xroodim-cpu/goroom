# 고룸 — Google Play "Reader App" 예외 정책 대응 가이드

**작성일**: 2026-04-09
**목적**: Google Play Store에 Android 앱 등록 시, Google Play Billing 대신 자체 결제(Toss)를 사용할 수 있도록 Reader App 예외 조항을 활용하는 절차 문서화.

---

## 1. 배경 — 왜 Reader App인가?

Google Play 정책(2022 업데이트)에 따르면 Android 앱 내부에서 디지털 굿즈/서비스를 판매할 경우 원칙적으로 **Google Play Billing** 을 사용해야 한다. 수수료는 15~30%.

그러나 **"Reader App" 예외 조항**이 존재한다:
- 사용자가 **앱 외부에서도 소비할 수 있는 디지털 콘텐츠**(예: 클라우드 파일, 책, 음악, 동영상, 뉴스, 클라우드 저장소, 캘린더)를 제공하는 앱
- Netflix, Spotify, Kindle, Dropbox, Evernote 등이 이 예외를 활용
- 자체 결제 시스템(Stripe, Toss, PayPal 등) 사용 허용

**고룸은 Reader App 자격이 있음**:
- 웹(https://goroom.kr), Android 앱, Electron 데스크톱 앱에서 동일한 캘린더/파일에 접근
- Wasabi S3 클라우드 저장소 기반 → 앱 외부에서도 소비 가능
- 용량 구독 서비스 → Dropbox/Google One과 동일한 카테고리

---

## 2. Play Console에서 Reader App 신고 절차

### 2-1. External Offers Program 참여
1. https://play.google.com/console → GoRoom 앱 선택
2. **결제 > External offers program** 메뉴 진입
3. "Reader app" 카테고리 선택
4. 앱 설명:
   - **짧은 설명**: "고룸은 개인/그룹 캘린더와 파일을 웹·앱·데스크톱에서 동일하게 이용할 수 있는 클라우드 기반 서비스입니다. 사용자는 웹에서도 동일한 구독을 이용할 수 있습니다."
   - **Reader App 자격 증명**: 웹(https://goroom.kr)에서 동일한 구독/기능 제공 스크린샷 첨부

### 2-2. 구독 결제 UX 요건
Reader App 예외를 적용받으려면 앱 내부에서도 다음 중 **하나**를 준수해야 함:
- **Option A**: 앱 내에서 자체 결제 시스템(Toss 등) 호출 가능. 단, Google Play Billing을 병행해서 제공할 필요 없음.
- **Option B**: 앱 내에서는 결제 버튼을 숨기고, "웹사이트에서 구독해주세요" 안내만 표시(Spotify 방식).

고룸은 **Option A** 를 선택 (사용자 경험 우선):
- Android 앱 안에서 "구독하기" 버튼 클릭 → Capacitor Browser(Chrome Custom Tab)로 `https://goroom.kr/billing/start` 열기
- Toss 결제 진행 → 성공 시 `https://goroom.kr/payment/success` 리다이렉트 → Deep Link(`goroom://payment/success`)로 앱에 복귀

---

## 3. 앱 심사 제출 시 체크리스트

### 3-1. Store listing (앱 설명)
- [ ] 앱 카테고리: "생산성" 또는 "비즈니스"
- [ ] 앱 설명에 "웹/데스크톱에서도 동일한 캘린더 접근 가능" 문구 포함
- [ ] 스크린샷에 "웹사이트 https://goroom.kr" 표기

### 3-2. Data safety
- [ ] 결제 카드 정보 수집 안 함 (Toss가 처리)
- [ ] 사용자 데이터 암호화 전송 (HTTPS)

### 3-3. Content rating
- [ ] 전체이용가 (콘텐츠 타입: 생산성)

### 3-4. Target audience
- [ ] 만 18세 이상 (성인 결제 권장)

### 3-5. App content > Financial features
- [ ] "Users can make purchases within this app" → **No** (앱 내부에서 직접 결제하지 않고 외부 브라우저로 이동)
- [ ] 또는 Reader App 예외 선언

---

## 4. 심사 거부 시 Plan B

만약 Reader App 예외가 거부될 경우, 다음 단계를 순서대로 시도:

### Plan B-1: 앱 내부 결제 UI 완전 숨김 (Spotify 방식)
- Android 앱에서 "구독하기" 버튼 **비활성화**
- "고룸 요금제는 https://goroom.kr 에서 구독해주세요" 안내 문구만 표시
- 이 방식은 Google Play 정책에 100% 부합 (Spotify가 사용)

**구현**: `src/lib/billing.js` 의 `startSubscription()` 함수 내부
```js
if (platform === 'android') {
  alert('구독은 웹사이트(https://goroom.kr)에서 진행해주세요');
  return;
}
```

### Plan B-2: Google Play Billing 병행 구현
- Android 앱에서는 Google Play Billing 사용
- 웹/데스크톱에서는 Toss 사용
- `cordova-plugin-purchase` 재설치 + Edge Function `verify-google-subscription` 복구
- 수수료 15~30% 발생하지만 정책 100% 준수
- 이전 세션에서 구축했던 인프라 재사용 가능

---

## 5. Toss 결제 정책 준수 사항

Toss는 Google Play 외부 결제이므로 다음 요건을 준수해야 함:
- [ ] **PG사 라이선스 있음** — Toss Payments는 한국 전자금융거래법 등록 업체
- [ ] **영수증 제공** — Toss가 자동 발행
- [ ] **환불 정책 명시** — 고룸 이용약관에 포함 필수
- [ ] **결제 완료 이메일 발송** — Toss 웹훅 연동 권장 (이번 스프린트 범위 외)

---

## 6. 현재 진행 상황 체크리스트

- [x] Toss 결제 코드 웹/데스크톱에서 동작 확인
- [x] Android 앱 코드 Capacitor Browser 경로로 Toss 호출하도록 구현
- [ ] Android 앱 Play Store 등록 (사용자 작업 — Google Play Developer Account $25 필요)
- [ ] Reader App 예외 신청 (Play Console)
- [ ] 앱 심사 제출 → 통과
- [ ] 실기기에서 결제 E2E 테스트
- [ ] Deep Link intent filter (AndroidManifest.xml) 설정 확인

---

## 7. 참고 자료

- Google Play Policy Center — In-app purchases: https://support.google.com/googleplay/android-developer/answer/10985220
- Reader app exemption: https://support.google.com/googleplay/android-developer/answer/12925710
- Toss Payments Developer Docs: https://docs.tosspayments.com/
- Capacitor Browser Plugin: https://capacitorjs.com/docs/apis/browser
