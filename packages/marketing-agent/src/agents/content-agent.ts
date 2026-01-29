import Anthropic from '@anthropic-ai/sdk';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { productInfo, saveContent } from '../utils/index.js';

const client = new Anthropic();

export async function generateContent(): Promise<void> {
  console.log(chalk.bold.blue('\n=== 마케팅 콘텐츠 생성 ===\n'));

  const { contentType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'contentType',
      message: '생성할 콘텐츠 유형:',
      choices: [
        { name: '📱 SNS 포스트 (LinkedIn/Twitter)', value: 'sns' },
        { name: '📝 블로그 포스트', value: 'blog' },
        { name: '🎯 랜딩페이지 카피', value: 'landing' },
        { name: '📧 이메일 마케팅', value: 'email' },
        { name: '📢 광고 카피', value: 'ad' },
        { name: '🚀 Product Hunt 런칭', value: 'producthunt' },
        { name: '← 돌아가기', value: 'back' }
      ]
    }
  ]);

  if (contentType === 'back') return;

  if (contentType === 'sns') {
    await generateSNSContent();
  } else if (contentType === 'blog') {
    await generateBlogContent();
  } else if (contentType === 'landing') {
    await generateLandingCopy();
  } else if (contentType === 'email') {
    await generateEmailContent();
  } else if (contentType === 'ad') {
    await generateAdCopy();
  } else if (contentType === 'producthunt') {
    await generateProductHuntContent();
  }
}

async function generateSNSContent(): Promise<void> {
  const { platform } = await inquirer.prompt([
    {
      type: 'list',
      name: 'platform',
      message: '플랫폼 선택:',
      choices: [
        { name: 'LinkedIn', value: 'linkedin' },
        { name: 'Twitter/X', value: 'twitter' },
        { name: '둘 다', value: 'both' }
      ]
    }
  ]);

  const { tone } = await inquirer.prompt([
    {
      type: 'list',
      name: 'tone',
      message: '톤앤매너:',
      choices: [
        { name: '전문적/신뢰감', value: 'professional' },
        { name: '친근/공감', value: 'friendly' },
        { name: '유머러스', value: 'humorous' },
        { name: '긴급/FOMO', value: 'urgent' }
      ]
    }
  ]);

  const spinner = ora('SNS 콘텐츠 생성 중...').start();

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      messages: [
        {
          role: 'user',
          content: `SNS 마케팅 전문가로서 다음 서비스의 SNS 포스트를 작성해주세요.

## 서비스 정보
- 이름: ${productInfo.name}
- 슬로건: ${productInfo.tagline}
- 설명: ${productInfo.description}
- 핵심 기능: ${productInfo.keyFeatures.join(', ')}
- 차별점: ${productInfo.uniqueValue}

## 요청사항
- 플랫폼: ${platform === 'both' ? 'LinkedIn과 Twitter 둘 다' : platform}
- 톤앤매너: ${tone}

## 생성할 콘텐츠

${platform === 'linkedin' || platform === 'both' ? `
### LinkedIn 포스트 (3개)

**포스트 1: 문제 제기형**
(현직자의 이직 고민에 공감하는 내용)

**포스트 2: 솔루션 소개형**
(서비스 기능과 가치 소개)

**포스트 3: 사회적 증명형**
(사용 사례나 효과 강조)

각 포스트에 적절한 해시태그 5개 포함
` : ''}

${platform === 'twitter' || platform === 'both' ? `
### Twitter/X 포스트 (5개)

**트윗 1**: Hook + 문제 제기 (280자 이내)
**트윗 2**: 솔루션 티저 (280자 이내)
**트윗 3**: 기능 하이라이트 (280자 이내)
**트윗 4**: 사용자 관점 (280자 이내)
**트윗 5**: CTA + 링크 유도 (280자 이내)

각 트윗에 해시태그 2-3개 포함
` : ''}`
        }
      ]
    });

    spinner.stop();

    const textContent = response.content.find(c => c.type === 'text');
    if (textContent && textContent.type === 'text') {
      console.log(chalk.bold.green('\n✨ SNS 콘텐츠가 생성되었습니다!\n'));
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
        const filename = `sns-${platform}-${Date.now()}.md`;
        const filepath = await saveContent(filename, textContent.text);
        console.log(chalk.green(`\n저장됨: ${filepath}\n`));
      }
    }
  } catch (error) {
    spinner.stop();
    console.log(chalk.red('콘텐츠 생성 중 오류가 발생했습니다:'), error);
  }
}

