import Link from 'next/link';

const agents = [
  {
    href: '/job-search',
    title: 'Job Search Agent',
    emoji: '🎯',
    tagline: '내 정보는 비공개, 채용 공고는 AI가 찾아준다',
    description: '프라이버시를 지키면서 이직을 준비할 수 있는 AI 에이전트',
    features: ['AI 채용 공고 탐색', '맞춤 이력서 생성', '모의 면접 코칭', '합격률 분석'],
    color: 'blue',
    target: '구직자',
  },
  {
    href: '/recruiter',
    title: 'Recruiter Agent',
    emoji: '👔',
    tagline: '채용의 모든 과정을 AI가 도와드립니다',
    description: 'HR/채용 담당자를 위한 AI 채용 도우미',
    features: ['JD 작성', '소싱 전략', '면접 설계', '후보자 평가'],
    color: 'cyan',
    target: '채용담당자',
  },
  {
    href: '/marketing',
    title: 'Marketing Agent',
    emoji: '📣',
    tagline: '서비스를 세상에 알리자',
    description: '서비스 홍보를 위한 AI 마케팅 에이전트',
    features: ['페르소나 분석', '콘텐츠 생성', '채널 전략', '경쟁사 분석'],
    color: 'purple',
    target: '마케터',
  },
];

const colorClasses: Record<string, { bg: string; border: string; text: string }> = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-600 dark:text-blue-400',
  },
  cyan: {
    bg: 'bg-cyan-50 dark:bg-cyan-900/20',
    border: 'border-cyan-200 dark:border-cyan-800',
    text: 'text-cyan-600 dark:text-cyan-400',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-800',
    text: 'text-purple-600 dark:text-purple-400',
  },
};

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="text-center py-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          AI Agents
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-2">
          구직자와 채용담당자를 위한 AI 에이전트
        </p>
        <p className="text-gray-500 dark:text-gray-400">
          Claude AI 기반으로 채용의 모든 과정을 도와드립니다
        </p>
      </section>

      {/* Agent Cards */}
      <section className="grid md:grid-cols-3 gap-6 mt-8">
        {agents.map((agent) => {
          const colors = colorClasses[agent.color];
          return (
            <Link
              key={agent.href}
              href={agent.href}
              className={`block p-6 rounded-xl border-2 ${colors.border} ${colors.bg} hover:shadow-lg transition-shadow`}
            >
              <div className="text-4xl mb-4">{agent.emoji}</div>
              <span className={`text-xs font-medium ${colors.text} uppercase`}>
                {agent.target}
              </span>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                {agent.title}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                {agent.tagline}
              </p>
              <ul className="mt-4 space-y-1">
                {agent.features.map((feature) => (
                  <li key={feature} className="text-sm text-gray-500 dark:text-gray-400">
                    • {feature}
                  </li>
                ))}
              </ul>
              <div className={`mt-4 text-sm font-medium ${colors.text}`}>
                시작하기 →
              </div>
            </Link>
          );
        })}
      </section>

      {/* How it works */}
      <section className="mt-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
          에이전트 연계
        </h2>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-gray-600 dark:text-gray-300">
          <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            🎯 Job Search<br />
            <span className="text-sm">(구직자)</span>
          </div>
          <div className="text-2xl">↔</div>
          <div className="p-4 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
            👔 Recruiter<br />
            <span className="text-sm">(채용담당자)</span>
          </div>
          <div className="text-2xl">↔</div>
          <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            📣 Marketing<br />
            <span className="text-sm">(서비스홍보)</span>
          </div>
        </div>
      </section>
    </div>
  );
}
