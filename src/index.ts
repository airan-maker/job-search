#!/usr/bin/env node

import chalk from 'chalk';
import inquirer from 'inquirer';
import { Command } from 'commander';

import {
  viewProfile,
  createProfile,
  editProfile,
  enhanceProfileWithAI
} from './agents/profile-agent.js';

import {
  searchJobs,
  viewSavedJobs,
  searchWithCustomQuery,
  showDashboard
} from './agents/job-search-agent.js';

import {
  generateResume,
  generateCoverLetter
} from './agents/resume-agent.js';

import {
  prepareInterview
} from './agents/interview-agent.js';

import { getProfile } from './storage/index.js';

const program = new Command();

program
  .name('job-search')
  .description('AI 기반 이직 준비 에이전트 - 프라이버시를 지키며 채용 공고를 찾아드립니다')
  .version('2.0.0');

function printBanner(): void {
  console.log(chalk.bold.blue(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║         🎯  Job Search Agent  🎯                              ║
║                                                               ║
║    "내 정보는 비공개, 채용 공고는 AI가 찾아준다"                 ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`));
}

async function showMainMenu(): Promise<void> {
  const profile = await getProfile();
  const hasProfile = !!profile;

  console.log();
  if (hasProfile) {
    console.log(chalk.green(`✓ 프로필: ${profile.personalInfo.name}`));
    console.log(chalk.gray(`  희망 직무: ${profile.preferences.targetRoles.join(', ')}`));
  } else {
    console.log(chalk.yellow('⚠ 프로필이 없습니다. 먼저 프로필을 생성해주세요.'));
  }
  console.log();

  const { choice } = await inquirer.prompt([
    {
      type: 'list',
      name: 'choice',
      message: '무엇을 하시겠습니까?',
      choices: [
        new inquirer.Separator('── 채용 공고 ──'),
        {
          name: '🔍 채용 공고 자동 탐색 (AI가 찾아줍니다)',
          value: 'search',
          disabled: !hasProfile ? '프로필 먼저 생성' : false
        },
        {
          name: '🔎 조건 추가 검색 (특정 키워드로 검색)',
          value: 'customSearch',
          disabled: !hasProfile ? '프로필 먼저 생성' : false
        },
        {
          name: '📋 저장된 공고 보기',
          value: 'savedJobs'
        },
        {
          name: '📊 지원 현황 대시보드',
          value: 'dashboard'
        },
        new inquirer.Separator('── 프로필 ──'),
        {
          name: hasProfile ? '👤 내 프로필 보기' : '👤 프로필 생성하기',
          value: hasProfile ? 'viewProfile' : 'createProfile'
        },
        ...(hasProfile ? [
          { name: '✏️  프로필 수정', value: 'editProfile' },
          { name: '🤖 AI 프로필 분석', value: 'analyzeProfile' }
        ] : []),
        new inquirer.Separator('──────────'),
        { name: '❌ 종료', value: 'exit' }
      ]
    }
  ]);

  await handleMenuChoice(choice);
}

async function handleMenuChoice(choice: string): Promise<void> {
  switch (choice) {
    case 'search':
      await searchJobs();
      break;

    case 'customSearch':
      await searchWithCustomQuery();
      break;

    case 'savedJobs':
      const selectedJob = await viewSavedJobs();
      if (selectedJob) {
        await handleJobAction(selectedJob);
      }
      break;

    case 'dashboard':
      await showDashboard();
      break;

    case 'viewProfile':
      await viewProfile();
      break;

    case 'createProfile':
      await createProfile();
      break;

    case 'editProfile':
      await editProfile();
      break;

    case 'analyzeProfile':
      await enhanceProfileWithAI();
      break;

    case 'exit':
      console.log(chalk.blue('\n이직 준비 화이팅! 좋은 결과 있기를 바랍니다. 👋\n'));
      process.exit(0);
  }
}

async function handleJobAction(job: any): Promise<void> {
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: `"${job.title}" 공고에 대해 무엇을 하시겠습니까?`,
      choices: [
        { name: '📝 맞춤 이력서 생성', value: 'resume' },
        { name: '✉️  자기소개서 작성', value: 'coverLetter' },
        { name: '🎤 면접 준비', value: 'interview' },
        { name: '← 돌아가기', value: 'back' }
      ]
    }
  ]);

  switch (action) {
    case 'resume':
      await generateResume(job);
      break;
    case 'coverLetter':
      await generateCoverLetter(job);
      break;
    case 'interview':
      await prepareInterview(job);
      break;
  }
}

async function main(): Promise<void> {
  printBanner();

  // 환경 변수 체크
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log(chalk.red('\n⚠️  ANTHROPIC_API_KEY 환경 변수가 설정되지 않았습니다.'));
    console.log(chalk.gray('다음 명령어로 설정해주세요:'));
    console.log(chalk.cyan('  export ANTHROPIC_API_KEY="your-api-key"\n'));
    process.exit(1);
  }

  // 메인 루프
  while (true) {
    try {
      await showMainMenu();
    } catch (error) {
      if ((error as any).name === 'ExitPromptError') {
        console.log(chalk.blue('\n\n종료합니다. 👋\n'));
        process.exit(0);
      }
      console.error(chalk.red('\n오류가 발생했습니다:'), error);
    }
  }
}

// CLI로 직접 실행
main().catch(console.error);
