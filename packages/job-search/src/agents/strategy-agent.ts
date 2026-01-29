import Anthropic from '@anthropic-ai/sdk';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import type { UserProfile, JobListing } from '../types/index.js';
import { getProfile, getJobListings } from '../storage/index.js';

const client = new Anthropic();

// 합격률 분석 및 전략 제안
export async function analyzeSuccessRate(job: JobListing): Promise<void> {
  const profile = await getProfile();

  if (!profile) {
    console.log(chalk.yellow('\n프로필이 없습니다. 먼저 프로필을 생성해주세요.\n'));
    return;
  }

  console.log(chalk.bold.blue('\n=== 합격률 분석 및 전략 ===\n'));
  console.log(chalk.gray(`분석 대상: ${job.title} @ ${job.company}\n`));

  const spinner = ora('프로필과 JD 매칭 분석 중...').start();

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      tools: [
        {
          type: 'web_search_20250305',
          name: 'web_search',
          max_uses: 3
        }
      ],
      messages: [
        {
          role: 'user',
          content: `채용 전문가로서 지원자의 합격 가능성을 분석하고 전략을 제안해주세요.

## 채용 공고
- 회사: ${job.company}
- 포지션: ${job.title}
- 설명: ${job.description}
- 위치: ${job.location}
${job.notes ? `- 참고: ${job.notes}` : ''}

## 지원자 프로필
- 이름: ${profile.personalInfo.name}
- 경력:
${profile.workExperience.map(w => `  - ${w.title} @ ${w.company}: ${w.description}`).join('\n')}
- 기술 스택: ${profile.skills.map(s => s.name).join(', ')}
- 학력: ${profile.education.map(e => `${e.school} ${e.degree} ${e.field}`).join(', ')}
- 프로젝트: ${profile.projects.map(p => `${p.name} (${p.technologies.join(', ')})`).join('; ')}

## 분석 요청

### 1. 매칭 분석
| 항목 | 요구사항 | 지원자 보유 | 매칭 |
|------|---------|------------|------|
(표 형식으로 주요 요구사항과 지원자 보유 역량 매칭)

### 2. Gap 분석
**강점 (회사가 원하는 것 중 보유한 것)**:
- ...

**약점 (회사가 원하는데 부족한 것)**:
- ...

**기회 (어필할 수 있는 추가 역량)**:
- ...

### 3. 합격 가능성 예측
- **등급**: A(매우 높음 80%+) / B(높음 60-79%) / C(보통 40-59%) / D(낮음 <40%)
- **예상 확률**: X%
- **근거**: ...

### 4. 맞춤형 개선 전략
**단기 (서류 제출 전)**:
1. ...
2. ...

**중기 (면접 준비)**:
1. ...
2. ...

**장기 (역량 강화)**:
1. ...
2. ...

### 5. 액션 플랜 (우선순위별)
□ 즉시 해야 할 것 (1주일 내)
□ 면접 전까지 해야 할 것
□ 장기적으로 준비할 것`
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
      console.log(fullText);
      console.log();
    }

  } catch (error) {
    spinner.stop();
    console.log(chalk.red('분석 중 오류가 발생했습니다:'), error);
  }
}

