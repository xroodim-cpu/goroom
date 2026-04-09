import { useNavigate } from 'react-router-dom';

export default function TermsOfService() {
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
        .terms-body ul,ol{padding-left:20px;margin:8px 0}
        .terms-body li{margin:4px 0;color:#555568}
        .terms-body table{width:100%;border-collapse:collapse;margin:12px 0}
        .terms-body td,.terms-body th{border:1px solid #E0E0EA;padding:8px 12px;font-size:13px;text-align:left}
        .terms-body th{background:#F6F7F9;font-weight:600}
      `}} />
      <div className="terms-wrap">
        <div className="terms-hdr">
          <button className="terms-back" onClick={() => navigate('/')}>←</button>
          <div className="terms-hdr-title">이용약관</div>
        </div>
        <div className="terms-body">
          <h1>이용약관</h1>
          <div className="date">시행일: 2026년 4월 9일</div>

          <h2>제1조 (목적)</h2>
          <p>본 약관은 ROODIM(이하 "회사")이 제공하는 고룸(GoRoom) 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.</p>

          <h2>제2조 (정의)</h2>
          <ul>
            <li><strong>"서비스"</strong>란 회사가 제공하는 캘린더, 가계부, 메모, 일기, 공유 방 등의 기능을 포함하는 웹, 모바일 앱, 데스크톱 애플리케이션을 의미합니다.</li>
            <li><strong>"이용자"</strong>란 본 약관에 따라 회사가 제공하는 서비스를 이용하는 자를 의미합니다.</li>
            <li><strong>"회원"</strong>이란 서비스에 회원가입을 하고 이용자 계정을 부여받은 자를 의미합니다.</li>
            <li><strong>"콘텐츠"</strong>란 이용자가 서비스에 게시한 일정, 메모, 이미지, 가계부 기록 등을 의미합니다.</li>
          </ul>

          <h2>제3조 (약관의 효력 및 변경)</h2>
          <ul>
            <li>본 약관은 서비스를 이용하고자 하는 모든 이용자에 대해 그 효력이 발생합니다.</li>
            <li>회사는 필요한 경우 약관을 변경할 수 있으며, 변경된 약관은 서비스 내 공지사항을 통해 공지합니다.</li>
            <li>변경된 약관에 동의하지 않는 이용자는 서비스 이용을 중단하고 탈퇴할 수 있습니다.</li>
          </ul>

          <h2>제4조 (회원가입 및 계정)</h2>
          <ul>
            <li>서비스 이용을 위해 이메일, Google, 카카오 계정을 통해 회원가입할 수 있습니다.</li>
            <li>회원은 정확하고 최신의 정보를 제공해야 하며, 타인의 정보를 도용해서는 안 됩니다.</li>
            <li>계정의 관리 책임은 회원에게 있으며, 계정 정보의 유출로 인한 불이익에 대해 회사는 책임지지 않습니다.</li>
          </ul>

          <h2>제5조 (서비스의 제공)</h2>
          <p>회사는 다음과 같은 서비스를 제공합니다.</p>
          <ul>
            <li>캘린더 및 일정 관리 (생성, 수정, 삭제, 공유)</li>
            <li>가계부 기록 및 관리</li>
            <li>메모 및 일기 작성</li>
            <li>할 일(투두) 관리</li>
            <li>공유 방(캘린더 룸) 생성 및 멤버 초대</li>
            <li>파일 및 이미지 업로드/저장</li>
            <li>알림 서비스 (일정 알림, 친구 요청 등)</li>
            <li>멀티 플랫폼 동기화 (웹, Android, Windows)</li>
          </ul>

          <h2>제6조 (서비스 요금)</h2>
          <table>
            <thead>
              <tr><th>요금제</th><th>저장용량</th><th>월 요금</th></tr>
            </thead>
            <tbody>
              <tr><td>Free</td><td>1GB</td><td>무료</td></tr>
              <tr><td>Standard</td><td>20GB</td><td>3,900원</td></tr>
              <tr><td>Pro</td><td>50GB</td><td>7,900원</td></tr>
              <tr><td>Business</td><td>100GB</td><td>12,900원</td></tr>
            </tbody>
          </table>
          <ul>
            <li>유료 서비스는 결제 후 즉시 이용 가능하며, 연 결제 시 할인이 적용됩니다.</li>
            <li>결제 취소 및 환불은 관련 법령에 따릅니다.</li>
          </ul>

          <h2>제7조 (이용자의 의무)</h2>
          <ul>
            <li>이용자는 서비스를 이용함에 있어 관련 법령, 본 약관, 서비스 이용 안내 등을 준수해야 합니다.</li>
            <li>이용자는 다음 행위를 해서는 안 됩니다.
              <ul>
                <li>타인의 개인정보를 무단으로 수집, 이용하는 행위</li>
                <li>서비스의 안정적 운영을 방해하는 행위</li>
                <li>불법적이거나 부당한 목적으로 서비스를 이용하는 행위</li>
                <li>저작권 등 타인의 지적재산권을 침해하는 행위</li>
                <li>음란, 폭력적, 혐오적 콘텐츠를 게시하는 행위</li>
              </ul>
            </li>
          </ul>

          <h2>제8조 (콘텐츠의 권리 및 관리)</h2>
          <ul>
            <li>이용자가 서비스에 게시한 콘텐츠의 저작권은 이용자에게 있습니다.</li>
            <li>회사는 서비스 운영, 개선, 홍보 목적으로 이용자의 콘텐츠를 사용할 수 있습니다.</li>
            <li>이용자가 공유 방에 게시한 콘텐츠는 해당 방의 다른 멤버에게 공유됩니다.</li>
            <li>회사는 관련 법령에 위반되는 콘텐츠를 사전 통지 없이 삭제할 수 있습니다.</li>
          </ul>

          <h2>제9조 (서비스의 중단)</h2>
          <ul>
            <li>회사는 시스템 점검, 장비 교체 등의 사유로 서비스 제공을 일시적으로 중단할 수 있습니다.</li>
            <li>불가항력적 사유(천재지변, 전쟁, 정전 등)로 인해 서비스가 중단되는 경우, 회사는 책임을 지지 않습니다.</li>
          </ul>

          <h2>제10조 (계약 해지 및 탈퇴)</h2>
          <ul>
            <li>회원은 언제든지 서비스 내 설정 메뉴를 통해 탈퇴할 수 있습니다.</li>
            <li>탈퇴 시 회원의 개인정보 및 콘텐츠는 즉시 삭제됩니다. 단, 관련 법령에 따라 보존이 필요한 정보는 해당 기간 동안 보관됩니다.</li>
            <li>회사는 이용자가 본 약관을 위반한 경우 사전 통지 후 서비스 이용을 제한하거나 계약을 해지할 수 있습니다.</li>
          </ul>

          <h2>제11조 (면책조항)</h2>
          <ul>
            <li>회사는 무료로 제공하는 서비스에 대해서는 별도의 보증을 하지 않습니다.</li>
            <li>이용자 간 또는 이용자와 제3자 간 분쟁에 대해 회사는 개입하거나 책임을 지지 않습니다.</li>
            <li>회사는 이용자가 서비스에 게시한 콘텐츠의 정확성, 신뢰성에 대해 책임지지 않습니다.</li>
          </ul>

          <h2>제12조 (손해배상)</h2>
          <p>회사의 고의 또는 과실로 인해 이용자에게 손해가 발생한 경우, 회사는 관련 법령이 정하는 범위 내에서 손해를 배상합니다.</p>

          <h2>제13조 (분쟁 해결)</h2>
          <ul>
            <li>본 약관에 관한 분쟁은 대한민국 법을 준거법으로 합니다.</li>
            <li>서비스 이용과 관련하여 분쟁이 발생한 경우, 회사의 소재지를 관할하는 법원을 전속관할법원으로 합니다.</li>
          </ul>

          <h2>부칙</h2>
          <p>본 약관은 2026년 4월 9일부터 시행됩니다.</p>
        </div>
      </div>
    </>
  );
}
