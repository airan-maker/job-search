import Anthropic from '@anthropic-ai/sdk';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { companyInfo, saveContent, getLevelKorean } from '../utils/index.js';

const client = new Anthropic();

export async function sourcingStrategy(): Promise<void> {
  console.log(chalk.bold.blue('\n=== 후보자 소싱 전략 ===\n'));

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: '무엇을 하시겠습니까?',
      choices: [
        { name: '🎯 타겟 페르소나 정의', value: 'persona' },
        { name: '📍 소싱 채널 전략', value: 'channels' },
        { name: '✉️ 아웃리치 메시지 템플릿', value: 'outreach' },
        { name: '🎁 추천 채용 프로그램', value: 'referral' },
        { name: '← 돌아가기', value: 'back' }
      ]
    }
  ]);

  if (action === 'back') return;

  if (action === 'persona') {
    await defineCandidatePersona();
  } else if (action === 'channels') {
    await createChannelStrategy();
  } else if (action === 'outreach') {
    await createOutreachTemplates();
  } else if (action === 'referral') {
    await designReferralProgram();
  }
}

async function defineCandidatePersona(): Promise<void> {
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

  const spinner = ora('타겟 페르소나 분석 중...').start();

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: `채용 전문가로서 이상적인 후보자 페르소나를 정의해주세요.

## 포지션
- 직무: ${position}
- 레벨: ${getLevelKorean(level)}
- 회사: ${companyInfo.name} (${companyInfo.industry}, ${companyInfo.size})

## 페르소나 정의 요청

### 페르소나 1: 이상적 후보자
**프로필**
- 현재 상황 (어디서 일하는지, 무엇을 하는지)
- 경력 경로
- 기술 스택

**동기**
- 이직을 고려하는 이유
- 다음 커리어에서 원하는 것
- 피하고 싶은 것

**정보 탐색 행동**
- 어디서 정보를 얻는지
- 누구의 의견을 신뢰하는지
- 이직 결정 시 중요하게 보는 것

**우리 회사 매력 포인트**
- 이 사람에게 어필할 수 있는 점
- 강조해야 할 메시지

### 페르소나 2: 숨은 보석
(적극적으로 이직 안 찾지만 좋은 기회에는 열려있는 사람)

### 페르소나 3: 경쟁사 인재
(경쟁사에서 스카우트하고 싶은 인재)

---

### 공통 분석
**Red Flags** (피해야 할 후보자 특성)
**Green Flags** (우선 연락할 후보자 특성)
**소싱 우선순위** (어떤 페르소나부터 공략할지)`
        }
      ]
    });

    spinner.stop();

    const textContent = response.content.find(c => c.type === 'text');
    if (textContent && textContent.type === 'text') {
      console.log(chalk.bold.green('\n✨ 타겟 페르소나 정의\n'));
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
        const filename = `persona-${position.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.md`;
        const filepath = await saveContent(filename, textContent.text);
        console.log(chalk.green(`\n저장됨: ${filepath}\n`));
      }
    }
  } catch (error) {
    spinner.stop();
    console.log(chalk.red('분석 중 오류가 발생했습니다:'), error);
  }
}

async function createChannelStrategy(): Promise<void> {
  const { position, budget } = await inquirer.prompt([
    {
      type: 'input',
      name: 'position',
      message: '포지션명:',
      default: 'Backend Developer'
    },
    {
      type: 'list',
      name: 'budget',
      message: '채용 예산:',
      choices: [
        { name: '없음 (무료 채널만)', value: 'free' },
        { name: '소규모 (월 100만원 이하)', value: 'small' },
        { name: '중규모 (월 100-500만원)', value: 'medium' },
        { name: '대규모 (월 500만원+)', value: 'large' }
      ]
    }
  ]);

  const spinner = ora('소싱 채널 전략 수립 중...').start();

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: `채용 전문가로서 소싱 채널 전략을 수립해주세요.

## 상황
- 포지션: ${position}
- 회사: ${companyInfo.name} (${companyInfo.stage})
- 예산: ${budget === 'free' ? '무료 채널만' : budget === 'small' ? '월 100만원 이하' : budget === 'medium' ? '월 100-500만원' : '월 500만원+'}

## 채널 전략 요청

### 1. 채널 우선순위 매트릭스

| 채널 | 효과 | 비용 | 우선순위 | 예상 리드 |
|------|-----|------|---------|---------|

### 2. 무료 채널 전략

**LinkedIn**
- 검색 필터 설정
- 연락 방법
- Boolean 검색어

**GitHub**
- 타겟 레포/프로젝트
- 기여자 분석 방법

**개발자 커뮤니티**
- 타겟 커뮤니티 (velog, OKKY, GeekNews 등)
- 참여 방법

**추천 채용 (Referral)**
- 내부 직원 활용
- 네트워크 활용

### 3. 유료 채널 전략 ${budget !== 'free' ? `

**채용 플랫폼**
- 원티드, 로켓펀치, 점핏 등
- 각 플랫폼 특성 및 추천

**LinkedIn Recruiter**
- 사용 팁
- InMail 전략

**헤드헌터**
- 언제 사용해야 하는지
- 협업 방법
` : '(예산 없음으로 건너뜀)'}

### 4. 주간 액션 플랜

**1주차**
- ...

**2주차**
- ...

### 5. 성과 측정
- 추적할 메트릭
- 목표 설정`
        }
      ]
    });

    spinner.stop();

    const textContent = response.content.find(c => c.type === 'text');
    if (textContent && textContent.type === 'text') {
      console.log(chalk.bold.green('\n✨ 소싱 채널 전략\n'));
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
        const filename = `sourcing-strategy-${Date.now()}.md`;
        const filepath = await saveContent(filename, textContent.text);
        console.log(chalk.green(`\n저장됨: ${filepath}\n`));
      }
    }
  } catch (error) {
    spinner.stop();
    console.log(chalk.red('전략 수립 중 오류가 발생했습니다:'), error);
  }
}

