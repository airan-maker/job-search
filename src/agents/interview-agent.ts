import Anthropic from '@anthropic-ai/sdk';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import type {
  UserProfile,
  JobListing,
  InterviewPrep,
  InterviewQuestion,
  PracticeSession
} from '../types/index.js';
import {
  getProfile,
  getInterviewPrep,
  saveInterviewPrep
} from '../storage/index.js';
import { generateId, getCurrentTimestamp } from '../utils/index.js';

const client = new Anthropic();

export async function prepareInterview(job: JobListing): Promise<void> {
  const profile = await getProfile();

  if (!profile) {
    console.log(chalk.yellow('\n프로필이 없습니다. 먼저 프로필을 생성해주세요.\n'));
    return;
  }

  console.log(chalk.bold.blue('\n=== 면접 준비 ===\n'));
  console.log(chalk.gray(`대상 공고: ${job.title} @ ${job.company}\n`));

  const { prepType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'prepType',
      message: '무엇을 준비하시겠습니까?',
      choices: [
        { name: '📋 예상 질문 생성', value: 'questions' },
        { name: '🎤 모의 면접 연습', value: 'practice' },
        { name: '🏢 회사 정보 리서치', value: 'research' },
        { name: '← 돌아가기', value: 'back' }
      ]
    }
  ]);

  if (prepType === 'back') return;

  if (prepType === 'questions') {
    await generateExpectedQuestions(job, profile);
  } else if (prepType === 'practice') {
    await startMockInterview(job, profile);
  } else if (prepType === 'research') {
    await researchCompany(job);
  }
}

async function generateExpectedQuestions(job: JobListing, profile: UserProfile): Promise<void> {
  console.log(chalk.bold.blue('\n=== 예상 질문 생성 ===\n'));

  const { questionType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'questionType',
      message: '어떤 유형의 질문을 준비하시겠습니까?',
      choices: [
        { name: '전체 (인성 + 기술 + 경험)', value: 'all' },
        { name: '인성/행동 면접 질문', value: 'behavioral' },
        { name: '기술 면접 질문', value: 'technical' },
        { name: '경험/프로젝트 질문', value: 'experience' }
      ]
    }
  ]);

  const spinner = ora('예상 질문 생성 중...').start();

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: `당신은 ${job.company}의 채용 면접관입니다. 다음 포지션과 지원자 정보를 바탕으로 면접 예상 질문을 생성해주세요.

## 채용 포지션
- 회사: ${job.company}
- 직무: ${job.title}
- 설명: ${job.description}

## 지원자 정보
- 경력: ${profile.workExperience.map(w => `${w.title}@${w.company}`).join(', ')}
- 기술스택: ${profile.skills.map(s => s.name).join(', ')}
- 프로젝트: ${profile.projects.map(p => p.name).join(', ')}

## 요청사항
${questionType === 'all' ? '인성, 기술, 경험 각 카테고리별로 5개씩 총 15개 질문' :
  questionType === 'behavioral' ? '인성/행동 면접 질문 10개 (STAR 기법으로 답변할 수 있는 질문)' :
  questionType === 'technical' ? '기술 면접 질문 10개 (지원자의 기술스택 기반)' :
  '경험/프로젝트 관련 질문 10개'}을 생성해주세요.

각 질문에 대해:
1. 질문
2. 이 질문의 의도
3. 좋은 답변을 위한 팁

형식으로 작성해주세요.`
        }
      ]
    });

    spinner.stop();

    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      console.log(chalk.red('질문 생성에 실패했습니다.'));
      return;
    }

    console.log(chalk.bold.green('\n✨ 예상 질문이 생성되었습니다!\n'));
    console.log(chalk.gray('─'.repeat(60)));
    console.log(textContent.text);
    console.log(chalk.gray('─'.repeat(60) + '\n'));

    // 저장
    let prep = await getInterviewPrep(job.id);
    if (!prep) {
      prep = {
        jobListingId: job.id,
        expectedQuestions: [],
        practiceSessions: [],
        createdAt: getCurrentTimestamp(),
        updatedAt: getCurrentTimestamp()
      };
    }

    // 텍스트에서 질문 추출 시도
    const questions = textContent.text.match(/\d+\.\s*\*?\*?질문\*?\*?:?\s*([^\n]+)/gi) || [];
    prep.expectedQuestions = questions.slice(0, 15).map((q, i) => ({
      id: generateId(),
      category: i < 5 ? 'behavioral' : i < 10 ? 'technical' : 'situational',
      question: q.replace(/^\d+\.\s*\*?\*?질문\*?\*?:?\s*/i, '').trim()
    }));

    prep.updatedAt = getCurrentTimestamp();
    await saveInterviewPrep(prep);
    console.log(chalk.green('질문이 저장되었습니다.\n'));

  } catch (error) {
    spinner.stop();
    console.log(chalk.red('질문 생성 중 오류가 발생했습니다:'), error);
  }
}

