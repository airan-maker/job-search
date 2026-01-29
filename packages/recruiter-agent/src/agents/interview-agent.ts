import Anthropic from '@anthropic-ai/sdk';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { companyInfo, saveContent, getLevelKorean } from '../utils/index.js';

const client = new Anthropic();

export async function designInterview(): Promise<void> {
  console.log(chalk.bold.blue('\n=== 면접 설계 ===\n'));

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: '무엇을 하시겠습니까?',
      choices: [
        { name: '❓ 면접 질문 생성', value: 'questions' },
        { name: '📋 평가 기준표 (Rubric)', value: 'rubric' },
        { name: '📖 면접관 가이드', value: 'guide' },
        { name: '🔧 기술 면접 설계', value: 'technical' },
        { name: '← 돌아가기', value: 'back' }
      ]
    }
  ]);

  if (action === 'back') return;

  if (action === 'questions') {
    await generateInterviewQuestions();
  } else if (action === 'rubric') {
    await createEvaluationRubric();
  } else if (action === 'guide') {
    await createInterviewerGuide();
  } else if (action === 'technical') {
    await designTechnicalInterview();
  }
}

async function generateInterviewQuestions(): Promise<void> {
  const info = await inquirer.prompt([
    {
      type: 'input',
      name: 'position',
      message: '포지션명:',
      default: 'Backend Developer'
    },
    {
      type: 'list',
      name: 'level',
      message: '레벨:',
      choices: [
        { name: '주니어 (1-3년)', value: 'junior' },
        { name: '미드레벨 (4-7년)', value: 'mid' },
        { name: '시니어 (8년+)', value: 'senior' },
        { name: '리드/팀장', value: 'lead' }
      ]
    },
    {
      type: 'list',
      name: 'stage',
      message: '면접 단계:',
      choices: [
        { name: '1차 (인성/문화 fit)', value: 'culture' },
        { name: '2차 (기술 면접)', value: 'technical' },
        { name: '3차 (임원/최종)', value: 'final' },
        { name: '전체 프로세스', value: 'all' }
      ]
    }
  ]);

  const spinner = ora('면접 질문 생성 중...').start();

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: `채용 면접 전문가로서 면접 질문을 생성해주세요.

## 포지션 정보
- 직무: ${info.position}
- 레벨: ${getLevelKorean(info.level)}
- 면접 단계: ${info.stage === 'all' ? '전체' : info.stage}

## 회사 문화
${companyInfo.culture.join(', ')}

## 질문 생성 요청

${info.stage === 'culture' || info.stage === 'all' ? `
### 인성/문화 Fit 질문 (10개)

각 질문에 포함:
- 질문
- 의도 (무엇을 파악하려는지)
- 좋은 답변 예시
- 우려되는 답변

**동기/가치관**
1. 왜 이직을 고려하시나요?
2. 5년 후 어떤 모습이고 싶으신가요?
...

**협업/커뮤니케이션**
...

**문제 해결/태도**
...

**문화 Fit**
...
` : ''}

${info.stage === 'technical' || info.stage === 'all' ? `
### 기술 면접 질문 (15개)

**기초/개념 질문**
...

**경험 기반 질문 (STAR)**
...

**시나리오/문제 해결**
...

**시스템 설계** (${info.level === 'senior' || info.level === 'lead' ? '심화' : '기초'})
...
` : ''}

${info.stage === 'final' || info.stage === 'all' ? `
### 임원/최종 면접 질문 (5개)

**리더십/비전**
...

**회사 적합성**
...

**협상 준비**
...
` : ''}

### 역질문 유도
- 후보자에게 권할 역질문
- 좋은 역질문의 예

### 면접 팁
- 이 포지션 면접 시 주의할 점
- 레드플래그 시그널`
        }
      ]
    });

    spinner.stop();

    const textContent = response.content.find(c => c.type === 'text');
    if (textContent && textContent.type === 'text') {
      console.log(chalk.bold.green('\n✨ 면접 질문이 생성되었습니다!\n'));
      console.log(chalk.gray('─'.repeat(60)));
      console.log(textContent.text);
      console.log(chalk.gray('─'.repeat(60)));

      const { save } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'save',
          message: '파일로 저장하시겠습니까?',
          default: true
        }
      ]);

      if (save) {
        const filename = `interview-questions-${info.position.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.md`;
        const filepath = await saveContent(filename, textContent.text);
        console.log(chalk.green(`\n저장됨: ${filepath}\n`));
      }
    }
  } catch (error) {
    spinner.stop();
    console.log(chalk.red('질문 생성 중 오류가 발생했습니다:'), error);
  }
}

