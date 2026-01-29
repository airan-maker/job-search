# Marketing Agent PRD

## 개요

**제품명**: Marketing Agent
**목적**: Job Search Agent 서비스 홍보를 위한 마케팅 콘텐츠 및 전략 생성
**타겟 사용자**: Job Search Agent 운영자 (서비스 마케팅 담당)

## 핵심 가치

"프라이버시를 지키며 이직하고 싶은 사람들"에게 Job Search Agent를 효과적으로 알리기 위한 AI 마케팅 도우미

---

## 주요 기능

### 1. 타겟 페르소나 분석
- 이직 준비생의 pain point 분석
- 세그먼트별 특성 정의
- 각 페르소나에 맞는 메시지 전략

### 2. 콘텐츠 생성
- **SNS 포스트**: LinkedIn, Twitter/X, 블로그
- **랜딩페이지 카피**: 히어로 섹션, 기능 설명, CTA
- **이메일 마케팅**: 뉴스레터, 온보딩 시퀀스
- **광고 카피**: 검색 광고, 디스플레이 광고

### 3. 채널 전략
- 개발자 커뮤니티 진입 전략 (velog, disquiet, GeekNews 등)
- Product Hunt 런칭 체크리스트
- SEO 키워드 분석 및 콘텐츠 전략

### 4. 경쟁 분석
- 유사 서비스 벤치마킹
- 차별화 포인트 도출
- 포지셔닝 전략

### 5. 성과 추적 (선택)
- 주요 KPI 정의
- A/B 테스트 아이디어

---

## 기술 스택

- **Runtime**: Node.js + TypeScript
- **AI/LLM**: Claude API (Anthropic) + Web Search
- **CLI**: Commander + Inquirer
- **Output**: Markdown, JSON

---

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
├── output/                    # 생성된 콘텐츠 저장
├── package.json
├── tsconfig.json
└── README.md
```

---

## 구현 단계

### Phase 1: MVP
1. 기본 프로젝트 설정
2. 페르소나 분석 에이전트
3. SNS 콘텐츠 생성 (LinkedIn, Twitter)
4. 랜딩페이지 카피 생성

### Phase 2: 확장
1. Product Hunt 런칭 가이드
2. 개발자 커뮤니티 전략
3. 이메일 마케팅 템플릿
4. SEO 키워드 분석

### Phase 3: 고도화
1. 경쟁사 실시간 모니터링
2. 콘텐츠 캘린더 생성
3. A/B 테스트 제안
