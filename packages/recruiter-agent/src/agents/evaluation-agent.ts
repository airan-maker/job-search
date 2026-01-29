import Anthropic from '@anthropic-ai/sdk';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { saveContent, getLevelKorean } from '../utils/index.js';

const client = new Anthropic();

export async function evaluateCandidate(): Promise<void> {
  console.log(chalk.bold.blue('\n=== 후보자 평가 ===\n'));

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: '무엇을 하시겠습니까?',
      choices: [
        { name: '📄 이력서 스크리닝 체크리스트', value: 'screening' },
        { name: '⚖️ 후보자 비교 분석', value: 'compare' },
        { name: '📞 레퍼런스 체크 가이드', value: 'reference' },
        { name: '💰 오퍼 협상 가이드', value: 'offer' },
        { name: '← 돌아가기', value: 'back' }
      ]
    }
  ]);

  if (action === 'back') return;

  if (action === 'screening') {
    await createScreeningChecklist();
  } else if (action === 'compare') {
    await compareCandidates();
  } else if (action === 'reference') {
    await createReferenceGuide();
  } else if (action === 'offer') {
    await createOfferGuide();
  }
}

async function createScreeningChecklist(): Promise<void> {
  const { position, level, mustHaves } = await inquirer.prompt([
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
        { name: '시니어 (8년+)', value: 'senior' }
      ]
    },
    {
      type: 'input',
      name: 'mustHaves',
      message: '필수 요건 (쉼표로 구분):',
      default: 'Node.js 경험, API 개발 경험, 협업 경험'
    }
  ]);

  const spinner = ora('스크리닝 체크리스트 생성 중...').start();

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      messages: [
        {
          role: 'user',
          content: `채용 담당자로서 이력서 스크리닝 체크리스트를 작성해주세요.

## 포지션 정보
- 직무: ${position}
- 레벨: ${getLevelKorean(level)}
- 필수 요건: ${mustHaves}

## 스크리닝 체크리스트

### 1. 즉시 탈락 기준 (Knockout)
□ ...
□ ...

### 2. 필수 요건 체크
| 요건 | 충족 | 미충족 | 메모 |
|------|------|--------|------|
| ${mustHaves.split(',').join(' | | | |\n| ')} | | | |

### 3. 우대 사항 체크
□ ...
□ ...

### 4. 이력서 품질 평가
- 구조/가독성: □ 좋음  □ 보통  □ 나쁨
- 구체성: □ 좋음  □ 보통  □ 나쁨
- 성과 기술: □ 좋음  □ 보통  □ 나쁨

### 5. 경력 패턴 분석
- 이직 주기:
- 경력 성장: □ 성장 트렌드  □ 정체  □ 불분명
- 공백 기간:

### 6. 점수 체계
| 항목 | 점수 (1-5) |
|------|-----------|
| 경력 적합도 | |
| 기술 매칭 | |
| 성과/임팩트 | |
| 성장 가능성 | |
| **총점** | /20 |

### 7. 다음 단계 결정
- 16점 이상: 즉시 연락
- 12-15점: 추가 검토 후 결정
- 12점 미만: 보류/탈락

### 8. 스크리닝 시 주의사항
- ...`
        }
      ]
    });

    spinner.stop();

    const textContent = response.content.find(c => c.type === 'text');
    if (textContent && textContent.type === 'text') {
      console.log(chalk.bold.green('\n✨ 스크리닝 체크리스트\n'));
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
        const filename = `screening-checklist-${position.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.md`;
        const filepath = await saveContent(filename, textContent.text);
        console.log(chalk.green(`\n저장됨: ${filepath}\n`));
      }
    }
  } catch (error) {
    spinner.stop();
    console.log(chalk.red('체크리스트 생성 중 오류가 발생했습니다:'), error);
  }
}