// 연봉 협상 가이드
export async function negotiationGuide(job: JobListing): Promise<void> {
  const profile = await getProfile();

  if (!profile) {
    console.log(chalk.yellow('\n프로필이 없습니다. 먼저 프로필을 생성해주세요.\n'));
    return;
  }

  console.log(chalk.bold.blue('\n=== 연봉 협상 가이드 ===\n'));
  console.log(chalk.gray(`대상: ${job.title} @ ${job.company}\n`));

  const { negotiationType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'negotiationType',
      message: '어떤 정보가 필요하신가요?',
      choices: [
        { name: '💰 적정 연봉 분석', value: 'salary' },
        { name: '📝 협상 시나리오 및 스크립트', value: 'script' },
        { name: '🎁 복리후생 협상 포인트', value: 'benefits' },
        { name: '📊 종합 협상 가이드', value: 'all' },
        { name: '← 돌아가기', value: 'back' }
      ]
    }
  ]);

  if (negotiationType === 'back') return;

  const spinner = ora('연봉 데이터 분석 중...').start();

  try {
    const yearsOfExperience = profile.workExperience.reduce((total, exp) => {
      const start = new Date(exp.startDate);
      const end = exp.current ? new Date() : new Date(exp.endDate || new Date());
      return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
    }, 0);

    const prompts: Record<string, string> = {
      salary: `연봉 협상 전문가로서 적정 연봉을 분석해주세요.

## 지원자 정보
- 직무: ${profile.preferences.targetRoles.join(', ')}
- 총 경력: 약 ${Math.round(yearsOfExperience)}년
- 기술 스택: ${profile.skills.map(s => s.name).join(', ')}
- 현재/이전 회사: ${profile.workExperience[0]?.company || '없음'}
- 희망 연봉: ${profile.preferences.minSalary ? `${(profile.preferences.minSalary / 10000).toLocaleString()}만원 이상` : '미정'}

## 지원 회사
- 회사: ${job.company}
- 포지션: ${job.title}
- 위치: ${job.location}

## 분석 요청

"${job.company} ${job.title} 연봉", "${job.title} 연봉 2025" 등을 검색하여 시장 데이터를 확인하고:

1. **시장 연봉 범위**
   - 하위 25%: X만원
   - 중간값: X만원
   - 상위 25%: X만원

2. **이 지원자의 적정 연봉**
   - 권장 협상 범위: X만원 ~ X만원
   - 근거: ...

3. **연봉 협상 전략**
   - 첫 제안 금액: X만원 (이유)
   - 최소 수용 가능 금액: X만원
   - 협상 카드: ...`,

      script: `연봉 협상 시나리오별 스크립트를 작성해주세요.

## 상황
- 지원자 경력: ${Math.round(yearsOfExperience)}년
- 포지션: ${job.title} @ ${job.company}
- 희망 연봉: ${profile.preferences.minSalary ? `${(profile.preferences.minSalary / 10000).toLocaleString()}만원` : '시장 수준'}

## 시나리오별 스크립트

### 시나리오 1: 회사가 먼저 연봉을 물어볼 때
👤 HR: "희망 연봉이 어떻게 되시나요?"
🧑 나: [스크립트]

### 시나리오 2: 제시 금액이 예상보다 낮을 때
👤 HR: "저희가 제안드리는 연봉은 X만원입니다."
🧑 나: [스크립트]

### 시나리오 3: 협상 여지가 없다고 할 때
👤 HR: "이 금액이 저희 최대입니다."
🧑 나: [스크립트]

### 시나리오 4: 다른 회사 오퍼가 있을 때
🧑 나: [스크립트]

각 시나리오에서 자연스럽고 전문적인 대화 예시를 작성해주세요.`,

      benefits: `복리후생 협상 포인트를 분석해주세요.

## 포지션
${job.title} @ ${job.company}

## 협상 가능한 항목들

1. **금전적 보상**
   - 기본급 외 협상 가능 항목
   - 사이닝 보너스
   - 성과급/인센티브
   - 스톡옵션/RSU

2. **근무 조건**
   - 재택근무 일수
   - 유연근무제
   - 연차 추가

3. **성장 지원**
   - 교육비 지원
   - 컨퍼런스 참가
   - 자격증 취득 지원

4. **기타**
   - 입사일 조정
   - 장비 지원
   - 이사비용

각 항목별로:
- 협상 가능성 (높음/중간/낮음)
- 협상 방법
- 예시 문구`,

      all: `종합 연봉 협상 가이드를 작성해주세요.

## 지원자 정보
- 경력: ${Math.round(yearsOfExperience)}년
- 기술: ${profile.skills.map(s => s.name).join(', ')}
- 희망 연봉: ${profile.preferences.minSalary ? `${(profile.preferences.minSalary / 10000).toLocaleString()}만원` : '미정'}

## 지원 회사
- 회사: ${job.company}
- 포지션: ${job.title}

"${job.company} 연봉", "${job.title} 시장 연봉 2025" 등을 검색하여:

### 1. 시장 연봉 분석
- 시장 범위
- 적정 연봉
- 협상 범위

### 2. 협상 전략
- 타이밍
- 첫 제안 방법
- 카운터 오퍼 전략

### 3. 핵심 스크립트
- 연봉 질문 시
- 낮은 제안 시
- 최종 협상 시

### 4. 복리후생 체크리스트
- 협상할 항목
- 우선순위

### 5. 주의사항
- 하지 말아야 할 것
- 협상 실패 시 대안`
    };

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      tools: [
        {
          type: 'web_search_20250305',
          name: 'web_search',
          max_uses: 3
        }
      ],
      messages: [
        {
          role: 'user',
          content: prompts[negotiationType]
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
      console.log(fullText);
      console.log();
    }

  } catch (error) {
    spinner.stop();
    console.log(chalk.red('분석 중 오류가 발생했습니다:'), error);
  }
}

