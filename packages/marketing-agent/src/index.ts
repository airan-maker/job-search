#!/usr/bin/env node

import chalk from 'chalk';
import inquirer from 'inquirer';
import { Command } from 'commander';

import { analyzePersonas } from './agents/persona-agent.js';
import { generateContent } from './agents/content-agent.js';
import { analyzeChannels } from './agents/channel-agent.js';
import { analyzeCompetitors } from './agents/competitor-agent.js';
import { productInfo } from './utils/index.js';

const program = new Command();

program
  .name('marketing')
  .description('AI 기반 마케팅 에이전트 - Job Search Agent 홍보를 도와드립니다')
  .version('1.0.0');

function printBanner(): void {
  console.log(chalk.bold.magenta(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║         📣  Marketing Agent  📣                               ║
║                                                               ║
║    "Job Search Agent를 세상에 알리자"                          ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`));
}

function printProductInfo(): void {
  console.log(chalk.cyan('\n📦 홍보 대상 서비스'));
  console.log(chalk.gray('─'.repeat(40)));
  console.log(chalk.white(`   ${productInfo.name}`));
  console.log(chalk.gray(`   "${productInfo.tagline}"`));
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
        new inquirer.Separator('── 분석 ──'),
        { name: '🎯 타겟 페르소나 분석', value: 'persona' },
        { name: '🔍 경쟁사 분석', value: 'competitor' },
        { name: '📊 채널 전략', value: 'channel' },
        new inquirer.Separator('── 콘텐츠 생성 ──'),
        { name: '✍️  마케팅 콘텐츠 생성', value: 'content' },
        new inquirer.Separator('──────────'),
        { name: '❌ 종료', value: 'exit' }
      ]
    }
  ]);

  await handleMenuChoice(choice);
}

async function handleMenuChoice(choice: string): Promise<void> {
  switch (choice) {
    case 'persona':
      await analyzePersonas();
      break;

    case 'competitor':
      await analyzeCompetitors();
      break;

    case 'channel':
      await analyzeChannels();
      break;

    case 'content':
      await generateContent();
      break;

    case 'exit':
      console.log(chalk.magenta('\n마케팅 화이팅! 🚀\n'));
      process.exit(0);
  }
}

async function main(): Promise<void> {
  printBanner();
  printProductInfo();

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
        console.log(chalk.magenta('\n\n종료합니다. 👋\n'));
        process.exit(0);
      }
      console.error(chalk.red('\n오류가 발생했습니다:'), error);
    }
  }
}

// CLI로 직접 실행
main().catch(console.error);
