# Job Search Agent

**내 정보는 비공개, 채용 공고는 AI가 찾아준다**

프라이버시를 지키면서 이직을 준비할 수 있는 AI 에이전트입니다.

## 주요 기능

### 1. 프로필 관리
- 마스터 프로필 생성 및 편집
- 로컬 JSON 파일로 안전하게 저장
- AI 기반 프로필 분석 및 개선 제안

### 2. AI 채용 공고 자동 탐색 ⭐
- 프로필 기반 검색 쿼리 자동 생성
- AI가 적합한 채용 공고를 찾아서 추천
- 매칭 스코어 산출 및 추천 이유 설명
- 관심 공고 저장 및 관리

### 3. 맞춤 이력서 생성
- 선택한 공고의 JD 분석
- 공고에 최적화된 이력서 자동 생성
- 자기소개서 작성 지원

### 4. 면접 준비 코치
- 예상 질문 생성 (인성/기술/경험)
- AI 면접관과 모의 면접
- 답변 피드백 및 개선점 제안
- 회사 정보 리서치

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

## 사용 방법

1. **프로필 생성**: 경력, 기술 스택, 희망 조건 입력
2. **채용 공고 탐색**: AI가 프로필에 맞는 공고를 자동으로 검색
3. **관심 공고 저장**: 마음에 드는 공고를 저장
4. **이력서 생성**: 저장한 공고에 맞춤화된 이력서 생성
5. **면접 준비**: 예상 질문 확인 및 모의 면접 연습

## 프로젝트 구조

```
src/
├── index.ts              # CLI 메인 엔트리
├── agents/
│   ├── profile-agent.ts  # 프로필 관리
│   ├── job-search-agent.ts # 채용 공고 탐색
│   ├── resume-agent.ts   # 이력서 생성
│   └── interview-agent.ts # 면접 준비
├── storage/
│   └── index.ts          # 로컬 데이터 저장
├── types/
│   └── index.ts          # TypeScript 타입 정의
└── utils/
    └── index.ts          # 유틸리티 함수
```

## 기술 스택

- **Runtime**: Node.js + TypeScript
- **AI/LLM**: Claude API (Anthropic)
- **CLI**: Commander + Inquirer
- **Storage**: Local JSON

## 라이선스

MIT
