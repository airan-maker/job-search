import Anthropic from '@anthropic-ai/sdk';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { companyInfo, saveContent } from '../utils/index.js';

const client = new Anthropic();

export async function employerBranding(): Promise<void> {
  console.log(chalk.bold.blue('\n=== 채용 브랜딩 ===\n'));

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: '무엇을 하시겠습니까?',
      choices: [
        { name: '🏢 회사 소개 페이지 카피', value: 'about' },
        { name: '📣 채용 공고 홍보 콘텐츠', value: 'promo' },
        { name: '🎤 채용 설명회 자료', value: 'presentation' },
        { name: '⭐ 후보자 경험 개선', value: 'experience' },
        { name: '← 돌아가기', value: 'back' }
      ]
    }
  ]);

  if (action === 'back') return;

  if (action === 'about') {
    await createAboutPage();
  } else if (action === 'promo') {
    await createPromoContent();
  } else if (action === 'presentation') {
    await createPresentation();
  } else if (action === 'experience') {
    await improveCandidateExperience();
  }
}

async function createAboutPage(): Promise<void> {
  const { tone } = await inquirer.prompt([
    {
      type: 'list',
      name: 'tone',
      message: '톤앤매너:',
      choices: [
        { name: '전문적/신뢰감', value: 'professional' },
        { name: '열정적/스타트업', value: 'startup' },
        { name: '따뜻한/가족적', value: 'warm' }
      ]
    }
  ]);

  const spinner = ora('회사 소개 페이지 카피 생성 중...').start();

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: `채용 브랜딩 전문가로서 채용 페이지용 회사 소개를 작성해주세요.

## 회사 정보
- 회사명: ${companyInfo.name}
- 산업: ${companyInfo.industry}
- 규모: ${companyInfo.size}
- 단계: ${companyInfo.stage}
- 문화: ${companyInfo.culture.join(', ')}
- 복지: ${companyInfo.benefits.join(', ')}
${companyInfo.mission ? `- 미션: ${companyInfo.mission}` : ''}
${companyInfo.values ? `- 핵심 가치: ${companyInfo.values.join(', ')}` : ''}
${companyInfo.techStack ? `- 기술 스택: ${companyInfo.techStack.join(', ')}` : ''}

## 톤앤매너
${tone === 'professional' ? '전문적이고 신뢰감 있게' : tone === 'startup' ? '열정적이고 스타트업스럽게' : '따뜻하고 가족적으로'}

## 채용 페이지 섹션

### 1. 히어로 섹션
**헤드라인** (3가지 옵션)
**서브헤드라인**
**CTA 버튼 문구**

### 2. 우리는 이런 회사입니다
- 한 줄 소개
- 주요 특징 3-4개
- 숫자로 보는 회사 (팀원 수, 고객 수 등)

### 3. 미션 & 비전
- 우리가 푸는 문제
- 우리의 방향

### 4. 핵심 가치
(각 가치별 설명과 실제 사례)

### 5. 팀 문화
- 일하는 방식
- 소통 방식
- 성장 지원

### 6. 복지 & 혜택
(카테고리별 정리)
- 급여/보상
- 근무환경
- 성장지원
- 생활지원

### 7. 채용 프로세스
(단계별 설명과 기간)

### 8. 팀원들의 이야기
(인터뷰 질문 템플릿 - 실제 팀원에게 물어볼 것)

### 9. FAQ
(예상 질문 5개와 답변)

### 10. CTA
(마지막 행동 유도)`
        }
      ]
    });

    spinner.stop();

    const textContent = response.content.find(c => c.type === 'text');
    if (textContent && textContent.type === 'text') {
      console.log(chalk.bold.green('\n✨ 회사 소개 페이지 카피\n'));
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
        const filename = `careers-page-copy-${Date.now()}.md`;
        const filepath = await saveContent(filename, textContent.text);
        console.log(chalk.green(`\n저장됨: ${filepath}\n`));
      }
    }
  } catch (error) {
    spinner.stop();
    console.log(chalk.red('카피 생성 중 오류가 발생했습니다:'), error);
  }
}

