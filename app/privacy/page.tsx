import type { Metadata } from "next";
import { InnerHeader, SiteFooter } from "../components/SiteChrome";

export const metadata:Metadata={title:"개인정보처리방침",description:"퇴직생활연구소의 개인정보 처리와 외부 서비스 이용 원칙입니다.",alternates:{canonical:"/privacy"}};

export default function Privacy(){return <><InnerHeader path="/privacy" eyebrow="PRIVACY" title="개인정보처리방침" description="시행일: 2026년 8월 14일"/><main className="content-shell article-copy policy-copy">
  <h2>운영 주체와 적용 범위</h2><p>퇴직생활연구소는 애드블스가 운영합니다. 이 방침은 adbles.com에서 제공하는 공개 콘텐츠와 계산 도구에 적용됩니다.</p>
  <h2>현재 사이트가 직접 저장하는 정보</h2><p>로그인하지 않고 공개 글을 읽거나 생활비·퇴직금 계산기를 사용하는 과정에서 이름, 이메일 또는 입력한 금액을 사이트 데이터베이스에 저장하지 않습니다. 계산기에 입력한 숫자는 방문자의 브라우저 안에서 처리됩니다.</p>
  <h2>호스팅과 보안 기록</h2><p>사이트 제공과 보안을 위해 호스팅 사업자가 IP 주소, 브라우저·기기 정보, 요청 시각과 오류 기록 등 통상적인 기술 로그를 처리할 수 있습니다. 이러한 정보는 서비스 안정성, 장애 대응과 부정 사용 방지 목적으로 제공자의 정책에 따라 관리됩니다.</p>
  <h2>Google 광고와 쿠키</h2><p>사이트는 Google AdSense 도입과 사이트 심사를 준비하고 있습니다. Google을 포함한 제3자 사업자는 광고 제공과 측정을 위해 방문자의 브라우저에 쿠키를 저장하거나 기존 쿠키를 읽고, 웹 비콘·IP 주소 또는 기타 식별자를 사용할 수 있습니다. Google은 방문자가 이 사이트 또는 다른 사이트를 방문한 기록을 바탕으로 광고를 제공할 수 있습니다.</p>
  <h2>동의 안내와 맞춤 광고 선택</h2><p>광고가 활성화되면 관련 법령과 Google 정책상 필요한 지역의 방문자에게 Google이 지원하는 동의 안내를 제공하도록 설정합니다. 방문자는 <a href="https://adssettings.google.com/" target="_blank" rel="noreferrer">Google 광고 설정</a>에서 맞춤 광고 사용 여부를 관리할 수 있습니다. Google이 파트너 사이트의 정보를 사용하는 방식은 <a href="https://policies.google.com/technologies/partner-sites?hl=ko" target="_blank" rel="noreferrer">Google 파트너 사이트의 데이터 사용 안내</a>에서 확인할 수 있습니다.</p>
  <h2>방문 통계(Google Analytics)</h2><p>사이트는 방문 통계와 콘텐츠 개선을 위해 Google Analytics(GA4)를 사용할 수 있습니다. 쿠키와 IP 주소 등 기기 식별 정보가 수집될 수 있으며, 방문자는 브라우저 설정 또는 <a href="https://tools.google.com/dlpage/gaoptout" rel="noopener noreferrer" target="_blank">Google Analytics 차단 부가기능</a>으로 수집을 거부할 수 있습니다.</p>
  <h2>외부 링크와 영상</h2><p>공공기관 원문, 위키백과와 YouTube 영상 등 외부 서비스로 이동하거나 영상을 재생하면 해당 서비스의 개인정보처리방침과 쿠키 정책이 적용될 수 있습니다. 영상은 가능한 경우 개인정보 보호 강화 주소를 사용하고 자동 재생하지 않습니다.</p>
  <h2>문의와 권리 행사</h2><p>개인정보 처리, 쿠키 또는 이 방침에 관한 문의는 <a href="mailto:master@adbles.com">master@adbles.com</a>으로 보낼 수 있습니다. 문의 내용에 불필요한 주민등록번호, 계좌번호, 건강정보 등 민감한 정보는 포함하지 마세요.</p>
  <h2>방침 변경</h2><p>새로운 분석·광고·회원 기능을 도입하거나 처리 항목이 달라지면 이 페이지의 내용과 시행일을 갱신합니다. 중요한 변경은 적용 전에 쉽게 확인할 수 있는 방법으로 알립니다.</p>
</main><SiteFooter/></>}
