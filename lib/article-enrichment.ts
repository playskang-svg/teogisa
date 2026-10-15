import type { Post } from "./content";
import { refreshOfficialUrl } from "./article-html";

export type ArticleEnrichment = {
  officialLinks: Array<{ label: string; url: string }>;
  glossary: Array<{ term: string; url: string }>;
  images?: Array<{ src:string; alt:string; caption:string; width:number; height:number }>;
  video?: { title:string; embedUrl:string; sourceUrl:string; description:string; channel:string; viewsNote?:string };
};

export type ThumbnailSeo = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

const glossaryTerms = ["실업급여", "국민연금", "종합소득세", "인공지능", "블로그", "연금", "퇴직금", "재취업", "애드센스", "N잡"];

const categoryOfficialLinks:Record<string,Array<{label:string;url:string}>>={
  "퇴직 준비":[{label:"국민건강보험공단 자격·보험료 확인",url:"https://www.nhis.or.kr/"},{label:"국민연금공단 노후준비 안내",url:"https://www.nps.or.kr/"}],
  "정부지원·실업급여":[{label:"고용24 실업급여·취업지원 안내",url:"https://www.work24.go.kr/"},{label:"국민연금공단 제도 안내",url:"https://www.nps.or.kr/"}],
  "재취업·N잡":[{label:"고용24 중장년 일자리·훈련 검색",url:"https://www.work24.go.kr/"},{label:"국세청 소득 신고 안내",url:"https://www.nts.go.kr/"}],
  "AI 활용":[{label:"Google 사람 중심 콘텐츠 작성 지침",url:"https://developers.google.com/search/docs/fundamentals/creating-helpful-content?hl=ko"},{label:"Google 생성형 AI 콘텐츠 지침",url:"https://developers.google.com/search/docs/fundamentals/using-gen-ai-content?hl=ko"}],
  "연금·세금·보험":[{label:"국민건강보험공단 자격·보험료 확인",url:"https://www.nhis.or.kr/"},{label:"국세청 세금 신고 안내",url:"https://www.nts.go.kr/"},{label:"국민연금공단 연금 안내",url:"https://www.nps.or.kr/"}],
  "실제 수익실험":[{label:"고용24 일자리·직업훈련 검색",url:"https://www.work24.go.kr/"},{label:"소상공인24 지원사업 확인",url:"https://www.sbiz24.kr/"}],
  "투자·재테크":[{label:"금융감독원 금융소비자정보포털 파인",url:"https://fine.fss.or.kr/"},{label:"예금보험공사 예금자보호 안내",url:"https://www.kdic.or.kr/"}],
};

