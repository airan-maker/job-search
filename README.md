# AI Agents Monorepo

AI 기반 에이전트 서비스 모음

## 패키지

### 1. Job Search Agent (`packages/job-search`)
**"내 정보는 비공개, 채용 공고는 AI가 찾아준다"**

프라이버시를 지키면서 이직을 준비할 수 있는 AI 에이전트 (구직자용)

- AI 채용 공고 자동 탐색
- 맞춤 이력서/자소서 생성 + PDF
- 실시간 코칭 모의 면접
- 합격률 분석 및 연봉 협상 가이드

### 2. Recruiter Agent (`packages/recruiter-agent`)
**"채용의 모든 과정을 AI가 도와드립니다"**

HR/채용 담당자를 위한 AI 채용 도우미 (채용자용)

- JD (채용 공고) 작성 및 개선
- 후보자 소싱 전략 (페르소나, 채널, 아웃리치)
- 면접 설계 (질문 생성, 평가표, 면접관 가이드)
- 후보자 평가 (스크리닝, 비교, 레퍼런스 체크)
- 채용 브랜딩 (회사 소개, 홍보 콘텐츠)

### 3. Marketing Agent (`packages/marketing-agent`)
**"Job Search Agent를 세상에 알리자"**

서비스 홍보를 위한 AI 마케팅 에이전트

- 타겟 페르소나 분석
- 마케팅 콘텐츠 생성 (SNS, 블로그, 랜딩페이지, 이메일, 광고)
- 채널 전략 (개발자 커뮤니티, SEO, 유료 광고)
- 경쟁사 분석

## 에이전트 연계

```
┌─────────────────┐     ┌─────────────────┐
│  Job Search     │ ←→  │   Recruiter     │
│  Agent          │     │   Agent         │
│  (구직자)        │     │   (채용담당자)   │
└────────┬────────┘     └────────┬────────┘
         │                       │
         └───────────┬───────────┘
                     ↓
            ┌─────────────────┐
            │   Marketing     │
            │   Agent         │
            │   (서비스홍보)   │
            └─────────────────┘
```

## 설치 및 실행

```bash
# 전체 의존성 설치
npm install

# Job Search Agent 실행 (구직자용)
npm run dev:job-search

# Recruiter Agent 실행 (채용담당자용)
npm run dev:recruiter

# Marketing Agent 실행 (마케팅용)
npm run dev:marketing

# 전체 빌드
npm run build
```

## 환경 변수

```bash
export ANTHROPIC_API_KEY="your-api-key"
```

## 프로젝트 구조

```
ai-agents-monorepo/
├── packages/
│   ├── job-search/         # 이직 준비 에이전트 (구직자)
│   │   ├── src/agents/     # 프로필, 채용검색, 이력서, 면접, 전략
│   │   └── package.json
│   │
│   ├── recruiter-agent/    # 채용 에이전트 (HR)
│   │   ├── src/agents/     # JD, 소싱, 면접설계, 평가, 브랜딩
│   │   └── package.json
│   │
│   └── marketing-agent/    # 마케팅 에이전트
│       ├── src/agents/     # 페르소나, 콘텐츠, 채널, 경쟁분석
│       └── package.json
│
├── package.json            # 루트 (npm workspaces)
└── README.md
```

## 기술 스택

- **Runtime**: Node.js + TypeScript
- **AI/LLM**: Claude API (Anthropic) + Web Search
- **CLI**: Commander + Inquirer
- **PDF**: PDFKit (job-search)

## 라이선스

MIT