async function startMockInterview(job: JobListing, profile: UserProfile): Promise<void> {
  console.log(chalk.bold.blue('\n=== 모의 면접 ===\n'));
  console.log(chalk.cyan('면접관 AI와 실제 면접처럼 연습합니다.'));
  console.log(chalk.gray('답변 후 피드백을 받을 수 있습니다.'));
  console.log(chalk.gray('"종료"를 입력하면 면접을 마칩니다.\n'));

  const { interviewType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'interviewType',
      message: '면접 유형을 선택하세요:',
      choices: [
        { name: '1차 면접 (인성/경험)', value: 'first' },
        { name: '기술 면접', value: 'technical' },
        { name: '임원 면접', value: 'executive' }
      ]
    }
  ]);

  const interviewContext: Record<string, string> = {
    first: '1차 실무 면접입니다. 인성과 경험 위주로 질문합니다.',
    technical: '기술 면접입니다. 기술적 깊이를 확인하는 질문을 합니다.',
    executive: '임원 면접입니다. 비전, 성장 가능성, 조직 적합성을 확인합니다.'
  };

  const messages: Anthropic.MessageParam[] = [
    {
      role: 'user',
      content: `당신은 ${job.company}의 면접관입니다. ${job.title} 포지션 지원자와 ${interviewContext[interviewType]}

지원자 정보:
- 경력: ${profile.workExperience.map(w => `${w.title}@${w.company} (${w.description})`).join('; ')}
- 기술: ${profile.skills.map(s => s.name).join(', ')}

면접을 시작해주세요. 한 번에 하나의 질문만 하고, 지원자의 답변을 기다려주세요.
자연스러운 면접 분위기를 유지하면서 후속 질문도 해주세요.`
    }
  ];

  // 첫 질문 받기
  const spinner = ora('면접관 준비 중...').start();

  const firstResponse = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages
  });

  spinner.stop();

  let textContent = firstResponse.content.find(c => c.type === 'text');
  if (textContent && textContent.type === 'text') {
    console.log(chalk.cyan('\n👔 면접관: ') + textContent.text + '\n');
    messages.push({ role: 'assistant', content: textContent.text });
  }

  // 면접 루프
  const practiceSession: PracticeSession = {
    id: generateId(),
    jobListingId: job.id,
    startedAt: getCurrentTimestamp(),
    questions: []
  };

  while (true) {
    const { answer } = await inquirer.prompt([
      {
        type: 'input',
        name: 'answer',
        message: chalk.green('🧑 나: '),
        prefix: ''
      }
    ]);

    if (answer.toLowerCase() === '종료' || answer.toLowerCase() === 'quit') {
      break;
    }

    messages.push({ role: 'user', content: answer });

    const spinner2 = ora('').start();

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages
    });

    spinner2.stop();

    textContent = response.content.find(c => c.type === 'text');
    if (textContent && textContent.type === 'text') {
      console.log(chalk.cyan('\n👔 면접관: ') + textContent.text + '\n');
      messages.push({ role: 'assistant', content: textContent.text });
    }
  }

  // 면접 종료 및 피드백
  console.log(chalk.bold.blue('\n=== 면접 종료 ===\n'));

  const spinner3 = ora('피드백 생성 중...').start();

  messages.push({
    role: 'user',
    content: '면접이 종료되었습니다. 지원자의 전체적인 면접 수행에 대해 다음 항목으로 피드백을 주세요:\n1. 잘한 점\n2. 개선할 점\n3. 종합 평가\n4. 합격 가능성 (A/B/C/D)'
  });

  const feedbackResponse = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages
  });

  spinner3.stop();

  textContent = feedbackResponse.content.find(c => c.type === 'text');
  if (textContent && textContent.type === 'text') {
    console.log(chalk.bold.green('📊 면접 피드백\n'));
    console.log(textContent.text);
    console.log();

    practiceSession.endedAt = getCurrentTimestamp();
    practiceSession.overallFeedback = textContent.text;

    // 저장
    let prep = await getInterviewPrep(job.id);
    if (!prep) {
      prep = {
        jobListingId: job.id,
        expectedQuestions: [],
        practiceSessions: [],
        createdAt: getCurrentTimestamp(),
        updatedAt: getCurrentTimestamp()
      };
    }
    prep.practiceSessions.push(practiceSession);
    prep.updatedAt = getCurrentTimestamp();
    await saveInterviewPrep(prep);

    console.log(chalk.green('면접 기록이 저장되었습니다.\n'));
  }
}

