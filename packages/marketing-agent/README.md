# Marketing Agent

**Job Search Agent를 세상에 알리자**

Job Search Agent 서비스 홍보를 위한 AI 마케팅 에이전트입니다.

## 주요 기능

### 1. 타겟 페르소나 분석
- 전체 페르소나 정의
- 세그먼트별 분석 (개발자, PM, 디자이너)
- Pain Point 및 메시지 전략

### 2. 경쟁사 분석
- 경쟁사 발굴 및 분석
- 포지셔닝 전략 수립
- 차별화 메시지 개발
- 실시간 웹 검색 분석

### 3. 채널 전략
- 전체 채널 우선순위
- 개발자 커뮤니티 전략
- SEO/콘텐츠 마케팅
- 유료 광고 전략

### 4. 콘텐츠 생성
- **SNS 포스트**: LinkedIn, Twitter/X
- **블로그 포스트**: SEO 최적화
- **랜딩페이지 카피**: 전환율 높은 카피
- **이메일 마케팅**: 온보딩, 뉴스레터
- **광고 카피**: Google, LinkedIn, 디스플레이
- **Product Hunt**: 런칭 패키지

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 빌드
npm run build

# 실행
npm start

# 또는 개발 모드로 실행
npm run dev
```

## 환경 변수

```bash
export ANTHROPIC_API_KEY="your-api-key"
```

## 출력 파일

생성된 콘텐츠는 `output/` 폴더에 마크다운 형식으로 저장됩니다.

## 프로젝트 구조

```
marketing-agent/
├── src/
│   ├── index.ts              # CLI 메인 엔트리
│   ├── agents/
│   │   ├── persona-agent.ts   # 페르소나 분석
│   │   ├── content-agent.ts   # 콘텐츠 생성
│   │   ├── channel-agent.ts   # 채널 전략
│   │   └── competitor-agent.ts # 경쟁 분석
│   ├── types/
│   │   └── index.ts           # TypeScript 타입
│   └── utils/
│       └── index.ts           # 유틸리티
├── output/                    # 생성된 콘텐츠
├── PRD.md
├── package.json
├── tsconfig.json
└── README.md
```

## 기술 스택

- **Runtime**: Node.js + TypeScript
- **AI/LLM**: Claude API (Anthropic) + Web Search
- **CLI**: Commander + Inquirer

## 라이선스

MIT