async function createEvaluationRubric(): Promise<void> {
  const { position, level } = await inquirer.prompt([
    {
      type: 'input',
      name: 'position',
      message: '포지션명:',
      default: 'Backend Developer'
    },
    {
      type: 'list',
      name: 'level',
      message: '레벨:',
      choices: [
        { name: '주니어 (1-3년)', value: 'junior' },
        { name: '미드레벨 (4-7년)', value: 'mid' },
        { name: '시니어 (8년+)', value: 'senior' },
        { name: '리드/팀장', value: 'lead' }
      ]
    }
  ]);

  const spinner = ora('평가 기준표 생성 중...').start();

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3500,
      messages: [
        {
          role: 'user',
          content: `채용 면접 전문가로서 후보자 평가 기준표(Rubric)를 작성해주세요.

## 포지션 정보
- 직무: ${position}
- 레벨: ${getLevelKorean(level)}

## 평가 기준표 요청

### 1. 평가 영역 정의

| 영역 | 가중치 | 설명 |
|------|--------|------|
| 기술 역량 | 30% | ... |
| 문제 해결력 | 20% | ... |
| 커뮤니케이션 | 15% | ... |
| 문화 Fit | 15% | ... |
| 성장 잠재력 | 10% | ... |
| 리더십 | 10% | ... |

### 2. 점수 체계 (1-5점)

각 영역별:

**기술 역량**
- 5점 (탁월): ...
- 4점 (우수): ...
- 3점 (보통): ...
- 2점 (미흡): ...
- 1점 (부족): ...

(모든 영역 동일하게)

### 3. 평가 시트 템플릿

\`\`\`
후보자명: _______________
포지션: ${position}
면접일: _______________
면접관: _______________

| 영역 | 점수(1-5) | 근거/메모 |
|------|-----------|-----------|
| 기술 역량 | | |
| 문제 해결력 | | |
| ... | | |

총점: ___ / 25
가중 점수: ___ / 100

종합 의견:

추천: □ Strong Hire  □ Hire  □ Maybe  □ No Hire  □ Strong No Hire
\`\`\`

### 4. 합격선 가이드
- Strong Hire: 80점 이상
- Hire: 65-79점
- Maybe: 50-64점
- No Hire: 50점 미만

### 5. 면접관간 캘리브레이션 가이드
- 평가 일관성 유지 방법
- 의견 충돌 시 해결 방법`
        }
      ]
    });

    spinner.stop();

    const textContent = response.content.find(c => c.type === 'text');
    if (textContent && textContent.type === 'text') {
      console.log(chalk.bold.green('\n✨ 평가 기준표가 생성되었습니다!\n'));
      console.log(chalk.gray('─'.repeat(60)));
      console.log(textContent.text);
      console.log(chalk.gray('─'.repeat(60)));

      const { save } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'save',
          message: '파일로 저장하시겠습니까?',
          default: true
        }
      ]);

      if (save) {
        const filename = `evaluation-rubric-${position.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.md`;
        const filepath = await saveContent(filename, textContent.text);
        console.log(chalk.green(`\n저장됨: ${filepath}\n`));
      }
    }
  } catch (error) {
    spinner.stop();
    console.log(chalk.red('기준표 생성 중 오류가 발생했습니다:'), error);
  }
}

async function createInterviewerGuide(): Promise<void> {
  const { position } = await inquirer.prompt([
    {
      type: 'input',
      name: 'position',
      message: '포지션명:',
      default: 'Backend Developer'
    }
  ]);

  const spinner = ora('면접관 가이드 생성 중...').start();

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: `채용 전문가로서 면접관 가이드를 작성해주세요.

## 포지션: ${position}
## 회사 문화: ${companyInfo.culture.join(', ')}

## 면접관 가이드 요청

### 1. 면접 전 준비

**사전 검토 항목**
- 이력서에서 봐야 할 포인트
- 포트폴리오/GitHub 확인 사항
- 준비해야 할 질문

**환경 세팅**
- 대면 면접 시
- 화상 면접 시

### 2. 면접 진행 플로우

**오프닝 (5분)**
- 자기 소개
- 아이스브레이킹
- 면접 구조 안내

**본 면접 (40-50분)**
- 시간 배분
- 질문 순서
- 꼬리 질문 방법

**클로징 (5분)**
- 역질문 유도
- 다음 단계 안내
- 마무리

### 3. 질문 테크닉

**STAR 방식 유도하기**
- 상황(Situation) 질문
- 과제(Task) 파악
- 행동(Action) 구체화
- 결과(Result) 확인

**꼬리 질문 예시**
- "구체적으로 어떤 행동을 하셨나요?"
- "그 결과는 어땠나요?"
- ...

### 4. 금지 사항

**법적 문제**
- 물어보면 안 되는 질문 (나이, 결혼, 종교 등)

**무의식적 편견**
- 주의해야 할 편견
- 공정한 평가 방법

### 5. 좋은 시그널 vs 우려 시그널

**Green Flags**
- ...

**Red Flags**
- ...

### 6. 면접 후

**피드백 작성**
- 즉시 기록할 것
- 피드백 양식

**디브리핑**
- 면접관 간 논의 방법`
        }
      ]
    });

    spinner.stop();

    const textContent = response.content.find(c => c.type === 'text');
    if (textContent && textContent.type === 'text') {
      console.log(chalk.bold.green('\n✨ 면접관 가이드가 생성되었습니다!\n'));
      console.log(chalk.gray('─'.repeat(60)));
      console.log(textContent.text);
      console.log(chalk.gray('─'.repeat(60)));

      const { save } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'save',
          message: '파일로 저장하시겠습니까?',
          default: true
        }
      ]);

      if (save) {
        const filename = `interviewer-guide-${Date.now()}.md`;
        const filepath = await saveContent(filename, textContent.text);
        console.log(chalk.green(`\n저장됨: ${filepath}\n`));
      }
    }
  } catch (error) {
    spinner.stop();
    console.log(chalk.red('가이드 생성 중 오류가 발생했습니다:'), error);
  }
}