const slugResources:Record<string,{links?:Array<{label:string;url:string}>;images?:ArticleEnrichment["images"];video?:ArticleEnrichment["video"]}>={
  "retirement-pay-irp-five-checks-before-withdrawal":{
    links:[{label:"고용노동부 IRP 의무이전·예외 안내",url:"https://1350.moel.go.kr/rtmview.do?id=1000255731&page=1&type=ALL"},{label:"고용노동부 퇴직연금제도 안내",url:"https://www.moel.go.kr/retirementpay.do"},{label:"국세청 연금계좌 원천징수세율",url:"https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7888&mi=6609"},{label:"국세청 퇴직소득세·과세이연 안내",url:"https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7880&mi=6444"}],
    images:[{src:"/article-thumbnails/application-process-timeline.webp",alt:"퇴직금이 IRP에 입금된 뒤 일시금과 연금 수령 절차를 확인하는 서류·일정표 일러스트",caption:"IRP는 해지 버튼부터 누르기보다 퇴직금의 출처, 필요한 시점과 수령 방식을 순서대로 확인해야 합니다. · 퇴.기.사 제작 일러스트",width:355,height:444}],
  },
  "proshot-mobile-id-studio-photo-guide":{
    links:[{label:"ProShot AI 사진 스튜디오 바로가기",url:"https://proshot.adbles.com/"},{label:"외교부 여권사진 규격 안내",url:"https://www.passport.go.kr/home/kor/contents.do?menuPos=32"},{label:"외교부 온라인 여권사진 검증",url:"https://passport.go.kr/home/kor/onlinePhotoVerify/index.do?menuPos=33"}],
    images:[{src:"https://proshot.adbles.com/images/selfie_before.png",alt:"ProShot에 업로드하기 전 휴대폰 정면 셀카 예시",caption:"정면을 또렷하게 바라본 휴대폰 셀카를 준비합니다. · ProShot 제공 예시 이미지",width:640,height:640},{src:"https://proshot.adbles.com/images/profile_after.png",alt:"ProShot으로 생성한 정장 차림의 스튜디오 비즈니스 프로필 사진 예시",caption:"스타일을 선택하면 비즈니스 헤드샷이나 스튜디오 프로필 형태로 생성할 수 있습니다. · ProShot 제공 예시 이미지",width:640,height:640}],
  },
  "deposit-protection-100-million-retirement-money-checks":{
    links:[{label:"금융위원회 예금보호한도 1억원 안내",url:"https://www.fsc.go.kr/edu/news/85225"},{label:"금융위원회 적용 대상·별도 한도 안내",url:"https://www.fsc.go.kr/edu/news/85077"},{label:"예금보험공사 예금자보호 안내",url:"https://www.kdic.or.kr/"}],
    images:[{src:"/article-thumbnails/income-tax-calculation.webp",alt:"예금보호한도와 퇴직금 분산 예치를 계산하는 표·계산기 일러스트",caption:"보호한도만 보지 말고 금융회사별 원금·예상 이자 합계와 만기일을 함께 적어야 합니다. · 퇴.기.사 제작 일러스트",width:355,height:444}],
  },
  "health-insurance-after-retirement-three-checks":{
    links:[{label:"국민건강보험공단 임의계속가입 안내",url:"https://www.nhis.or.kr/static/alim/paper/oldpaper/202212/sub/18.html"},{label:"국민건강보험공단 2026년도 보험료율",url:"https://edi.nhis.or.kr/portal/images/popup/20251204_pop01longdesc.html"}],
    images:[{src:"/article-thumbnails/retirement-pension-life.webp",alt:"퇴직 후 건강보험 가입 유형을 확인하는 중장년 부부 일러스트",caption:"퇴직 후에는 피부양자·지역가입자·임의계속가입 가운데 가능한 경로와 예상 보험료를 함께 확인해야 합니다. · 퇴.기.사 제작 일러스트",width:355,height:444}],
    video:{title:"건보료 조정신청과 임의계속가입 제도",embedUrl:"https://www.youtube-nocookie.com/embed/D-5p431l-qY",sourceUrl:"https://www.youtube.com/watch?v=D-5p431l-qY",description:"퇴직 후 임의계속가입의 기본 개념을 설명하는 KBS 참고영상입니다. 2021년 공개 영상이므로 최신 보험료율·자격·기한은 본문에 연결한 국민건강보험공단의 2026년 자료로 다시 확인하세요.",channel:"윤창희의 생존경제_KBS"},
  },
  "ai-first-income-five-methods-seven-day-plan":{
    links:[{label:"원본 영상: 클로드 수익화 방법 5가지",url:"https://www.youtube.com/watch?v=qEVZ7AgB7zI"}],
    video:{title:"클로드로 당장 수익 만드는 확실한 방법 5가지",embedUrl:"https://www.youtube-nocookie.com/embed/qEVZ7AgB7zI",sourceUrl:"https://www.youtube.com/watch?v=qEVZ7AgB7zI",description:"리서치 대행, 디지털 상품, 인스타툰, 미니사이트와 웹게임까지 다섯 가지 AI 수익화 아이디어를 소개한 영상입니다. 본문은 이 아이디어들을 7일 검증 절차와 위험 관리 기준으로 재구성했습니다.",channel:"혼잡스"},
  },
  "localhost-server-domain-dns-basics":{
    links:[{label:"MDN — 인터넷은 어떻게 동작하는가",url:"https://developer.mozilla.org/ko/docs/Learn_web_development/Howto/Web_mechanics/How_does_the_Internet_work"},{label:"MDN — 웹서버란 무엇일까",url:"https://developer.mozilla.org/ko/docs/Learn_web_development/Howto/Web_mechanics/What_is_a_web_server"}],
    video:{title:"바이브 코딩 후 막히는 웹 서버와 배포의 흐름 (뿌리강의 4강)",embedUrl:"https://www.youtube-nocookie.com/embed/rESpjQLptUs",sourceUrl:"https://www.youtube.com/watch?v=rESpjQLptUs",description:"서버·IP·포트·도메인·DNS부터 Nginx, Git·Docker·CI/CD, Vercel·Railway 배포, DNS·HTTPS·SSL까지 다룬 41분 강의입니다. 이 시리즈 3편은 이 중 개념·배포방법·도메인연결 부분을 부업 사이트 운영자 기준으로 재구성했습니다.",channel:"양실장의 바이브코딩대학"},
  },
  "website-deploy-vercel-railway-guide":{links:[{label:"GitHub Actions 공식 문서",url:"https://docs.github.com/actions"},{label:"원본 강의: 바이브코딩 후 막히는 배포의 흐름",url:"https://www.youtube.com/watch?v=rESpjQLptUs"}]},
  "domain-dns-ssl-connect-guide":{links:[{label:"Vercel 공식 — 도메인 연결 방법",url:"https://vercel.com/docs/domains/working-with-domains"},{label:"Let's Encrypt 공식 사이트",url:"https://letsencrypt.org/"}]},
  "unemployment-benefit-eight-steps":{links:[{label:"고용24 실업급여 신청 절차 원문",url:"https://www.work24.go.kr/cm/c/f/1100/selecSystInfo.do?systClId=SC00000254&systId=SI00000411"}]},
  "side-jobs-while-receiving-benefits":{links:[{label:"고용24 실업인정·취업 사실 신고 안내",url:"https://www.work24.go.kr/cm/c/f/1100/selecSystInfo.do?systClId=SC00000254&systId=SI00000411"}]},
  "2026-unemployment-credit-guide":{
    links:[{label:"국민연금공단 실업크레딧 업무 안내서",url:"https://edi.nps.or.kr/cm/main/guide/edi_workguide_new.pdf"}],
    video:{title:"나와 국민연금의 징검다리, 실업크레딧",embedUrl:"https://www.youtube-nocookie.com/embed/z08sPVTv39M",sourceUrl:"https://www.youtube.com/watch?v=z08sPVTv39M",description:"구직급여 수급자가 연금보험료의 25%를 부담하고 지원을 받는 과정을 사례로 설명한 국민연금공단 공식 영상입니다.",channel:"국민연금TV",viewsNote:"확인 당시 약 6.2만 회 재생"},
  },
  "side-income-tax-records":{links:[{label:"국세청 3.3% 원천징수 종합소득세 안내",url:"https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=238978"},{label:"홈택스 신고·지급명세서 확인",url:"https://www.hometax.go.kr/"}]},
};