async function generateBlogContent(): Promise<void> {
  const { topic } = await inquirer.prompt([
    {
      type: 'list',
      name: 'topic',
      message: '블로그 주제:',
      choices: [
        { name: '이직 준비 가이드 (서비스 소개 포함)', value: 'guide' },
        { name: '링크드인 없이 이직하는 법', value: 'privacy' },
        { name: 'AI 면접 코칭의 효과', value: 'interview' },
        { name: '연봉 협상 꿀팁', value: 'salary' },
        { name: '직접 입력', value: 'custom' }
      ]
    }
  ]);

  let finalTopic = topic;
  if (topic === 'custom') {
    const { customTopic } = await inquirer.prompt([
      {
        type: 'input',
        name: 'customTopic',
        message: '블로그 주제를 입력하세요:'
      }
    ]);
    finalTopic = customTopic;
  }

  const spinner = ora('블로그 포스트 생성 중...').start();

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: `SEO와 마케팅을 고려한 블로그 포스트를 작성해주세요.

## 서비스 정보
${productInfo.name}: ${productInfo.description}

## 주제
${finalTopic}

## 작성 요청

### 제목 (3가지 옵션)
- SEO 키워드 포함
- 클릭 유도하는 제목

### 본문 구조
1. **도입부**: Hook + 문제 공감
2. **본론**: 해결책/팁 제시 (서비스 자연스럽게 녹여서)
3. **결론**: CTA

### 포함 요소
- H2, H3 소제목
- 핵심 포인트 불릿
- 서비스 언급 (자연스럽게)
- SEO 키워드 (5개)
- 메타 디스크립션 (160자)

### 분량
약 1500-2000자`
        }
      ]
    });

    spinner.stop();

    const textContent = response.content.find(c => c.type === 'text');
    if (textContent && textContent.type === 'text') {
      console.log(chalk.bold.green('\n✨ 블로그 포스트가 생성되었습니다!\n'));
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
        const filename = `blog-${Date.now()}.md`;
        const filepath = await saveContent(filename, textContent.text);
        console.log(chalk.green(`\n저장됨: ${filepath}\n`));
      }
    }
  } catch (error) {
    spinner.stop();
    console.log(chalk.red('블로그 생성 중 오류가 발생했습니다:'), error);
  }
}

