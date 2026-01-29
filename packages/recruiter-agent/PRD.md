# Recruiter Agent PRD

## 개요

**제품명**: Recruiter Agent
**목적**: 채용 담당자를 위한 AI 채용 도우미
**타겟 사용자**: HR 담당자, 채용 담당자, 헤드헌터, 스타트업 대표

## 핵심 가치

"채용의 모든 과정을 AI가 도와드립니다"

- JD 작성부터 면접 질문까지 원스톱
- 후보자 소싱 전략 수립
- 채용 브랜딩 강화

---

## 주요 기능

### 1. JD (Job Description) 작성
- 포지션별 맞춤 JD 템플릿
- 경쟁력 있는 JD 작성 가이드
- SEO 최적화 (채용 플랫폼 노출)
- 포용적 언어 검토 (Inclusive language)
- 경쟁사 JD 벤치마킹

### 2. 후보자 소싱 전략
- 타겟 후보자 페르소나 정의
- 채널별 소싱 전략 (LinkedIn, 개발자 커뮤니티 등)
- 아웃바운드 메시지 템플릿
- 추천 채용 프로그램 설계

### 3. 면접 설계
- 포지션별 면접 질문 생성
- 역량 기반 질문 (Competency-based)
- 기술 면접 질문 (Coding, System Design)
- 평가 기준표 (Rubric) 생성
- 면접관 가이드

### 4. 후보자 평가
- 이력서 스크리닝 체크리스트
- 후보자 비교 매트릭스
- 레퍼런스 체크 질문
- 오퍼 협상 가이드

### 5. 채용 브랜딩
- 회사 소개 페이지 카피
- 채용 공고 홍보 콘텐츠
- 채용 설명회 스크립트
- 후보자 경험 개선 가이드

---

## 기술 스택

- **Runtime**: Node.js + TypeScript
- **AI/LLM**: Claude API (Anthropic) + Web Search
- **CLI**: Commander + Inquirer
- **Output**: Markdown, JSON

---

## 프로젝트 구조

```
recruiter-agent/
├── src/
│   ├── index.ts              # CLI 메인 엔트리
│   ├── agents/
│   │   ├── jd-agent.ts        # JD 작성
│   │   ├── sourcing-agent.ts  # 후보자 소싱
│   │   ├── interview-agent.ts # 면접 설계
│   │   ├── evaluation-agent.ts # 후보자 평가
│   │   └── branding-agent.ts  # 채용 브랜딩
│   ├── types/
│   │   └── index.ts
│   └── utils/
│       └── index.ts
├── output/                    # 생성된 콘텐츠
├── package.json
├── tsconfig.json
└── README.md
```

---

## 구현 단계

### Phase 1: MVP
1. JD 작성 에이전트
2. 면접 질문 생성
3. 후보자 소싱 전략

### Phase 2: 확장
1. 후보자 평가 도구
2. 채용 브랜딩 콘텐츠
3. 레퍼런스 체크 가이드

### Phase 3: 고도화
1. ATS 연동 (가이드)
2. 채용 데이터 분석
3. 다국어 지원

---

## Job Search Agent 연계

| Recruiter Agent | Job Search Agent |
|-----------------|------------------|
| JD 작성 | JD 분석 |
| 면접 질문 생성 | 면접 답변 준비 |
| 후보자 평가 기준 | 합격률 분석 |
| 연봉 벤치마크 | 연봉 협상 가이드 |

→ 양쪽 관점을 이해하면 더 나은 서비스 제공 가능
