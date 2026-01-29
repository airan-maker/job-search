#!/usr/bin/env node

import chalk from 'chalk';
import inquirer from 'inquirer';
import { Command } from 'commander';

import { createJobDescription } from './agents/jd-agent.js';
import { sourcingStrategy } from './agents/sourcing-agent.js';
import { designInterview } from './agents/interview-agent.js';
import { evaluateCandidate } from './agents/evaluation-agent.js';
import { employerBranding } from './agents/branding-agent.js';
import { companyInfo, setCompanyInfo } from './utils/index.js';

const program = new Command();

program
  .name('recruiter')
  .description('AI 기반 채용 도우미 - 채용의 모든 과정을 AI가 도와드립니다')
  .version('1.0.0');

function printBanner(): void {
  console.log(chalk.bold.cyan(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║         👔  Recruiter Agent  👔                               ║
║                                                               ║
║    "채용의 모든 과정을 AI가 도와드립니다"                       ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`));
}

function printCompanyInfo(): void {
  console.log(chalk.gray('\n📍 현재 회사 설정'));
  console.log(chalk.gray('─'.repeat(40)));
  console.log(chalk.white(`   ${companyInfo.name} (${companyInfo.industry})`));
  console.log(chalk.gray(`   ${companyInfo.size} | ${companyInfo.stage}`));
  console.log(chalk.gray('─'.repeat(40)));
}

async function showMainMenu(): Promise<void> {
  console.log();

  const { choice } = await inquirer.prompt([
    {
      type: 'list',
      name: 'choice',
      message: '무엇을 하시겠습니까?',
      choices: [
        new inquirer.Separator('── 채용 준비 ──'),
        { name: '📝 JD (채용 공고) 작성', value: 'jd' },
        { name: '🎯 후보자 소싱 전략', value: 'sourcing' },
        new inquirer.Separator('── 평가 ──'),
        { name: '🎤 면접 설계', value: 'interview' },
        { name: '⚖️ 후보자 평가', value: 'evaluation' },
        new inquirer.Separator('── 브랜딩 ──'),
        { name: '📣 채용 브랜딩', value: 'branding' },
        new inquirer.Separator('── 설정 ──'),
        { name: '🏢 회사 정보 설정', value: 'settings' },
        new inquirer.Separator('──────────'),
        { name: '❌ 종료', value: 'exit' }
      ]
    }
  ]);

  await handleMenuChoice(choice);
}

async function handleMenuChoice(choice: string): Promise<void> {
  switch (choice) {
    case 'jd':
      await createJobDescription();
      break;

    case 'sourcing':
      await sourcingStrategy();
      break;

    case 'interview':
      await designInterview();
      break;

    case 'evaluation':
      await evaluateCandidate();
      break;

    case 'branding':
      await employerBranding();
      break;

    case 'settings':
      await configureCompanyInfo();
      break;

    case 'exit':
      console.log(chalk.cyan('\n좋은 인재를 찾으시길 바랍니다! 🤝\n'));
      process.exit(0);
  }
}

async function configureCompanyInfo(): Promise<void> {
  console.log(chalk.bold.blue('\n=== 회사 정보 설정 ===\n'));
  console.log(chalk.gray('회사 정보를 설정하면 더 맞춤화된 콘텐츠를 생성할 수 있습니다.\n'));

  const info = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: '회사명:',
      default: companyInfo.name
    },
    {
      type: 'input',
      name: 'industry',
      message: '산업:',
      default: companyInfo.industry
    },
    {
      type: 'input',
      name: 'size',
      message: '규모:',
      default: companyInfo.size
    },
    {
      type: 'list',
      name: 'stage',
      message: '단계:',
      choices: [
        { name: '스타트업 (시드~시리즈A)', value: 'startup' },
        { name: '성장기 (시리즈B~C)', value: 'growth' },
        { name: '대기업/엔터프라이즈', value: 'enterprise' }
      ],
      default: companyInfo.stage
    },
    {
      type: 'input',
      name: 'culture',
      message: '회사 문화 키워드 (쉼표로 구분):',
      default: companyInfo.culture.join(', ')
    },
    {
      type: 'input',
      name: 'benefits',
      message: '복지/혜택 (쉼표로 구분):',
      default: companyInfo.benefits.join(', ')
    },
    {
      type: 'input',
      name: 'techStack',
      message: '기술 스택 (쉼표로 구분, 없으면 빈칸):',
      default: companyInfo.techStack?.join(', ') || ''
    },
    {
      type: 'input',
      name: 'mission',
      message: '미션 (없으면 빈칸):',
      default: companyInfo.mission || ''
    }
  ]);

  setCompanyInfo({
    name: info.name,
    industry: info.industry,
    size: info.size,
    stage: info.stage as 'startup' | 'growth' | 'enterprise',
    culture: info.culture.split(',').map((s: string) => s.trim()),
    benefits: info.benefits.split(',').map((s: string) => s.trim()),
    techStack: info.techStack ? info.techStack.split(',').map((s: string) => s.trim()) : undefined,
    mission: info.mission || undefined
  });

  console.log(chalk.green('\n✅ 회사 정보가 업데이트되었습니다.\n'));
}

async function main(): Promise<void> {
  printBanner();
  printCompanyInfo();

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
        console.log(chalk.cyan('\n\n종료합니다. 👋\n'));
        process.exit(0);
      }
      console.error(chalk.red('\n오류가 발생했습니다:'), error);
    }
  }
}

// CLI로 직접 실행
main().catch(console.error);