async function generateLandingCopy(): Promise<void> {
  const spinner = ora('랜딩페이지 카피 생성 중...').start();

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3500,
      messages: [
        {
          role: 'user',
          content: `랜딩페이지 카피라이터로서 전환율 높은 랜딩페이지 카피를 작성해주세요.

## 서비스 정보
- 이름: ${productInfo.name}
- 슬로건: ${productInfo.tagline}
- 설명: ${productInfo.description}
- 핵심 기능: ${productInfo.keyFeatures.join('\n- ')}
- 차별점: ${productInfo.uniqueValue}
- 타겟: ${productInfo.targetAudience}

## 랜딩페이지 섹션별 카피

### 1. 히어로 섹션
- 헤드라인 (3가지 옵션)
- 서브헤드라인
- CTA 버튼 문구
- 소셜 프루프 한 줄

### 2. 문제 제기 섹션
- 섹션 제목
- Pain Point 3-4개 (공감가는 표현)

### 3. 솔루션/기능 섹션
- 섹션 제목
- 기능별 제목 + 설명 (4-5개)

### 4. 차별화 섹션
- 왜 이 서비스인지
- 경쟁사 대비 장점

### 5. 사용 방법 섹션
- 3단계 프로세스

### 6. FAQ 섹션
- 예상 질문 5개 + 답변

### 7. 최종 CTA 섹션
- 헤드라인
- 버튼 문구
- 안심 문구 (무료 체험, 카드 불필요 등)`
        }
      ]
    });

    spinner.stop();

    const textContent = response.content.find(c => c.type === 'text');
    if (textContent && textContent.type === 'text') {
      console.log(chalk.bold.green('\n✨ 랜딩페이지 카피가 생성되었습니다!\n'));
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
        const filename = `landing-copy-${Date.now()}.md`;
        const filepath = await saveContent(filename, textContent.text);
        console.log(chalk.green(`\n저장됨: ${filepath}\n`));
      }
    }
  } catch (error) {
    spinner.stop();
    console.log(chalk.red('카피 생성 중 오류가 발생했습니다:'), error);
  }
}

async function generateEmailContent(): Promise<void> {
  const { emailType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'emailType',
      message: '이메일 유형:',
      choices: [
        { name: '온보딩 시퀀스 (3통)', value: 'onboarding' },
        { name: '뉴스레터 템플릿', value: 'newsletter' },
        { name: '재방문 유도', value: 'reengagement' }
      ]
    }
  ]);

  const spinner = ora('이메일 콘텐츠 생성 중...').start();

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: `이메일 마케팅 전문가로서 ${emailType} 이메일을 작성해주세요.

## 서비스
${productInfo.name}: ${productInfo.tagline}

## 이메일 작성

${emailType === 'onboarding' ? `
### 이메일 1: 환영 (가입 직후)
- 제목 (3가지 옵션)
- 본문: 환영 + 첫 단계 안내
- CTA

### 이메일 2: 기능 소개 (Day 2)
- 제목
- 본문: 핵심 기능 1개 딥다이브
- CTA

### 이메일 3: 성공 사례 (Day 5)
- 제목
- 본문: 활용 팁 + 다음 단계
- CTA
` : emailType === 'newsletter' ? `
### 뉴스레터 템플릿
- 제목 공식 (3가지)
- 도입부 템플릿
- 본문 구조 (팁 + 서비스 연계)
- 마무리 CTA
` : `
### 재방문 유도 이메일
- 제목 (3가지 - FOMO 유발)
- 본문: 새로운 기능/업데이트 + 혜택
- CTA
`}

각 이메일에 포함:
- 개인화 요소
- 짧고 스캔하기 쉬운 문장
- 명확한 CTA`
        }
      ]
    });

    spinner.stop();

    const textContent = response.content.find(c => c.type === 'text');
    if (textContent && textContent.type === 'text') {
      console.log(chalk.bold.green('\n✨ 이메일 콘텐츠가 생성되었습니다!\n'));
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
        const filename = `email-${emailType}-${Date.now()}.md`;
        const filepath = await saveContent(filename, textContent.text);
        console.log(chalk.green(`\n저장됨: ${filepath}\n`));
      }
    }
  } catch (error) {
    spinner.stop();
    console.log(chalk.red('이메일 생성 중 오류가 발생했습니다:'), error);
  }
}