async function compareCandidates(): Promise<void> {
  console.log(chalk.cyan('\n후보자 정보를 입력해주세요 (2-4명):\n'));

  const candidates: Array<{name: string; summary: string}> = [];
  let addMore = true;

  while (addMore && candidates.length < 4) {
    const { name, summary } = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: `후보자 ${candidates.length + 1} 이름:`,
        default: `후보자 ${candidates.length + 1}`
      },
      {
        type: 'input',
        name: 'summary',
        message: '간략 프로필 (경력, 기술, 면접 결과 등):',
      }
    ]);

    candidates.push({ name, summary });

    if (candidates.length < 4) {
      const { more } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'more',
          message: '후보자를 더 추가하시겠습니까?',
          default: candidates.length < 2
        }
      ]);
      addMore = more;
    }
  }

  if (candidates.length < 2) {
    console.log(chalk.yellow('비교를 위해 최소 2명의 후보자가 필요합니다.'));
    return;
  }

  const { position } = await inquirer.prompt([
    {
      type: 'input',
      name: 'position',
      message: '포지션명:',
      default: 'Backend Developer'
    }
  ]);

  const spinner = ora('후보자 비교 분석 중...').start();

  try {
    const candidateInfo = candidates.map((c, i) => `
**후보자 ${i + 1}: ${c.name}**
${c.summary}
`).join('\n');

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: `채용 전문가로서 후보자들을 비교 분석해주세요.

## 포지션: ${position}

## 후보자 정보
${candidateInfo}

## 비교 분석 요청

### 1. 비교 매트릭스

| 평가 항목 | ${candidates.map(c => c.name).join(' | ')} |
|----------|${candidates.map(() => '---').join('|')}|
| 경력 적합도 | | |
| 기술 역량 | | |
| 문화 Fit | | |
| 성장 잠재력 | | |
| 리더십 | | |
| 커뮤니케이션 | | |
| **총점** | | |

(각 항목 1-5점)

### 2. 개별 분석

${candidates.map(c => `
**${c.name}**
- 강점:
- 약점:
- 리스크:
- 적합한 역할:
`).join('')}

### 3. 순위 및 추천

**1순위:**
- 이유:
- 주의 사항:

**2순위:**
- 이유:
- 아쉬운 점:

### 4. 의사결정 가이드

**${candidates[0].name}을 선택한다면:**
- 기대 효과:
- 리스크 관리:

**${candidates[1].name}을 선택한다면:**
- 기대 효과:
- 리스크 관리:

### 5. 최종 추천
(명확한 추천과 근거)`
        }
      ]
    });

    spinner.stop();

    const textContent = response.content.find(c => c.type === 'text');
    if (textContent && textContent.type === 'text') {
      console.log(chalk.bold.green('\n✨ 후보자 비교 분석\n'));
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
        const filename = `candidate-comparison-${Date.now()}.md`;
        const filepath = await saveContent(filename, textContent.text);
        console.log(chalk.green(`\n저장됨: ${filepath}\n`));
      }
    }
  } catch (error) {
    spinner.stop();
    console.log(chalk.red('비교 분석 중 오류가 발생했습니다:'), error);
  }
}

async function createReferenceGuide(): Promise<void> {
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
        { name: '주니어', value: 'junior' },
        { name: '미드레벨', value: 'mid' },
        { name: '시니어', value: 'senior' },
        { name: '리드/매니저', value: 'lead' }
      ]
    }
  ]);

  const spinner = ora('레퍼런스 체크 가이드 생성 중...').start();

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      messages: [
        {
          role: 'user',
          content: `채용 전문가로서 레퍼런스 체크 가이드를 작성해주세요.

## 포지션: ${position} (${getLevelKorean(level)})

## 레퍼런스 체크 가이드

### 1. 사전 준비

**레퍼런스 요청**
- 후보자에게 요청할 레퍼런스 수
- 필수 레퍼런스 (직속 상사, 동료 등)
- 레퍼런스 요청 이메일 템플릿

### 2. 레퍼런스 체크 질문

**도입 (2분)**
- 자기소개
- 관계 확인
- 기간 확인

**성과/업무 (10분)**
1. [후보자]와 함께 일하신 기간과 관계를 말씀해주시겠어요?
2. [후보자]의 주요 업무와 성과는 무엇이었나요?
3. 팀에서 어떤 역할을 했나요?
4. 가장 인상적인 프로젝트나 성과는?

**강점/개선점 (5분)**
5. [후보자]의 가장 큰 강점 3가지는?
6. 개선이 필요한 영역은?
7. 피드백을 어떻게 받아들였나요?

**협업/리더십 (5분)**
8. 팀 내 협업 스타일은 어땠나요?
9. 갈등 상황에서 어떻게 대처했나요?
${level === 'lead' ? '10. 리더로서 어떤 스타일이었나요?\n11. 팀원 성장에 어떻게 기여했나요?' : ''}

**마무리 (3분)**
12. 다시 함께 일하고 싶으신가요? (1-10점)
13. 이 역할에 적합하다고 생각하시나요?
14. 제가 알아야 할 다른 것이 있을까요?

### 3. Red Flags
- 주의해야 할 답변 패턴
- 추가 확인이 필요한 신호

### 4. 레퍼런스 체크 기록 양식

\`\`\`
후보자: _______________
레퍼런스: _______________ (관계: _______)
일시: _______________

| 질문 | 답변 요약 | 점수(1-5) |
|------|----------|-----------|
| ... | ... | ... |

종합 의견:
추천도 (1-10): ___
\`\`\`

### 5. 법적 주의사항
- 물어보면 안 되는 것
- 동의 필요 사항`
        }
      ]
    });

    spinner.stop();

    const textContent = response.content.find(c => c.type === 'text');
    if (textContent && textContent.type === 'text') {
      console.log(chalk.bold.green('\n✨ 레퍼런스 체크 가이드\n'));
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
        const filename = `reference-check-guide-${Date.now()}.md`;
        const filepath = await saveContent(filename, textContent.text);
        console.log(chalk.green(`\n저장됨: ${filepath}\n`));
      }
    }
  } catch (error) {
    spinner.stop();
    console.log(chalk.red('가이드 생성 중 오류가 발생했습니다:'), error);
  }
}

