import Anthropic from '@anthropic-ai/sdk';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { productInfo, saveContent } from '../utils/index.js';

const client = new Anthropic();

export async function analyzeCompetitors(): Promise<void> {
  console.log(chalk.bold.blue('\n=== 경쟁 분석 ===\n'));

  const { analysisType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'analysisType',
      message: '분석 유형:',
      choices: [
        { name: '🔍 경쟁사 발굴 및 분석', value: 'discover' },
        { name: '📊 포지셔닝 전략', value: 'positioning' },
        { name: '💡 차별화 메시지', value: 'differentiation' },
        { name: '🌐 실시간 경쟁사 검색', value: 'realtime' },
        { name: '← 돌아가기', value: 'back' }
      ]
    }
  ]);

  if (analysisType === 'back') return;

  const spinner = ora('경쟁 분석 중...').start();

  try {
    if (analysisType === 'realtime') {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3500,
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
            content: `"이직 도우미 서비스", "AI 이력서 서비스", "취업 AI 에이전트", "job search AI tool" 등을 검색하여 경쟁사를 분석해주세요.

## 우리 서비스
${productInfo.name}: ${productInfo.tagline}
차별점: ${productInfo.uniqueValue}

## 분석 요청

### 1. 발견된 경쟁 서비스들
각 서비스별:
- 이름 및 URL
- 핵심 기능
- 가격 정책
- 강점/약점

### 2. 경쟁 구도 분석
- 직접 경쟁사
- 간접 경쟁사
- 잠재적 경쟁사

### 3. 우리의 차별화 포인트
- 기능적 차별점
- 포지셔닝 차별점
- 커뮤니케이션 차별점

### 4. 경쟁 대응 전략`
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
        console.log(chalk.bold.green('\n✨ 실시간 경쟁 분석 결과\n'));
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
          const filename = `competitor-realtime-${Date.now()}.md`;
          const filepath = await saveContent(filename, fullText);
          console.log(chalk.green(`\n저장됨: ${filepath}\n`));
        }
      }
      return;
    }

    const prompts: Record<string, string> = {
      discover: `경쟁사 분석 전문가로서 경쟁 구도를 분석해주세요.

## 우리 서비스
${productInfo.name}: ${productInfo.tagline}
핵심 기능: ${productInfo.keyFeatures.join(', ')}
차별점: ${productInfo.uniqueValue}

## 경쟁사 분석

### 1. 직접 경쟁사 (유사 기능 제공)
- 사람인/잡코리아: 기존 취업 플랫폼
- LinkedIn: 글로벌 커리어 플랫폼
- 원티드: 추천 기반 채용
- 리멤버: 명함 기반 네트워킹

각 경쟁사별:
| 항목 | 내용 |
|------|------|
| 핵심 기능 | |
| 장점 | |
| 단점 | |
| 가격 | |
| 타겟 | |

### 2. 간접 경쟁사
- ChatGPT: 범용 AI (이력서 작성)
- Notion AI: 문서 작성 도구
- 각종 이력서 템플릿 서비스

### 3. 대체재
- 헤드헌터
- 지인 추천
- 직접 지원

### 4. SWOT 분석
우리 서비스 관점에서

### 5. 경쟁 우위 확보 전략`,

      positioning: `포지셔닝 전략을 수립해주세요.

## 우리 서비스
${productInfo.name}: ${productInfo.tagline}
차별점: ${productInfo.uniqueValue}

## 포지셔닝 전략

### 1. 포지셔닝 맵
(2x2 매트릭스로 표현)

축 옵션:
- 프라이버시 vs 공개
- AI 자동화 vs 수동
- B2B vs B2C
- 종합 vs 전문

### 2. 포지셔닝 스테이트먼트

**템플릿**:
[타겟 고객]을 위한 [제품 카테고리]로서,
[핵심 혜택]을 제공합니다.
[경쟁사]와 달리, [차별화 포인트]가 있습니다.

**3가지 버전 작성**

### 3. 메시지 하우스
- 핵심 메시지
- 지원 메시지 3개
- 증거/근거

### 4. 브랜드 퍼스널리티
- 톤앤매너
- 키워드
- 피해야 할 것`,

      differentiation: `차별화 메시지를 개발해주세요.

## 우리 서비스
${productInfo.name}: ${productInfo.tagline}
차별점: ${productInfo.uniqueValue}

## 차별화 메시지 개발

### 1. 핵심 차별화 포인트 3가지

각 포인트별:
- 기능적 특징
- 고객 혜택
- 경쟁사 대비 우위
- 메시지 표현

### 2. 경쟁사 공격 메시지
(직접 언급 없이 우회적으로)

vs 링크드인: "프로필 공개 없이도..."
vs 취업 플랫폼: "스팸 연락 없이..."
vs ChatGPT: "취업 전문 AI로..."

### 3. 반박 대응
예상 반론에 대한 대응 메시지

### 4. 엘리베이터 피치
- 10초 버전
- 30초 버전
- 1분 버전`
    };

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3500,
      messages: [
        {
          role: 'user',
          content: prompts[analysisType]
        }
      ]
    });

    spinner.stop();

    const textContent = response.content.find(c => c.type === 'text');
    if (textContent && textContent.type === 'text') {
      console.log(chalk.bold.green('\n✨ 경쟁 분석 결과\n'));
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
        const filename = `competitor-${analysisType}-${Date.now()}.md`;
        const filepath = await saveContent(filename, textContent.text);
        console.log(chalk.green(`\n저장됨: ${filepath}\n`));
      }
    }
  } catch (error) {
    spinner.stop();
    console.log(chalk.red('분석 중 오류가 발생했습니다:'), error);
  }
}
