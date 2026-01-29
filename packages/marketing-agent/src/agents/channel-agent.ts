import Anthropic from '@anthropic-ai/sdk';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { productInfo, saveContent } from '../utils/index.js';

const client = new Anthropic();

export async function analyzeChannels(): Promise<void> {
  console.log(chalk.bold.blue('\n=== 채널 전략 분석 ===\n'));

  const { channelType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'channelType',
      message: '분석할 채널:',
      choices: [
        { name: '📊 전체 채널 전략', value: 'all' },
        { name: '👨‍💻 개발자 커뮤니티', value: 'dev' },
        { name: '🔍 SEO/콘텐츠 마케팅', value: 'seo' },
        { name: '💰 유료 광고 전략', value: 'paid' },
        { name: '← 돌아가기', value: 'back' }
      ]
    }
  ]);

  if (channelType === 'back') return;

  const spinner = ora('채널 전략 분석 중...').start();

  try {
    const prompts: Record<string, string> = {
      all: `그로스 마케터로서 종합 채널 전략을 수립해주세요.

## 서비스
${productInfo.name}: ${productInfo.tagline}
타겟: ${productInfo.targetAudience}

## 전체 채널 전략

### 1. 채널 우선순위 매트릭스

| 채널 | 도달범위 | 비용 | 전환율 | 우선순위 |
|------|---------|------|--------|---------|
(표 형식으로 10개 채널 분석)

### 2. 단계별 채널 전략

**Phase 1: 런칭 (1-2개월)**
- 집중 채널
- 목표
- KPI

**Phase 2: 성장 (3-6개월)**
- 확장 채널
- 목표
- KPI

**Phase 3: 스케일 (6개월+)**
- 추가 채널
- 목표
- KPI

### 3. 채널별 액션 플랜
각 채널별 구체적인 실행 방안

### 4. 예산 배분 가이드
- 무료 채널 최대 활용법
- 유료 채널 테스트 예산`,

      dev: `개발자 커뮤니티 마케팅 전략을 수립해주세요.

## 서비스
${productInfo.name}: ${productInfo.tagline}

## 개발자 커뮤니티 전략

### 1. 한국 개발자 커뮤니티

**velog**
- 콘텐츠 전략
- 태그 전략
- 베스트 포스팅 가이드

**disquiet**
- 메이커로그 전략
- 커뮤니티 참여 방법
- 프로덕트 등록 팁

**GeekNews**
- 뉴스 등록 전략
- 베스트 시간대
- 커뮤니티 반응 팁

**기타**
- OKKY
- 인프런
- 코드너리

### 2. 글로벌 커뮤니티

**Hacker News**
- Show HN 전략
- 타이밍
- 제목 작성법

**Reddit**
- 관련 서브레딧
- 참여 가이드라인

**Dev.to**
- 콘텐츠 전략

### 3. 주의사항
- 스팸으로 보이지 않는 법
- 커뮤니티 에티켓
- 장기적 관계 구축`,

      seo: `SEO 및 콘텐츠 마케팅 전략을 수립해주세요.

## 서비스
${productInfo.name}: ${productInfo.tagline}

## SEO 전략

### 1. 키워드 리서치

**핵심 키워드 (10개)**
- 검색량 예상
- 경쟁도
- 타겟 페이지

**롱테일 키워드 (20개)**
- 블로그 콘텐츠용

**의도별 키워드 분류**
- 정보성
- 상업성
- 네비게이션

### 2. 콘텐츠 캘린더

**월별 콘텐츠 계획 (3개월)**
- 주제
- 키워드
- 형식

### 3. 기술적 SEO 체크리스트
- 사이트 구조
- 메타태그
- 스키마 마크업

### 4. 링크 빌딩 전략
- 자연스러운 백링크 확보법
- 게스트 포스팅
- 파트너십`,

      paid: `유료 광고 전략을 수립해주세요.

## 서비스
${productInfo.name}: ${productInfo.tagline}
타겟: ${productInfo.targetAudience}

## 유료 광고 전략

### 1. Google Ads

**검색 광고**
- 키워드 그룹
- 예산 배분
- 입찰 전략

**디스플레이 광고**
- 타겟팅 옵션
- 리마케팅 전략

### 2. LinkedIn Ads
- 타겟팅 설정
- 광고 형식
- 예산 가이드

### 3. Facebook/Instagram Ads
- 타겟 오디언스
- 크리에이티브 방향
- 퍼널별 캠페인

### 4. 테스트 플랜
- A/B 테스트 항목
- 최소 테스트 예산
- 성과 측정 기준

### 5. 예산별 추천
- 월 50만원
- 월 100만원
- 월 300만원+`
    };

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3500,
      messages: [
        {
          role: 'user',
          content: prompts[channelType]
        }
      ]
    });

    spinner.stop();

    const textContent = response.content.find(c => c.type === 'text');
    if (textContent && textContent.type === 'text') {
      console.log(chalk.bold.green('\n✨ 채널 전략 분석 결과\n'));
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
        const filename = `channel-${channelType}-${Date.now()}.md`;
        const filepath = await saveContent(filename, textContent.text);
        console.log(chalk.green(`\n저장됨: ${filepath}\n`));
      }
    }
  } catch (error) {
    spinner.stop();
    console.log(chalk.red('분석 중 오류가 발생했습니다:'), error);
  }
}