async function researchCompany(job: JobListing): Promise<void> {
  console.log(chalk.bold.blue('\n=== 회사 리서치 ===\n'));

  const spinner = ora(`${job.company} 정보 조사 중...`).start();

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `${job.company} 회사에 대해 면접 준비에 도움이 될 정보를 정리해주세요.

## 포지션
${job.title}

## 조사 항목
1. **회사 개요**: 설립연도, 규모, 주요 사업
2. **기업 문화**: 알려진 조직 문화, 근무 환경
3. **최근 동향**: 뉴스, 투자, 신사업 등
4. **면접 특징**: 알려진 면접 스타일, 자주 나오는 질문
5. **경쟁사**: 주요 경쟁사와 차별점
6. **면접 시 질문할 만한 것들**: 지원자가 역으로 물어보면 좋은 질문 5개

알려진 정보를 바탕으로 작성하고, 확실하지 않은 정보는 명시해주세요.`
        }
      ]
    });

    spinner.stop();

    const textContent = response.content.find(c => c.type === 'text');
    if (textContent && textContent.type === 'text') {
      console.log(chalk.bold.green(`\n✨ ${job.company} 리서치 결과\n`));
      console.log(chalk.gray('─'.repeat(60)));
      console.log(textContent.text);
      console.log(chalk.gray('─'.repeat(60) + '\n'));
    }

  } catch (error) {
    spinner.stop();
    console.log(chalk.red('리서치 중 오류가 발생했습니다:'), error);
  }
}

export async function viewInterviewPrep(jobId: string): Promise<void> {
  const prep = await getInterviewPrep(jobId);

  if (!prep) {
    console.log(chalk.yellow('\n저장된 면접 준비 자료가 없습니다.\n'));
    return;
  }

  console.log(chalk.bold.blue('\n=== 면접 준비 자료 ===\n'));

  if (prep.expectedQuestions.length > 0) {
    console.log(chalk.bold('예상 질문:'));
    prep.expectedQuestions.forEach((q, i) => {
      console.log(`  ${i + 1}. [${q.category}] ${q.question}`);
    });
    console.log();
  }

  if (prep.practiceSessions.length > 0) {
    console.log(chalk.bold(`모의 면접 기록: ${prep.practiceSessions.length}회`));
    prep.practiceSessions.forEach((s, i) => {
      console.log(`  ${i + 1}. ${new Date(s.startedAt).toLocaleDateString('ko-KR')}`);
      if (s.overallFeedback) {
        const preview = s.overallFeedback.slice(0, 100) + '...';
        console.log(chalk.gray(`     ${preview}`));
      }
    });
    console.log();
  }
}