async function createOutreachTemplates(): Promise<void> {
  const { position, channel } = await inquirer.prompt([
    {
      type: 'input',
      name: 'position',
      message: '포지션명:',
      default: 'Backend Developer'
    },
    {
      type: 'list',
      name: 'channel',
      message: '채널 선택:',
      choices: [
        { name: 'LinkedIn', value: 'linkedin' },
        { name: '이메일', value: 'email' },
        { name: '개발자 커뮤니티 DM', value: 'community' },
        { name: '전체 (모든 채널)', value: 'all' }
      ]
    }
  ]);

  const spinner = ora('아웃리치 템플릿 생성 중...').start();

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3500,
      messages: [
        {
          role: 'user',
          content: `채용 전문가로서 후보자 아웃리치 메시지 템플릿을 작성해주세요.

## 상황
- 포지션: ${position}
- 회사: ${companyInfo.name}
- 채널: ${channel === 'all' ? '모든 채널' : channel}

## 템플릿 요청

${channel === 'linkedin' || channel === 'all' ? `
### LinkedIn 메시지

**1차 연락 (Connection Request)**
- 짧고 개인화된 메시지
- 150자 이내

**2차 연락 (InMail/메시지)**
- 관심 끌기
- 포지션 소개
- 다음 단계 제안

**팔로업 (응답 없을 때)**
- 1주일 후
- 2주일 후

**관심 표현 시 답장**
- 상세 정보 제공
- 미팅 제안
` : ''}

${channel === 'email' || channel === 'all' ? `
### 이메일

**제목 옵션 (3개)**
- 높은 오픈율 위한 제목

**본문 템플릿**
- 개인화 포인트 표시 [이름], [경력], [프로젝트]
- 간결하게
- 명확한 CTA

**시그니처**
- 추천 형식
` : ''}

${channel === 'community' || channel === 'all' ? `
### 개발자 커뮤니티 DM

**톤앤매너**
- 개발자 커뮤니티에 맞는 톤
- 스팸처럼 보이지 않게

**템플릿**
- 짧고 진정성 있게
- 기술적 관심 표현
` : ''}

### 개인화 팁
- 어떤 정보를 찾아서 개인화할지
- 개인화 예시

### 금지 사항
- 하지 말아야 할 것들
- 스팸으로 보이는 표현`
        }
      ]
    });

    spinner.stop();

    const textContent = response.content.find(c => c.type === 'text');
    if (textContent && textContent.type === 'text') {
      console.log(chalk.bold.green('\n✨ 아웃리치 템플릿\n'));
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
        const filename = `outreach-templates-${channel}-${Date.now()}.md`;
        const filepath = await saveContent(filename, textContent.text);
        console.log(chalk.green(`\n저장됨: ${filepath}\n`));
      }
    }
  } catch (error) {
    spinner.stop();
    console.log(chalk.red('템플릿 생성 중 오류가 발생했습니다:'), error);
  }
}

async function designReferralProgram(): Promise<void> {
  const spinner = ora('추천 채용 프로그램 설계 중...').start();

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      messages: [
        {
          role: 'user',
          content: `채용 전문가로서 추천 채용 프로그램을 설계해주세요.

## 회사 정보
- 회사: ${companyInfo.name}
- 규모: ${companyInfo.size}
- 단계: ${companyInfo.stage}

## 프로그램 설계 요청

### 1. 리워드 구조

**기본 보상**
- 포지션별 추천 보너스 가이드라인
- 지급 시점 (입사 시 vs 수습 통과 후)

**추가 인센티브**
- 시급 포지션 보너스
- 다수 추천 보너스
- 분기별 최다 추천자 포상

### 2. 프로그램 규칙

**참여 자격**
**추천 대상 제외**
**보상 조건**
**분쟁 해결**

### 3. 프로세스

**추천 방법**
1. ...
2. ...
3. ...

**진행 상황 공유**
- 추천인에게 어떻게 업데이트할지

### 4. 홍보 전략

**내부 홍보**
- 전사 공지
- 팀 미팅 활용
- 슬랙/사내 메신저 활용

**추천 요청 템플릿**
- 직원이 지인에게 보낼 메시지

### 5. 성과 측정

**KPI**
- 추천 건수
- 추천 전환율
- 추천 입사자 리텐션

### 6. 예시 정책 문서
(회사에서 바로 사용할 수 있는 형태로)`
        }
      ]
    });

    spinner.stop();

    const textContent = response.content.find(c => c.type === 'text');
    if (textContent && textContent.type === 'text') {
      console.log(chalk.bold.green('\n✨ 추천 채용 프로그램 설계\n'));
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
        const filename = `referral-program-${Date.now()}.md`;
        const filepath = await saveContent(filename, textContent.text);
        console.log(chalk.green(`\n저장됨: ${filepath}\n`));
      }
    }
  } catch (error) {
    spinner.stop();
    console.log(chalk.red('프로그램 설계 중 오류가 발생했습니다:'), error);
  }
}
