import Anthropic from '@anthropic-ai/sdk';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import type { UserProfile, JobListing, GeneratedResume } from '../types/index.js';
import { getProfile, saveGeneratedResume, getGeneratedResumes } from '../storage/index.js';
import { generateId, getCurrentTimestamp } from '../utils/index.js';

const client = new Anthropic();

function formatProfileForResume(profile: UserProfile): string {
  return `
## 개인정보
- 이름: ${profile.personalInfo.name}
- 이메일: ${profile.personalInfo.email}
- 위치: ${profile.personalInfo.location}
${profile.personalInfo.phone ? `- 연락처: ${profile.personalInfo.phone}` : ''}

## 자기소개
${profile.summary || '(미작성)'}

## 경력사항
${profile.workExperience.map(exp => `
### ${exp.title} @ ${exp.company}
- 기간: ${exp.startDate} ~ ${exp.current ? '현재' : exp.endDate}
- 업무: ${exp.description}
- 성과:
${exp.achievements.map(a => `  - ${a}`).join('\n')}
- 기술: ${exp.skills.join(', ')}
`).join('\n')}

## 학력
${profile.education.map(edu => `
- ${edu.school} - ${edu.degree} ${edu.field} (${edu.startDate} ~ ${edu.current ? '현재' : edu.endDate})
`).join('')}

## 기술 스택
${profile.skills.map(s => s.name).join(', ')}

## 프로젝트
${profile.projects.map(p => `
### ${p.name}
- 역할: ${p.role}
- 설명: ${p.description}
- 기술: ${p.technologies.join(', ')}
- 성과: ${p.achievements.join(', ')}
`).join('\n')}
`;
}

export async function generateResume(job: JobListing): Promise<void> {
  const profile = await getProfile();

  if (!profile) {
    console.log(chalk.yellow('\n프로필이 없습니다. 먼저 프로필을 생성해주세요.\n'));
    return;
  }

  console.log(chalk.bold.blue('\n=== 맞춤 이력서 생성 ===\n'));
  console.log(chalk.gray(`대상 공고: ${job.title} @ ${job.company}\n`));

  const spinner = ora('JD 분석 및 이력서 생성 중...').start();

  try {
    const profileText = formatProfileForResume(profile);

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `당신은 전문 이력서 컨설턴트입니다. 다음 채용 공고와 지원자 프로필을 분석하여, 이 공고에 최적화된 이력서를 작성해주세요.

## 채용 공고 정보
- 회사: ${job.company}
- 포지션: ${job.title}
- 위치: ${job.location}
- 설명: ${job.description}
${job.notes ? `- 참고: ${job.notes}` : ''}

## 지원자 프로필
${profileText}

## 요청사항

1. **JD 분석**: 채용 공고에서 핵심 요구사항과 키워드를 추출하세요.
2. **맞춤 이력서**: 지원자의 경험 중 이 포지션에 가장 관련된 것을 강조하여 이력서를 작성하세요.
3. **하이라이트**: 이 지원자가 특히 어필할 수 있는 포인트 3가지를 제시하세요.

## 응답 형식

### JD 핵심 분석
- 필수 요구사항: ...
- 우대 사항: ...
- 핵심 키워드: ...

### 맞춤 이력서

[마크다운 형식의 완성된 이력서]

### 어필 포인트
1. ...
2. ...
3. ...

### 추가 조언
- 면접 시 강조할 점
- 보완하면 좋을 점`
        }
      ]
    });

    spinner.stop();

    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      console.log(chalk.red('이력서 생성에 실패했습니다.'));
      return;
    }

    console.log(chalk.bold.green('\n✨ 맞춤 이력서가 생성되었습니다!\n'));
    console.log(chalk.gray('─'.repeat(60)));
    console.log(textContent.text);
    console.log(chalk.gray('─'.repeat(60)));

    // 저장 여부 확인
    const { shouldSave } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'shouldSave',
        message: '이 이력서를 저장하시겠습니까?',
        default: true
      }
    ]);

    if (shouldSave) {
      const resume: GeneratedResume = {
        id: generateId(),
        jobListingId: job.id,
        content: textContent.text,
        format: 'markdown',
        highlights: [],
        createdAt: getCurrentTimestamp()
      };
      await saveGeneratedResume(resume);
      console.log(chalk.green('\n이력서가 저장되었습니다.\n'));
    }

  } catch (error) {
    spinner.stop();
    console.log(chalk.red('이력서 생성 중 오류가 발생했습니다:'), error);
  }
}

