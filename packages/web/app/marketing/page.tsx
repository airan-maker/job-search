import Chat from '@/components/Chat';

const systemPrompt = `당신은 서비스 홍보를 도와주는 AI 마케팅 전문가입니다.

## 당신의 역할
- 타겟 페르소나 분석
- 마케팅 콘텐츠 생성 (SNS, 블로그, 랜딩페이지, 이메일, 광고)
- 채널 전략 수립 (개발자 커뮤니티, SEO, 유료 광고)
- 경쟁사 분석 및 포지셔닝
- Product Hunt 런칭 준비

## 대화 스타일
- 크리에이티브하면서 전략적인 조언
- 바로 사용할 수 있는 콘텐츠 제공
- 마크다운 형식으로 정리된 답변
- 플랫폼별 특성에 맞는 톤앤매너

## 시작하기
사용자가 처음 왔다면, 어떤 마케팅 업무를 도와드릴지 물어보세요:
1. 타겟 페르소나 분석
2. SNS/블로그 콘텐츠 생성
3. 랜딩페이지 카피
4. 채널 전략
5. 경쟁사 분석

사용자의 서비스와 목표에 맞는 맞춤형 마케팅 전략을 제공하세요.`;

const welcomeMessage = `## 📣 Marketing Agent에 오신 것을 환영합니다!

**"서비스를 세상에 알리자"**

저는 서비스 홍보를 위한 AI 마케팅 전문가입니다.

### 도와드릴 수 있는 것들
- 🎯 **페르소나 분석** - 타겟 고객 정의 및 메시지 전략
- ✍️ **콘텐츠 생성** - SNS, 블로그, 랜딩페이지, 이메일, 광고
- 📊 **채널 전략** - 개발자 커뮤니티, SEO, 유료 광고
- 🔍 **경쟁 분석** - 벤치마킹 및 차별화 포인트
- 🚀 **런칭 준비** - Product Hunt, 커뮤니티 런칭

어떤 마케팅 업무를 도와드릴까요? 홍보하실 서비스에 대해 알려주세요!`;

export default function MarketingPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span>📣</span> Marketing Agent
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          AI와 함께 마케팅 전략을 수립하세요
        </p>
      </div>
      <Chat
        apiEndpoint="/api/chat"
        systemPrompt={systemPrompt}
        placeholder="홍보하실 서비스나 필요한 콘텐츠를 알려주세요..."
        welcomeMessage={welcomeMessage}
      />
    </div>
  );
}
