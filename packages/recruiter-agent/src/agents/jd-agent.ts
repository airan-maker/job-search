import Anthropic from '@anthropic-ai/sdk';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { companyInfo, saveContent, getLevelKorean, getRemoteKorean } from '../utils/index.js';

const client = new Anthropic();

export async function createJobDescription(): Promise<void> {
  console.log(chalk.bold.blue('\n=== JD (Job Description) 작성 ===\n'));

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: '무엇을 하시겠습니까?',
      choices: [
        { name: '📝 새 JD 작성', value: 'create' },
        { name: '✨ 기존 JD 개선', value: 'improve' },
        { name: '🔍 경쟁사 JD 분석', value: 'analyze' },
        { name: '📋 JD 체크리스트', value: 'checklist' },
        { name: '← 돌아가기', value: 'back' }
      ]
    }
  ]);

  if (action === 'back') return;

  if (action === 'create') {
    await createNewJD();
  } else if (action === 'improve') {
    await improveJD();
  } else if (action === 'analyze') {
    await analyzeCompetitorJD();
  } else if (action === 'checklist') {
    await showJDChecklist();
  }
}

async function createNewJD(): Promise<void> {
  // 포지션 정보 수집
  const positionInfo = await inquirer.prompt([
    {
      type: 'input',
      name: 'title',
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
        { name: '리드/팀장', value: 'lead' },
        { name: '매니저', value: 'manager' }
      ]
    },
    {
      type: 'input',
      name: 'department',
      message: '소속 팀/부서:',
      default: '개발팀'
    },
    {
      type: 'list',
      name: 'remote',
      message: '근무 형태:',
      choices: [
        { name: '사무실 출근', value: 'onsite' },
        { name: '하이브리드', value: 'hybrid' },
        { name: '완전 원격', value: 'remote' }
      ]
    },
    {
      type: 'input',
      name: 'techStack',
      message: '주요 기술 스택 (쉼표로 구분):',
      default: 'Node.js, TypeScript, PostgreSQL'
    },
    {
      type: 'input',
      name: 'keyResponsibilities',
      message: '핵심 업무 (쉼표로 구분):',
      default: 'API 개발, 시스템 설계, 코드 리뷰'
    }
  ]);

  const { tone } = await inquirer.prompt([
    {
      type: 'list',
      name: 'tone',
      message: 'JD 톤앤매너:',
      choices: [
        { name: '전문적/격식체', value: 'formal' },
        { name: '친근/캐주얼', value: 'casual' },
        { name: '열정적/스타트업', value: 'startup' }
      ]
    }
  ]);

  const spinner = ora('JD 생성 중...').start();

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3500,
      messages: [
        {
          role: 'user',
          content: `채용 전문가로서 매력적인 JD(Job Description)를 작성해주세요.

## 회사 정보
- 회사명: ${companyInfo.name}
- 산업: ${companyInfo.industry}
- 규모: ${companyInfo.size}
- 문화: ${companyInfo.culture.join(', ')}
- 복지: ${companyInfo.benefits.join(', ')}
${companyInfo.mission ? `- 미션: ${companyInfo.mission}` : ''}

## 포지션 정보
- 포지션: ${positionInfo.title}
- 레벨: ${getLevelKorean(positionInfo.level)}
- 부서: ${positionInfo.department}
- 근무형태: ${getRemoteKorean(positionInfo.remote)}
- 기술스택: ${positionInfo.techStack}
- 핵심업무: ${positionInfo.keyResponsibilities}

## 톤앤매너
${tone === 'formal' ? '전문적이고 격식있는 톤' : tone === 'casual' ? '친근하고 캐주얼한 톤' : '열정적이고 스타트업스러운 톤'}

## JD 구조

### 1. 포지션 소개 (2-3문장)
- 이 포지션의 임팩트
- 어떤 사람을 찾는지

### 2. 주요 업무 (5-7개)
- 구체적이고 명확하게
- 동사로 시작

### 3. 자격 요건 (5-7개)
- Must-have만 포함
- 연차보다는 역량 중심

### 4. 우대 사항 (3-5개)
- Nice-to-have
- 너무 많지 않게

### 5. 이런 분을 찾습니다 (소프트 스킬)
- 문화 fit
- 성향/태도

### 6. 합류하시면 (혜택/성장)
- 복지
- 성장 기회
- 팀 환경

### 7. 채용 프로세스
- 단계별 설명

---

추가로 다음도 제공해주세요:
- **SEO 키워드** (5개): 채용 플랫폼 검색 최적화용
- **개선 포인트**: 더 매력적으로 만들 수 있는 제안`
        }
      ]
    });

    spinner.stop();

    const textContent = response.content.find(c => c.type === 'text');
    if (textContent && textContent.type === 'text') {
      console.log(chalk.bold.green('\n✨ JD가 생성되었습니다!\n'));
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
        const filename = `jd-${positionInfo.title.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.md`;
        const filepath = await saveContent(filename, textContent.text);
        console.log(chalk.green(`\n저장됨: ${filepath}\n`));
      }
    }
  } catch (error) {
    spinner.stop();
    console.log(chalk.red('JD 생성 중 오류가 발생했습니다:'), error);
  }
}