const thumbnailCatalog = [
  { file: "retirement-checklist.webp", description: "체크 표시가 된 퇴직 준비 체크리스트 일러스트" },
  { file: "second-career-side-job.webp", description: "노트북으로 재취업과 부업을 준비하는 중장년 일러스트" },
  { file: "ai-workflow.webp", description: "노트북과 인공지능을 활용하는 중장년 여성 일러스트" },
  { file: "application-process-timeline.webp", description: "서류와 사람 아이콘으로 구성된 신청 절차 일러스트" },
  { file: "retirement-pension-life.webp", description: "산과 해를 바라보는 은퇴 부부 일러스트" },
  { file: "income-tax-calculation.webp", description: "표와 계산기, 원그래프로 구성된 소득·세금 계산 일러스트" },
  { file: "retirement-asset-growth.webp", description: "집과 새싹, 사다리로 표현한 자산 성장 일러스트" },
  { file: "three-bucket-budget.webp", description: "주거·생활·보험을 나눈 3칸 예산 일러스트" },
  { file: "balanced-income-plan.webp", description: "여러 수입원을 균형 있게 쌓는 저울 일러스트" },
  { file: "content-quality-review.webp", description: "별점 체크리스트를 검토하는 중장년 일러스트" },
] as const;

function thumbnailHash(value: string) {
  return [...value].reduce((total, character) => (total * 31 + character.charCodeAt(0)) >>> 0, 0);
}

export function getThumbnailIndex(post: Pick<Post, "id" | "slug">) {
  return post.id >= 1 && post.id <= 10 ? post.id - 1 : thumbnailHash(post.slug) % 10;
}

export function getThumbnailSeo(post: Pick<Post, "id" | "slug" | "title">): ThumbnailSeo {
  const image = thumbnailCatalog[getThumbnailIndex(post)];
  return {
    src: `/article-thumbnails/${image.file}`,
    alt: `${post.title} — ${image.description}`,
    width: 355,
    height: 444,
  };
}

export function appendSourceUrl(body: string, sourceUrl?: string) {
  const source = sourceUrl?.trim();
  if (!source || body.includes(source)) return body.trim();
  if (/<(?:p|h[1-6]|div|figure|ul|ol|blockquote|table)\b/i.test(body)) {
    const safeSource = source.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return `${body.trim()}<p>출처: <a href="${safeSource}" target="_blank" rel="noreferrer">${safeSource}</a></p>`;
  }
  return `${body.trim()}\n\n출처: ${source}`;
}

export function enrichArticle(post: Post): ArticleEnrichment {
  const text = `${post.title} ${post.body} ${post.tags.join(" ")}`;
  const urls = Array.from(new Set((post.body.match(/https?:\/\/[^\s)<>"']+/g) ?? []).map((url) => refreshOfficialUrl(url.replace(/[.,;]+$/, "")))));
  const detectedLinks = urls.slice(0, 4).map((url) => {
    try {
      const host = new URL(url).hostname.replace(/^www\./, "");
      return { label: `${host} 공식자료`, url };
    } catch {
      return { label: "공식자료", url };
    }
  });
  const resource=slugResources[post.slug];
  const officialLinks=Array.from(new Map([...(resource?.links??[]),...(categoryOfficialLinks[post.category]??[]),...detectedLinks].map(link=>[link.url,link])).values()).slice(0,5);
  const glossary = glossaryTerms.filter((term) => text.includes(term)).slice(0, 4).map((term) => ({
    term,
    url: `https://ko.wikipedia.org/w/index.php?search=${encodeURIComponent(term)}`,
  }));
  return {
    officialLinks,
    glossary,
    images:resource?.images,
    video:resource?.video,
  };
}