export async function generateCoverLetter(job: JobListing): Promise<void> {
  const profile = await getProfile();

  if (!profile) {
    console.log(chalk.yellow('\n프로필이 없습니다. 먼저 프로필을 생성해주세요.\n'));
    return;
  }

  console.log(chalk.bold.blue('\n=== 자기소개서 생성 ===\n'));
  console.log(chalk.gray(`대상 공고: ${job.title} @ ${job.company}\n`));

  // 자소서 유형 선택
  const { coverLetterType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'coverLetterType',
      message: '자기소개서 유형을 선택하세요:',
      choices: [
        { name: '일반 자기소개서 (1페이지)', value: 'general' },
        { name: '지원동기 중심', value: 'motivation' },
        { name: '성장과정/경험 중심', value: 'experience' },
        { name: '기술/역량 중심', value: 'technical' }
      ]
    }
  ]);

  const spinner = ora('자기소개서 생성 중...').start();

  try {
    const profileText = formatProfileForResume(profile);

    const typeGuide: Record<string, string> = {
      general: '회사와 포지션에 맞는 일반적인 자기소개서를 1페이지 분량으로 작성해주세요.',
      motivation: '왜 이 회사, 이 포지션에 지원하는지 지원동기를 중심으로 작성해주세요.',
      experience: '지원자의 성장과정과 주요 경험을 중심으로 작성해주세요.',
      technical: '기술적 역량과 프로젝트 경험을 중심으로 작성해주세요.'
    };

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `다음 채용 공고와 지원자 프로필을 기반으로 자기소개서를 작성해주세요.

## 채용 공고
- 회사: ${job.company}
- 포지션: ${job.title}
- 설명: ${job.description}

## 지원자 프로필
${profileText}

## 작성 가이드
${typeGuide[coverLetterType]}

자연스럽고 진정성 있는 톤으로 작성하되, 지원자의 강점을 효과적으로 어필해주세요.
한국어로 작성해주세요.`
        }
      ]
    });

    spinner.stop();

    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      console.log(chalk.red('자기소개서 생성에 실패했습니다.'));
      return;
    }

    console.log(chalk.bold.green('\n✨ 자기소개서가 생성되었습니다!\n'));
    console.log(chalk.gray('─'.repeat(60)));
    console.log(textContent.text);
    console.log(chalk.gray('─'.repeat(60) + '\n'));

  } catch (error) {
    spinner.stop();
    console.log(chalk.red('자기소개서 생성 중 오류가 발생했습니다:'), error);
  }
}

export async function viewSavedResumes(jobId: string): Promise<void> {
  const resumes = await getGeneratedResumes(jobId);

  if (resumes.length === 0) {
    console.log(chalk.yellow('\n저장된 이력서가 없습니다.\n'));
    return;
  }

  console.log(chalk.bold.blue('\n=== 저장된 이력서 ===\n'));

  const { selectedResume } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedResume',
      message: '확인할 이력서를 선택하세요:',
      choices: resumes.map((r, i) => ({
        name: `버전 ${i + 1} (${new Date(r.createdAt).toLocaleDateString('ko-KR')})`,
        value: r
      }))
    }
  ]);

  console.log(chalk.gray('─'.repeat(60)));
  console.log(selectedResume.content);
  console.log(chalk.gray('─'.repeat(60) + '\n'));
}