async function createPromoContent(): Promise<void> {
  const { position, platform } = await inquirer.prompt([
    {
      type: 'input',
      name: 'position',
      message: '홍보할 포지션 (전체면 빈칸):',
    },
    {
      type: 'list',
      name: 'platform',
      message: '채널:',
      choices: [
        { name: 'LinkedIn', value: 'linkedin' },
        { name: 'Twitter/X', value: 'twitter' },
        { name: '개발자 커뮤니티', value: 'community' },
        { name: '전체', value: 'all' }
      ]
    }
  ]);

  const spinner = ora('채용 홍보 콘텐츠 생성 중...').start();

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: `채용 마케팅 전문가로서 채용 공고 홍보 콘텐츠를 작성해주세요.

## 회사 정보
- 회사: ${companyInfo.name}
- 산업: ${companyInfo.industry}
- 문화: ${companyInfo.culture.join(', ')}
${position ? `- 채용 포지션: ${position}` : '- 채용: 여러 포지션'}

## 채널: ${platform === 'all' ? '전체' : platform}

## 콘텐츠 생성

${platform === 'linkedin' || platform === 'all' ? `
### LinkedIn 포스트 (3개)

**포스트 1: 팀/문화 소개**
- 우리 팀이 특별한 이유
- 해시태그 포함

**포스트 2: 포지션 소개**
- 어떤 사람을 찾는지
- 왜 지금 합류해야 하는지

**포스트 3: 팀원 스토리**
- 실제 팀원의 이야기 형식
- 진정성 있게
` : ''}

${platform === 'twitter' || platform === 'all' ? `
### Twitter/X (5개)

1. Hook + 채용 공지
2. 팀 문화 소개
3. 기술 스택/도전 과제
4. 복지/혜택 하이라이트
5. CTA + 지원 링크
` : ''}

${platform === 'community' || platform === 'all' ? `
### 개발자 커뮤니티

**GeekNews/Hacker News 스타일**
- 제목
- 본문 (짧고 기술 중심)

**velog/disquiet 스타일**
- 우리 팀 기술 블로그 형식
- 어떤 문제를 푸는지
- 기술적 도전 과제

**주의사항**
- 스팸처럼 보이지 않게
- 커뮤니티 에티켓 준수
` : ''}

### 콘텐츠 캘린더 제안
| 일자 | 채널 | 콘텐츠 | 목적 |
|------|------|--------|------|
| Day 1 | | | |
| Day 3 | | | |
| Day 7 | | | |`
        }
      ]
    });

    spinner.stop();

    const textContent = response.content.find(c => c.type === 'text');
    if (textContent && textContent.type === 'text') {
      console.log(chalk.bold.green('\n✨ 채용 홍보 콘텐츠\n'));
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
        const filename = `hiring-promo-${platform}-${Date.now()}.md`;
        const filepath = await saveContent(filename, textContent.text);
        console.log(chalk.green(`\n저장됨: ${filepath}\n`));
      }
    }
  } catch (error) {
    spinner.stop();
    console.log(chalk.red('콘텐츠 생성 중 오류가 발생했습니다:'), error);
  }
}

async function createPresentation(): Promise<void> {
  const { audience } = await inquirer.prompt([
    {
      type: 'list',
      name: 'audience',
      message: '대상 청중:',
      choices: [
        { name: '대학생/신입', value: 'junior' },
        { name: '경력직', value: 'experienced' },
        { name: '개발자', value: 'developer' },
        { name: '일반', value: 'general' }
      ]
    }
  ]);

  const spinner = ora('채용 설명회 자료 생성 중...').start();

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3500,
      messages: [
        {
          role: 'user',
          content: `채용 담당자로서 채용 설명회 발표 자료를 작성해주세요.

## 회사 정보
- 회사: ${companyInfo.name}
- 산업: ${companyInfo.industry}
- 규모: ${companyInfo.size}
- 문화: ${companyInfo.culture.join(', ')}
- 복지: ${companyInfo.benefits.join(', ')}
${companyInfo.techStack ? `- 기술: ${companyInfo.techStack.join(', ')}` : ''}

## 대상: ${audience === 'junior' ? '대학생/신입' : audience === 'experienced' ? '경력직' : audience === 'developer' ? '개발자' : '일반'}

## 발표 자료 (30분 분량)

### 슬라이드 구성

**1. 오프닝 (2분)**
- 제목 슬라이드
- 발표자 소개
- 아젠다

**2. 회사 소개 (5분)**
- 우리가 하는 일
- 비전과 미션
- 핵심 지표 (성장률, 고객 수 등)

**3. 팀과 문화 (7분)**
- 조직 구조
- 일하는 방식
- 팀 분위기 (사진/영상 추천)

**4. 성장 기회 (5분)**
- 커리어 패스
- 교육/학습 지원
- 성공 사례

**5. 복지와 환경 (5분)**
- 보상 체계
- 복지 혜택
- 근무 환경

**6. 채용 정보 (4분)**
- 채용 포지션
- 채용 프로세스
- 일정

**7. Q&A (5분)**
- 자주 묻는 질문
- 연락처

### 각 슬라이드 상세 내용

[슬라이드 1: 제목]
- 헤드라인
- 서브헤드라인
- 비주얼 제안

[슬라이드 2: 아젠다]
...

(모든 슬라이드에 대해)

### 발표자 스크립트

**오프닝 멘트**
"..."

**핵심 메시지 전달 시**
"..."

**클로징 멘트**
"..."

### Q&A 대비
**예상 질문 10개와 모범 답변**

### 발표 팁
- 청중별 강조 포인트
- 피해야 할 것`
        }
      ]
    });

    spinner.stop();

    const textContent = response.content.find(c => c.type === 'text');
    if (textContent && textContent.type === 'text') {
      console.log(chalk.bold.green('\n✨ 채용 설명회 자료\n'));
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
        const filename = `hiring-presentation-${audience}-${Date.now()}.md`;
        const filepath = await saveContent(filename, textContent.text);
        console.log(chalk.green(`\n저장됨: ${filepath}\n`));
      }
    }
  } catch (error) {
    spinner.stop();
    console.log(chalk.red('자료 생성 중 오류가 발생했습니다:'), error);
  }
}

