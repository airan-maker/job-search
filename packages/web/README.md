# AI Agents Web

AI Agents 모노레포의 웹 인터페이스입니다. Next.js 14 App Router 기반으로 구축되었습니다.

## 기능

- **Job Search Agent** - 이직 준비 도우미 (구직자용)
- **Recruiter Agent** - 채용 도우미 (HR용)
- **Marketing Agent** - 마케팅 도우미

## 로컬 개발

```bash
# 루트에서 의존성 설치
npm install

# 웹 앱 실행
npm run dev:web

# http://localhost:3000 에서 확인
```

## 환경 변수

`.env.local` 파일을 생성하고 다음 환경 변수를 설정하세요:

```bash
ANTHROPIC_API_KEY=your-api-key-here
```

## Vercel 배포

### 방법 1: Vercel CLI

```bash
cd packages/web
npx vercel
```

### 방법 2: GitHub 연동

1. GitHub에 레포지토리 푸시
2. Vercel에서 Import
3. Root Directory를 `packages/web`으로 설정
4. Environment Variables에 `ANTHROPIC_API_KEY` 추가
5. Deploy!

### 설정

| 설정 | 값 |
|------|-----|
| Framework | Next.js |
| Root Directory | `packages/web` |
| Build Command | `npm run build` |
| Output Directory | `.next` |

## 기술 스택

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **AI**: Claude API (Anthropic)
- **Language**: TypeScript

## 프로젝트 구조

```
web/
├── app/
│   ├── api/
│   │   └── chat/route.ts    # Chat API endpoint
│   ├── job-search/page.tsx  # Job Search UI
│   ├── recruiter/page.tsx   # Recruiter UI
│   ├── marketing/page.tsx   # Marketing UI
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   └── globals.css          # Global styles
├── components/
│   ├── Chat.tsx             # Reusable chat component
│   └── Navigation.tsx       # Navigation bar
├── vercel.json              # Vercel config
└── package.json
```