async function improveJD(): Promise<void> {
  const { existingJD } = await inquirer.prompt([
    {
      type: 'editor',
      name: 'existingJD',
      message: '개선할 JD를 붙여넣으세요 (에디터가 열립니다):',
    }
  ]);

  if (!existingJD || existingJD.trim().length < 50) {
    console.log(chalk.yellow('JD 내용이 너무 짧습니다.'));
    return;
  }

  const spinner = ora('JD 분석 및 개선 중...').start();

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3500,
      messages: [
        {
          role: 'user',
          content: `채용 전문가로서 다음 JD를 분석하고 개선해주세요.

## 기존 JD
${existingJD}

## 분석 및 개선 요청

### 1. 현재 JD 분석
**강점:**
- ...

**약점:**
- ...

**빠진 요소:**
- ...

### 2. 개선된 JD
(전체 JD 다시 작성)

### 3. 변경 사항 요약
- 무엇을 왜 바꿨는지

### 4. 추가 제안
- 더 매력적으로 만들 수 있는 방법

### 5. 포용적 언어 검토
- 무의식적 편견이 있는 표현 체크
- 더 포용적인 대안 제시`
        }
      ]
    });

    spinner.stop();

    const textContent = response.content.find(c => c.type === 'text');
    if (textContent && textContent.type === 'text') {
      console.log(chalk.bold.green('\n✨ JD 개선안\n'));
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
        const filename = `jd-improved-${Date.now()}.md`;
        const filepath = await saveContent(filename, textContent.text);
        console.log(chalk.green(`\n저장됨: ${filepath}\n`));
      }
    }
  } catch (error) {
    spinner.stop();
    console.log(chalk.red('분석 중 오류가 발생했습니다:'), error);
  }
}

async function analyzeCompetitorJD(): Promise<void> {
  const { position } = await inquirer.prompt([
    {
      type: 'input',
      name: 'position',
      message: '분석할 포지션 (예: Backend Developer):',
      default: 'Backend Developer'
    }
  ]);

  const spinner = ora('경쟁사 JD 트렌드 분석 중...').start();

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      tools: [
        {
          type: 'web_search_20250305',
          name: 'web_search',
          max_uses: 5
        }
      ],
      messages: [
        {
          role: 'user',
          content: `"${position} 채용", "${position} JD", "${position} 모집" 등을 검색하여 현재 채용 시장 트렌드를 분석해주세요.

## 분석 요청

### 1. 공통 요구사항
- 대부분의 JD에서 요구하는 것들

### 2. 차별화 포인트
- 눈에 띄는 JD들의 특징
- 독특한 표현이나 접근

### 3. 연봉 트렌드
- 시장 연봉 범위
- 레벨별 차이

### 4. 기술 스택 트렌드
- 많이 요구되는 기술
- 떠오르는 기술

### 5. 복지/혜택 트렌드
- 요즘 많이 제공하는 복지
- 차별화되는 혜택

### 6. 우리 JD에 적용할 점
- 벤치마킹할 요소
- 차별화 전략`
        }
      ]
    });

    spinner.stop();

    let fullText = '';
    for (const block of response.content) {
      if (block.type === 'text') {
        fullText += block.text;
      }
    }

    if (fullText) {
      console.log(chalk.bold.green('\n✨ 경쟁사 JD 분석 결과\n'));
      console.log(chalk.gray('─'.repeat(60)));
      console.log(fullText);
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
        const filename = `jd-analysis-${position.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.md`;
        const filepath = await saveContent(filename, fullText);
        console.log(chalk.green(`\n저장됨: ${filepath}\n`));
      }
    }
  } catch (error) {
    spinner.stop();
    console.log(chalk.red('분석 중 오류가 발생했습니다:'), error);
  }
}

async function showJDChecklist(): Promise<void> {
  console.log(chalk.bold.green('\n📋 JD 체크리스트\n'));
  console.log(chalk.gray('─'.repeat(60)));

  const checklist = `
## 필수 요소
□ 명확한 포지션명
□ 구체적인 업무 내용 (5-7개)
□ 자격 요건 (역량 중심, 연차 X)
□ 회사/팀 소개
□ 복지 및 혜택
□ 채용 프로세스

## 매력도 체크
□ 첫 2문장이 후보자의 관심을 끄는가?
□ "나"의 성장과 임팩트가 보이는가?
□ 구체적인 숫자/사례가 있는가?
□ 회사의 비전/미션이 드러나는가?

## 포용성 체크
□ 성별 중립적 언어 사용
□ 나이 관련 차별적 표현 제거
□ "~맨", "젊은" 등 편향된 표현 제거
□ 불필요한 학력 요건 제거

## SEO 최적화
□ 검색 키워드 포함 (기술명, 포지션명)
□ 지역명 포함 (해당시)
□ 적절한 길이 (너무 길지 않게)

## 행동 유도
□ 명확한 지원 방법
□ 지원 마감일
□ 담당자 연락처
□ 질문 가능 여부
`;

  console.log(checklist);
  console.log(chalk.gray('─'.repeat(60) + '\n'));
}
