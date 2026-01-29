# AI Agents Monorepo

AI 기반 에이전트 서비스 모음

## 패키지

### CLI 에이전트

| 패키지 | 설명 | 대상 |
|--------|------|------|
| `packages/job-search` | 이직 준비 에이전트 | 구직자 |
| `packages/recruiter-agent` | 채용 도우미 | HR/채용담당자 |
| `packages/marketing-agent` | 마케팅 에이전트 | 마케터 |

### 웹 인터페이스 (Vercel 배포용)

| 패키지 | 설명 | 포트 | Vercel Root Directory |
|--------|------|------|----------------------|
| `packages/web-job-search` | 구직자용 웹 앱 | 3001 | `packages/web-job-search` |
| `packages/web-recruiter` | 채용담당자용 웹 앱 | 3002 | `packages/web-recruiter` |
| `packages/web-marketing` | 마케터용 웹 앱 | 3003 | `packages/web-marketing` |

## 설치 및 실행

```bash
# 전체 의존성 설치
npm install

# CLI 에이전트 실행
npm run dev:job-search    # 구직자용
npm run dev:recruiter     # 채용담당자용
npm run dev:marketing     # 마케팅용

# 웹 앱 실행
npm run dev:web-job-search   # http://localhost:3001
npm run dev:web-recruiter    # http://localhost:3002
npm run dev:web-marketing    # http://localhost:3003

# 전체 빌드
npm run build
```

## 환경 변수

```bash
export ANTHROPIC_API_KEY="your-api-key"
```

## Vercel 배포

각 웹 앱은 별도의 Vercel 프로젝트로 배포됩니다:

### 1. Job Search Agent 배포

1. Vercel에서 레포지토리 Import
2. Root Directory를 `packages/web-job-search`로 설정
3. Environment Variables에 `ANTHROPIC_API_KEY` 추가
4. Deploy!

### 2. Recruiter Agent 배포

1. Vercel에서 레포지토리 Import (새 프로젝트)
2. Root Directory를 `packages/web-recruiter`로 설정
3. Environment Variables에 `ANTHROPIC_API_KEY` 추가
4. Deploy!

### 3. Marketing Agent 배포

1. Vercel에서 레포지토리 Import (새 프로젝트)
2. Root Directory를 `packages/web-marketing`로 설정
3. Environment Variables에 `ANTHROPIC_API_KEY` 추가
4. Deploy!

### 배포 설정

| 설정 | 값 |
|------|-----|
| Framework | Next.js |
| Build Command | `npm run build` |

## 프로젝트 구조

```
ai-agents-monorepo/
├── packages/
│   ├── job-search/         # CLI - 이직 준비 에이전트
│   ├── recruiter-agent/    # CLI - 채용 에이전트
│   ├── marketing-agent/    # CLI - 마케팅 에이전트
│   ├── web-job-search/     # Web - 구직자용 (Vercel)
│   │   ├── app/
│   │   │   ├── api/chat/   # Chat API
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   └── components/
│   ├── web-recruiter/      # Web - 채용담당자용 (Vercel)
│   │   ├── app/
│   │   │   ├── api/chat/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   └── components/
│   └── web-marketing/      # Web - 마케터용 (Vercel)
│       ├── app/
│       │   ├── api/chat/
│       │   ├── layout.tsx
│       │   └── page.tsx
│       └── components/
│
├── package.json            # 루트 (npm workspaces)
└── README.md
```

## 기술 스택

- **Runtime**: Node.js + TypeScript
- **AI/LLM**: Claude API (Anthropic)
- **CLI**: Commander + Inquirer
- **Web**: Next.js 14 + Tailwind CSS
- **PDF**: PDFKit

## 라이선스

MIT
