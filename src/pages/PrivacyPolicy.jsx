import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .terms-wrap{min-height:100vh;font-family:'KakaoSmallFont',-apple-system,BlinkMacSystemFont,sans-serif;color:#1B1B2F;background:#fff;overflow-y:auto}
        .terms-hdr{position:sticky;top:0;z-index:10;background:rgba(255,255,255,.95);backdrop-filter:blur(16px);border-bottom:1px solid #E0E0EA;padding:0 24px;height:64px;display:flex;align-items:center;gap:12px}
        .terms-back{background:none;border:none;cursor:pointer;font-size:20px;padding:4px;display:flex;color:#1B1B2F}
        .terms-hdr-title{font-size:16px;font-weight:700}
        .terms-body{max-width:720px;margin:0 auto;padding:32px 24px 60px;line-height:1.8;font-size:14px}
        .terms-body h1{font-size:28px;font-weight:800;margin-bottom:8px;color:#1B1B2F}
        .terms-body .date{font-size:13px;color:#8E8E9F;margin-bottom:32px}
        .terms-body h2{font-size:18px;font-weight:700;margin:32px 0 12px;color:#1B1B2F}
        .terms-body p{margin:8px 0;color:#555568}
        .terms-body ul{padding-left:20px;margin:8px 0}
        .terms-body li{margin:4px 0;color:#555568}
        .terms-body table{width:100%;border-collapse:collapse;margin:12px 0}
        .terms-body td,.terms-body th{border:1px solid #E0E0EA;padding:8px 12px;font-size:13px;text-align:left}
        .terms-body th{background:#F6F7F9;font-weight:600}
      `}} />
      <div className="terms-wrap">
        <div className="terms-hdr">
          <button className="terms-back" onClick={() => navigate('/')}>←</button>
          <div className="terms-hdr-title">개인정보처리방침</div>
        </div>
        <div className="terms-body">
          <h1>개인정보처리방침</h1>
          <div className="date">시행일: 2026년 4월 8일</div>

          <h2>1. 개인정보의 처리 목적</h2>
          <p>GoRoom(이하 "서비스")은 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.</p>
          <ul>
            <li>회원 가입 및 관리: 회원 가입 의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증, 회원자격 유지·관리</li>
            <li>서비스 제공: 캘린더/일정 관리, 가계부, 메모, 공유 방 기능 제공</li>
            <li>알림 서비스: 일정 알림, 친구 요청 알림 등 서비스 관련 알림 발송</li>
          </ul>

          <h2>2. 수집하는 개인정보 항목</h2>
          <table>
            <thead>
              <tr><th>수집 방법</th><th>수집 항목</th><th>수집 목적</th></tr>
            </thead>
            <tbody>
              <tr><td>이메일 회원가입</td><td>이메일 주소, 비밀번호(암호화), 닉네임</td><td>회원 식별 및 서비스 제공</td></tr>
              <tr><td>Google OAuth 로그인</td><td>이메일 주소, 이름, 프로필 이미지</td><td>회원 식별 및 서비스 제공</td></tr>
              <tr><td>카카오 OAuth 로그인</td><td>닉네임, 프로필 이미지</td><td>회원 식별 및 서비스 제공</td></tr>
              <tr><td>서비스 이용 과정</td><td>일정 정보, 메모 내용, 가계부 기록, 업로드 이미지</td><td>서비스 기능 제공</td></tr>
            </tbody>
          </table>

          <h2>3. 개인정보의 보유 및 이용기간</h2>
          <p>이용자의 개인정보는 원칙적으로 개인정보의 수집 및 이용 목적이 달성되면 지체 없이 파기합니다.</p>
          <ul>
            <li>회원 탈퇴 시: 즉시 파기</li>
            <li>휴면 계정: 1년 이상 서비스 미이용 시 별도 분리 보관 후 파기</li>
            <li>관련 법령에 따른 보존: 전자상거래법에 따른 계약 또는 청약철회 등에 관한 기록(5년), 대금결제 및 재화 등의 공급에 관한 기록(5년), 소비자 불만 또는 분쟁 처리에 관한 기록(3년)</li>
          </ul>

          <h2>4. 개인정보의 제3자 제공</h2>
          <p>서비스는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다.</p>
          <ul>
            <li>이용자가 사전에 동의한 경우</li>
            <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
          </ul>

          <h2>5. 개인정보 처리 위탁</h2>
          <p>서비스는 원활한 서비스 제공을 위해 다음과 같이 개인정보 처리 업무를 위탁하고 있습니다.</p>
          <table>
            <thead>
              <tr><th>수탁업체</th><th>위탁 업무</th><th>보유기간</th></tr>
            </thead>
            <tbody>
              <tr><td>Supabase Inc.</td><td>사용자 인증, 데이터베이스 관리</td><td>회원 탈퇴 시 또는 위탁 계약 종료 시까지</td></tr>
              <tr><td>Wasabi Technologies</td><td>이미지 파일 저장</td><td>회원 탈퇴 시 또는 위탁 계약 종료 시까지</td></tr>
              <tr><td>Vercel Inc.</td><td>웹 서비스 호스팅</td><td>서비스 운영 기간</td></tr>
            </tbody>
          </table>

          <h2>6. 정보주체의 권리·의무 및 행사방법</h2>
          <p>이용자는 개인정보주체로서 다음과 같은 권리를 행사할 수 있습니다.</p>
          <ul>
            <li>개인정보 열람 요구</li>
            <li>오류 등이 있을 경우 정정 요구</li>
            <li>삭제 요구</li>
            <li>처리 정지 요구</li>
          </ul>
          <p>위 권리 행사는 서비스 내 설정 메뉴 또는 아래 연락처를 통해 가능합니다.</p>

          <h2>7. 개인정보의 파기절차 및 방법</h2>
          <ul>
            <li><strong>파기절차:</strong> 이용자가 입력한 정보는 목적 달성 후 별도의 DB에 옮겨져(종이의 경우 별도의 서류) 내부 방침 및 기타 관련 법령에 따라 일정기간 저장된 후 혹은 즉시 파기됩니다.</li>
            <li><strong>파기방법:</strong> 전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제합니다.</li>
          </ul>

          <h2>8. 개인정보의 안전성 확보조치</h2>
          <ul>
            <li>비밀번호 암호화 저장</li>
            <li>SSL/TLS 암호화 통신</li>
            <li>접근 권한 관리 및 제한</li>
            <li>개인정보 접근 기록 보관</li>
          </ul>

          <h2>9. 개인정보 보호책임자</h2>
          <p>서비스의 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만 처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.</p>
          <ul>
            <li>책임자: GoRoom 운영팀</li>
            <li>연락처: help@goroom.kr</li>
          </ul>

          <h2>10. 개인정보처리방침 변경</h2>
          <p>이 개인정보처리방침은 2026년 4월 8일부터 적용됩니다. 변경 사항이 있을 경우 서비스 내 공지사항을 통해 안내하겠습니다.</p>
        </div>
      </div>
    </>
  );
}
