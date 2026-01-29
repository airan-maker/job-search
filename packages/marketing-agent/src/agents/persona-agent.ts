import Anthropic from '@anthropic-ai/sdk';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { productInfo, saveContent } from '../utils/index.js';

const client = new Anthropic();

export async function analyzePersonas(): Promise<void> {
  console.log(chalk.bold.blue('\n=== 타겟 페르소나 분석 ===\n'));

  const { personaType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'personaType',
      message: '분석할 페르소나 유형:',
      choices: [
        { name: '전체 페르소나 정의', value: 'all' },
        { name: '개발자 세그먼트', value: 'developer' },
        { name: '기획자/PM 세그먼트', value: 'pm' },
        { name: '디자이너 세그먼트', value: 'designer' },
        { name: '← 돌아가기', value: 'back' }
      ]
    }
  ]);

  if (personaType === 'back') return;

  const spinner = ora('페르소나 분석 중...').start();

  try {
    const prompts: Record<string, string> = {
      all: `마케팅 전문가로서 다음 서비스의 타겟 페르소나를 분석해주세요.

## 서비스
- 이름: ${productInfo.name}
- 슬로건: ${productInfo.tagline}
- 설명: ${productInfo.description}
- 핵심 가치: ${productInfo.uniqueValue}

## 분석 요청

### 주요 페르소나 3-4개 정의

각 페르소나별로:

**페르소나 1: [이름/별명]**
- 인구통계: 나이, 직업, 경력
- 현재 상황: 어떤 상황에 처해있는지
- Pain Points: 이직 준비 시 겪는 어려움 3-5개
- Goals: 이직을 통해 얻고 싶은 것
- 행동 패턴: 정보를 찾는 방법, 사용하는 채널
- 메시지 전략: 이 사람에게 와닿을 핵심 메시지

### 세그먼트별 차별화 포인트
- 공통 Pain Point
- 세그먼트별 특수 니즈`,

      developer: `개발자 세그먼트를 세분화해서 분석해주세요.

## 서비스
${productInfo.name}: ${productInfo.tagline}

## 개발자 세그먼트 분석

### 1. 주니어 개발자 (1-3년차)
- 이직 동기
- 주요 고민
- 선호 채널
- 메시지 전략

### 2. 미드레벨 개발자 (4-7년차)
- 이직 동기
- 주요 고민
- 선호 채널
- 메시지 전략

### 3. 시니어 개발자 (8년차+)
- 이직 동기
- 주요 고민
- 선호 채널
- 메시지 전략

### 4. 특수 케이스
- 스타트업 → 대기업 이동 희망
- 대기업 → 스타트업 이동 희망
- 외국계 기업 이동 희망`,

      pm: `기획자/PM 세그먼트를 분석해주세요.

## 서비스
${productInfo.name}: ${productInfo.tagline}

## PM/기획자 세그먼트 분석

### 1. 서비스 기획자
### 2. 프로덕트 매니저
### 3. 프로젝트 매니저

각 세그먼트별:
- 이직 준비 시 특수 어려움
- 포트폴리오/이력서 고민
- 면접 준비 니즈
- 효과적인 마케팅 메시지`,

      designer: `디자이너 세그먼트를 분석해주세요.

## 서비스
${productInfo.name}: ${productInfo.tagline}

## 디자이너 세그먼트 분석

### 1. UI/UX 디자이너
### 2. 프로덕트 디자이너
### 3. 브랜드/그래픽 디자이너

각 세그먼트별:
- 이직 시 포트폴리오 고민
- 면접 준비 특수 니즈
- 효과적인 마케팅 메시지
- 선호 채널/커뮤니티`
    };

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: prompts[personaType]
        }
      ]
    });

    spinner.stop();

    const textContent = response.content.find(c => c.type === 'text');
    if (textContent && textContent.type === 'text') {
      console.log(chalk.bold.green('\n✨ 페르소나 분석 결과\n'));
      console.log(chalk.gray('─'.repeat(60)));
      console.log(textContent.text);
      console.log(chalk.gray('─'.repeat(60)));

      const { save } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'save',
          message: '분석 결과를 파일로 저장하시겠습니까?',
          default: true
        }
      ]);

      if (save) {
        const filename = `persona-${personaType}-${Date.now()}.md`;
        const filepath = await saveContent(filename, textContent.text);
        console.log(chalk.green(`\n저장됨: ${filepath}\n`));
      }
    }

  } catch (error) {
    spinner.stop();
    console.log(chalk.red('분석 중 오류가 발생했습니다:'), error);
  }
}