async function designTechnicalInterview(): Promise<void> {
  const info = await inquirer.prompt([
    {
      type: 'input',
      name: 'position',
      message: '포지션명:',
      default: 'Backend Developer'
    },
    {
      type: 'input',
      name: 'techStack',
      message: '기술 스택 (쉼표로 구분):',
      default: 'Node.js, TypeScript, PostgreSQL, AWS'
    },
    {
      type: 'list',
      name: 'level',
      message: '레벨:',
      choices: [
        { name: '주니어 (1-3년)', value: 'junior' },
        { name: '미드레벨 (4-7년)', value: 'mid' },
        { name: '시니어 (8년+)', value: 'senior' }
      ]
    },
    {
      type: 'list',
      name: 'format',
      message: '면접 형식:',
      choices: [
        { name: '라이브 코딩', value: 'live_coding' },
        { name: '시스템 설계', value: 'system_design' },
        { name: '기술 인터뷰 (구두)', value: 'verbal' },
        { name: '종합 (모두 포함)', value: 'all' }
      ]
    }
  ]);

  const spinner = ora('기술 면접 설계 중...').start();

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: `기술 면접 전문가로서 기술 면접을 설계해주세요.

## 포지션 정보
- 직무: ${info.position}
- 기술 스택: ${info.techStack}
- 레벨: ${getLevelKorean(info.level)}
- 형식: ${info.format === 'all' ? '종합' : info.format}

## 기술 면접 설계

${info.format === 'live_coding' || info.format === 'all' ? `
### 라이브 코딩

**문제 1: ${info.level === 'junior' ? '기초' : '중급'}**
- 문제 설명
- 예상 소요 시간
- 평가 포인트
- 힌트 제공 시점

**문제 2: ${info.level === 'senior' ? '심화' : '중급'}**
- ...

**평가 기준**
- 코드 품질
- 문제 해결 과정
- 커뮤니케이션
- 시간 관리
` : ''}

${info.format === 'system_design' || info.format === 'all' ? `
### 시스템 설계

**문제: ${info.level === 'junior' ? '소규모 시스템' : '대규모 시스템'}**
- 문제 설명
- 예상 소요 시간: 45분

**평가 포인트**
- 요구사항 파악
- 아키텍처 설계
- 트레이드오프 설명
- 확장성 고려

**기대하는 논의 주제**
- ...

**단계별 진행**
1. 요구사항 명확화 (5분)
2. 고수준 설계 (15분)
3. 상세 설계 (15분)
4. 확장성/병목 (10분)
` : ''}

${info.format === 'verbal' || info.format === 'all' ? `
### 기술 인터뷰 (구두)

**${info.techStack.split(',')[0].trim()} 관련 질문**
1. ...
2. ...

**CS 기초**
1. ...
2. ...

**아키텍처/설계**
1. ...
2. ...

**트러블슈팅 시나리오**
- 상황 설명
- 기대하는 접근 방법
` : ''}

### 시간 배분 가이드
| 단계 | 시간 | 내용 |
|------|------|------|
| ... | ... | ... |

### 면접관 체크리스트
- [ ] 환경 테스트 완료
- [ ] 문제지 준비
- [ ] 평가표 준비
- [ ] 후보자 이력서 검토`
        }
      ]
    });

    spinner.stop();

    const textContent = response.content.find(c => c.type === 'text');
    if (textContent && textContent.type === 'text') {
      console.log(chalk.bold.green('\n✨ 기술 면접이 설계되었습니다!\n'));
      console.log(chalk.gray('─'.repeat(60)));
      console.log(textContent.text);
      console.log(chalk.gray('─'.repeat(60)));

      const { save } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'save',
          message: '파일로 저장하시겠습니까?',
          default: true
        }
      ]);

      if (save) {
        const filename = `technical-interview-${info.position.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.md`;
        const filepath = await saveContent(filename, textContent.text);
        console.log(chalk.green(`\n저장됨: ${filepath}\n`));
      }
    }
  } catch (error) {
    spinner.stop();
    console.log(chalk.red('면접 설계 중 오류가 발생했습니다:'), error);
  }
}