async function createOfferGuide(): Promise<void> {
  const info = await inquirer.prompt([
    {
      type: 'input',
      name: 'position',
      message: '포지션명:',
      default: 'Backend Developer'
    },
    {
      type: 'input',
      name: 'budgetMin',
      message: '예산 (최소, 만원):',
      default: '5000'
    },
    {
      type: 'input',
      name: 'budgetMax',
      message: '예산 (최대, 만원):',
      default: '7000'
    },
    {
      type: 'input',
      name: 'candidateExpectation',
      message: '후보자 희망 연봉 (만원, 모르면 빈칸):',
    }
  ]);

  const spinner = ora('오퍼 협상 가이드 생성 중...').start();

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      messages: [
        {
          role: 'user',
          content: `채용 전문가로서 오퍼 협상 가이드를 작성해주세요.

## 상황
- 포지션: ${info.position}
- 예산: ${info.budgetMin}만원 ~ ${info.budgetMax}만원
${info.candidateExpectation ? `- 후보자 희망: ${info.candidateExpectation}만원` : '- 후보자 희망: 미확인'}

## 오퍼 협상 가이드

### 1. 오퍼 전 준비

**시장 데이터 확인**
- 포지션 시장 연봉 범위
- 경쟁사 수준

**협상 카드 정리**
- 사용 가능한 협상 카드
  - 기본급
  - 사이닝 보너스
  - 스톡옵션/RSU
  - 연차
  - 입사일
  - 원격근무
  - 교육비
  - ...

### 2. 오퍼 시나리오

**시나리오 1: 예산 내**
- 첫 제안: ${Math.round(parseInt(info.budgetMin) * 0.95)}만원
- 타겟: ${info.budgetMin}만원
- 최대: ${info.budgetMax}만원

**시나리오 2: 예산 초과 요청 시**
- 대응 전략
- 대안 제시

**시나리오 3: 다른 오퍼와 경쟁 시**
- 차별화 포인트
- 빠른 의사결정 유도

### 3. 협상 스크립트

**오퍼 전달**
"..."

**희망 연봉 질문 시**
"..."

**더 높은 금액 요청 시**
"..."

**다른 오퍼 언급 시**
"..."

**시간이 필요하다고 할 때**
"..."

### 4. 클로징 전략

**의사결정 촉진**
- 데드라인 설정
- 희소성 강조
- 감정적 연결

**최종 클로징 멘트**
"..."

### 5. 오퍼 레터 체크리스트
- [ ] 포지션/직급
- [ ] 시작일
- [ ] 연봉 (세전/세후 명시)
- [ ] 보너스 조건
- [ ] 수습 기간
- [ ] 응답 기한
- [ ] 서명란`
        }
      ]
    });

    spinner.stop();

    const textContent = response.content.find(c => c.type === 'text');
    if (textContent && textContent.type === 'text') {
      console.log(chalk.bold.green('\n✨ 오퍼 협상 가이드\n'));
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
        const filename = `offer-negotiation-guide-${Date.now()}.md`;
        const filepath = await saveContent(filename, textContent.text);
        console.log(chalk.green(`\n저장됨: ${filepath}\n`));
      }
    }
  } catch (error) {
    spinner.stop();
    console.log(chalk.red('가이드 생성 중 오류가 발생했습니다:'), error);
  }
}