async function improveCandidateExperience(): Promise<void> {
  const spinner = ora('후보자 경험 개선 가이드 생성 중...').start();

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: `채용 전문가로서 후보자 경험(Candidate Experience) 개선 가이드를 작성해주세요.

## 회사: ${companyInfo.name}

## 후보자 경험 개선 가이드

### 1. 후보자 여정 맵

| 단계 | 터치포인트 | 감정 | 개선 기회 |
|------|-----------|------|----------|
| 인지 | JD 발견 | | |
| 지원 | 이력서 제출 | | |
| 스크리닝 | 서류 결과 안내 | | |
| 면접 | 면접 경험 | | |
| 결과 | 합격/불합격 안내 | | |
| 온보딩 | 입사 첫날 | | |

### 2. 커뮤니케이션 템플릿

**지원 접수 확인**
- 자동 이메일 템플릿
- 타이밍

**서류 결과 안내**
- 합격 시
- 불합격 시 (피드백 포함)

**면접 안내**
- 일정 확정
- 면접 준비 가이드

**면접 후 팔로업**
- 감사 메시지
- 다음 단계 안내

**최종 결과 안내**
- 오퍼 (전화 + 이메일)
- 불합격 (감사 + 피드백)

### 3. 면접 경험 개선

**면접 전**
- 제공해야 할 정보
- 면접관 소개

**면접 중**
- 환경 세팅
- 시간 준수
- 양방향 소통

**면접 후**
- 즉시 피드백 요청
- 빠른 결과 안내

### 4. 불합격 후보자 관리

**리젝션 이메일 Best Practice**
- 개인화
- 구체적 피드백 (선택)
- 미래 기회 안내

**탤런트 풀 관리**
- 재지원 안내
- 뉴스레터 구독

### 5. 측정 지표

**NPS (Net Promoter Score)**
- 측정 방법
- 목표 점수

**주요 KPI**
- 응답 시간
- 프로세스 소요 기간
- 오퍼 수락률
- 후보자 만족도

### 6. 체크리스트

**매 채용 건 확인**
□ 48시간 내 지원 확인
□ 1주일 내 서류 결과
□ 면접 24시간 전 리마인더
□ 면접 후 3일 내 결과
□ 불합격자에게도 피드백`
        }
      ]
    });

    spinner.stop();

    const textContent = response.content.find(c => c.type === 'text');
    if (textContent && textContent.type === 'text') {
      console.log(chalk.bold.green('\n✨ 후보자 경험 개선 가이드\n'));
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
        const filename = `candidate-experience-guide-${Date.now()}.md`;
        const filepath = await saveContent(filename, textContent.text);
        console.log(chalk.green(`\n저장됨: ${filepath}\n`));
      }
    }
  } catch (error) {
    spinner.stop();
    console.log(chalk.red('가이드 생성 중 오류가 발생했습니다:'), error);
  }
}