async function generateAdCopy(): Promise<void> {
  const { adType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'adType',
      message: '광고 유형:',
      choices: [
        { name: 'Google 검색 광고', value: 'search' },
        { name: '디스플레이/배너 광고', value: 'display' },
        { name: 'LinkedIn 광고', value: 'linkedin' }
      ]
    }
  ]);

  const spinner = ora('광고 카피 생성 중...').start();

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      messages: [
        {
          role: 'user',
          content: `광고 카피라이터로서 ${adType} 광고 카피를 작성해주세요.

## 서비스
${productInfo.name}: ${productInfo.tagline}
차별점: ${productInfo.uniqueValue}

${adType === 'search' ? `
## Google 검색 광고 (RSA 형식)

### 타겟 키워드 제안 (10개)
- 브랜드 키워드
- 경쟁 키워드
- 문제 키워드
- 솔루션 키워드

### 헤드라인 (15개, 각 30자 이내)
다양한 앵글로 작성

### 설명문 (4개, 각 90자 이내)

### 사이트링크 제안 (4개)
` : adType === 'display' ? `
## 디스플레이/배너 광고

### 300x250 배너
- 헤드라인 (15자 이내)
- 서브카피 (25자 이내)
- CTA 버튼

### 728x90 배너 (리더보드)
- 헤드라인
- 서브카피
- CTA

### 160x600 배너 (스카이스크래퍼)
- 3줄 카피
- CTA

### 비주얼 방향 제안
` : `
## LinkedIn 광고

### 싱글 이미지 광고 (3개)
- 헤드라인 (70자 이내)
- 본문 (150자 이내)
- CTA 버튼 선택

### 캐러셀 광고 (5장)
각 카드별 헤드라인 + 설명

### 타겟팅 제안
- 직무
- 경력
- 관심사
`}`
        }
      ]
    });

    spinner.stop();

    const textContent = response.content.find(c => c.type === 'text');
    if (textContent && textContent.type === 'text') {
      console.log(chalk.bold.green('\n✨ 광고 카피가 생성되었습니다!\n'));
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
        const filename = `ad-${adType}-${Date.now()}.md`;
        const filepath = await saveContent(filename, textContent.text);
        console.log(chalk.green(`\n저장됨: ${filepath}\n`));
      }
    }
  } catch (error) {
    spinner.stop();
    console.log(chalk.red('광고 생성 중 오류가 발생했습니다:'), error);
  }
}

async function generateProductHuntContent(): Promise<void> {
  const spinner = ora('Product Hunt 런칭 콘텐츠 생성 중...').start();

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3500,
      messages: [
        {
          role: 'user',
          content: `Product Hunt 런칭 전문가로서 완벽한 런칭 준비물을 작성해주세요.

## 서비스
- 이름: ${productInfo.name}
- 슬로건: ${productInfo.tagline}
- 설명: ${productInfo.description}
- 핵심 기능: ${productInfo.keyFeatures.join('\n- ')}
- 차별점: ${productInfo.uniqueValue}

## Product Hunt 런칭 패키지

### 1. 기본 정보
- Tagline (60자 이내, 3가지 옵션)
- Description (260자 이내)
- Topics/카테고리 제안

### 2. First Comment (메이커 첫 댓글)
- 자기소개
- 만든 이유
- 피드백 요청
- 특별 혜택 (해커뉴스 등)

### 3. 런칭 체크리스트
- 런칭 전 준비 (1주일 전)
- 런칭 당일 액션
- 런칭 후 팔로업

### 4. 홍보 메시지
- 트위터 런칭 공지
- LinkedIn 런칭 공지
- 커뮤니티 공유용 (디스콰이엇, GeekNews 등)

### 5. FAQ 대응
- 예상 질문 + 답변 템플릿

### 6. 베스트 런칭 타이밍
- 요일/시간 추천
- 피해야 할 날짜`
        }
      ]
    });

    spinner.stop();

    const textContent = response.content.find(c => c.type === 'text');
    if (textContent && textContent.type === 'text') {
      console.log(chalk.bold.green('\n✨ Product Hunt 런칭 패키지가 생성되었습니다!\n'));
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
        const filename = `producthunt-launch-${Date.now()}.md`;
        const filepath = await saveContent(filename, textContent.text);
        console.log(chalk.green(`\n저장됨: ${filepath}\n`));
      }
    }
  } catch (error) {
    spinner.stop();
    console.log(chalk.red('콘텐츠 생성 중 오류가 발생했습니다:'), error);
  }
}
