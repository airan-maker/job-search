# AI Agents Monorepo

AI 기반 에이전트 서비스 모음

## 패키지

### CLI 에이전트

| 패키지 | 설명 | 대상 |
|--------|------|------|
| `packages/job-search` | 이직 준비 에이전트 | 구직자 |
| `packages/recruiter-agent` | 채용 도우미 | HR/채용담당자 |
| `packages/marketing-agent` | 마케팅 에이전트 | 마케터 |

### 웹 인터페이스

| 패키지 | 설명 | 배포 |
|--------|------|------|
| `packages/web` | Next.js 웹 앱 | Vercel |

## 설치 및 실행

```bash
# 전체 의존성 설치
npm install

# CLI 에이전트 실행
npm run dev:job-search    # 구직자용
npm run dev:recruiter     # 채용담당자용
npm run dev:marketing     # 마케팅용

# 웹 앱 실행 (http://localhost:3000)
npm run dev:web

# 전체 빌드
npm run build
```

## 환경 변수

```bash
export ANTHROPIC_API_KEY="your-api-key"
```

## Vercel 배포

### 웹 앱 배포

1. Vercel에서 레포지토리 Import
2. Root Directory를 `packages/web`으로 설정
3. Environment Variables에 `ANTHROPIC_API_KEY` 추가
4. Deploy!

| 설정 | 값 |
|------|-----|
| Framework | Next.js |
| Root Directory | `packages/web` |
| Build Command | `npm run build` |

## 프로젝트 구조

```
ai-agents-monorepo/
├── packages/
│   ├── job-search/         # CLI - 이직 준비 에이전트
│   ├── recruiter-agent/    # CLI - 채용 에이전트
│   ├── marketing-agent/    # CLI - 마케팅 에이전트
│   └── web/                # Web - Next.js 앱 (Vercel 배포)
│       ├── app/
│       │   ├── api/chat/   # Chat API
│       │   ├── job-search/ # Job Search UI
│       │   ├── recruiter/  # Recruiter UI
│       │   └── marketing/  # Marketing UI
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