// 종합 전략 메뉴
export async function showStrategyMenu(job: JobListing): Promise<void> {
  console.log(chalk.bold.blue('\n=== 전략 분석 ===\n'));
  console.log(chalk.gray(`대상: ${job.title} @ ${job.company}\n`));

  const { strategyType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'strategyType',
      message: '어떤 분석이 필요하신가요?',
      choices: [
        { name: '📊 합격률 분석 및 전략', value: 'analysis' },
        { name: '💰 연봉 협상 가이드', value: 'negotiation' },
        { name: '← 돌아가기', value: 'back' }
      ]
    }
  ]);

  if (strategyType === 'back') return;

  if (strategyType === 'analysis') {
    await analyzeSuccessRate(job);
  } else if (strategyType === 'negotiation') {
    await negotiationGuide(job);
  }
}

// 전체 지원 현황 분석
export async function analyzeOverallStrategy(): Promise<void> {
  const profile = await getProfile();
  const jobs = await getJobListings();

  if (!profile) {
    console.log(chalk.yellow('\n프로필이 없습니다. 먼저 프로필을 생성해주세요.\n'));
    return;
  }

  if (jobs.length === 0) {
    console.log(chalk.yellow('\n저장된 공고가 없습니다.\n'));
    return;
  }

  console.log(chalk.bold.blue('\n=== 종합 이직 전략 분석 ===\n'));

  const spinner = ora('전체 지원 현황 분석 중...').start();

  try {
    const appliedJobs = jobs.filter(j => j.status === 'applied' || j.status === 'interviewing');
    const savedJobs = jobs.filter(j => j.status === 'saved');

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      messages: [
        {
          role: 'user',
          content: `이직 전략 컨설턴트로서 전체 지원 현황을 분석해주세요.

## 지원자 프로필
- 희망 직무: ${profile.preferences.targetRoles.join(', ')}
- 기술 스택: ${profile.skills.map(s => s.name).join(', ')}
- 경력: ${profile.workExperience.map(w => `${w.title}@${w.company}`).join(', ')}
- 희망 조건: ${profile.preferences.locations.join(', ')} / ${profile.preferences.remotePreference}

## 저장된 공고 (${savedJobs.length}개)
${savedJobs.slice(0, 5).map(j => `- ${j.title} @ ${j.company} (매칭 ${j.matchScore || '?'}%)`).join('\n')}

## 진행 중인 지원 (${appliedJobs.length}개)
${appliedJobs.map(j => `- ${j.title} @ ${j.company} [${j.status}]`).join('\n') || '없음'}

## 전체 통계
- 총 저장: ${jobs.length}개
- 지원 완료: ${jobs.filter(j => j.status === 'applied').length}개
- 면접 진행: ${jobs.filter(j => j.status === 'interviewing').length}개
- 합격: ${jobs.filter(j => j.status === 'offered').length}개
- 불합격: ${jobs.filter(j => j.status === 'rejected').length}개

## 분석 요청

### 1. 현황 진단
- 지원 패턴 분석
- 성공률 예측
- 주요 이슈

### 2. 포트폴리오 분석
- 지원 회사 다양성
- 직무 집중도
- 리스크 분산 여부

### 3. 전략 제안
- 우선 집중해야 할 공고
- 추가로 지원하면 좋을 유형
- 개선이 필요한 부분

### 4. 주간 액션 플랜
- 이번 주 해야 할 것
- 다음 주 계획`
        }
      ]
    });

    spinner.stop();

    const textContent = response.content.find(c => c.type === 'text');
    if (textContent && textContent.type === 'text') {
      console.log(textContent.text);
      console.log();
    }

  } catch (error) {
    spinner.stop();
    console.log(chalk.red('분석 중 오류가 발생했습니다:'), error);
  }
}
