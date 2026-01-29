import Anthropic from '@anthropic-ai/sdk';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import type { UserProfile, JobListing, JobStatus } from '../types/index.js';
import { getProfile, saveJobListing, getJobListings, updateJobListing } from '../storage/index.js';
import { generateId, getCurrentTimestamp } from '../utils/index.js';

const client = new Anthropic();

interface SearchResult {
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  salary?: string;
  remote?: boolean;
  matchReason: string;
  matchScore: number;
  source?: string;
}

function buildSearchQueries(profile: UserProfile): string[] {
  const queries: string[] = [];

  // 직무 기반 쿼리
  for (const role of profile.preferences.targetRoles.slice(0, 2)) {
    const skills = profile.skills.slice(0, 3).map(s => s.name).join(' ');
    queries.push(`${role} ${skills} 채용 채용공고 2025`);
  }

  // 지역 + 직무 쿼리
  if (profile.preferences.locations.length > 0) {
    const location = profile.preferences.locations[0];
    const role = profile.preferences.targetRoles[0] || '';
    queries.push(`${location} ${role} 개발자 채용 원티드 링크드인`);
  }

  return queries;
}

function buildProfileContext(profile: UserProfile): string {
  return `
## 사용자 프로필

### 희망 직무
${profile.preferences.targetRoles.join(', ')}

### 기술 스택
${profile.skills.map(s => s.name).join(', ')}

### 경력 요약
${profile.workExperience.map(w =>
  `- ${w.title} @ ${w.company} (${w.current ? '재직중' : w.endDate}): ${w.description}`
).join('\n')}

### 희망 조건
- 지역: ${profile.preferences.locations.join(', ')}
- 근무형태: ${profile.preferences.remotePreference}
- 희망 연봉: ${profile.preferences.minSalary ? `${(profile.preferences.minSalary / 10000).toLocaleString()}만원 이상` : '무관'}
- 회사 규모: ${profile.preferences.companySize.join(', ')}

### 희망 산업
${profile.preferences.targetIndustries.join(', ')}
`;
}

export async function searchJobsWithWebSearch(): Promise<void> {
  const profile = await getProfile();

  if (!profile) {
    console.log(chalk.yellow('\n프로필이 없습니다. 먼저 프로필을 생성해주세요.\n'));
    return;
  }

  console.log(chalk.bold.blue('\n=== AI 채용 공고 실시간 탐색 ===\n'));
  console.log(chalk.cyan('🌐 웹에서 실시간으로 채용 공고를 검색합니다...\n'));

  const spinner = ora('채용 사이트 검색 중...').start();

  try {
    const profileContext = buildProfileContext(profile);
    const searchQueries = buildSearchQueries(profile);

    spinner.text = `검색 중: "${searchQueries[0]}"`;

    // 웹 검색 도구를 사용하여 실제 채용 공고 검색
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
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
          content: `당신은 채용 공고를 찾아주는 전문 헤드헌터 AI입니다.

다음 사용자 프로필에 맞는 실제 채용 공고를 웹에서 검색해주세요.

${profileContext}

## 검색 요청
다음 검색어들을 사용하여 실제 채용 공고를 찾아주세요:
${searchQueries.map((q, i) => `${i + 1}. "${q}"`).join('\n')}

원티드, 링크드인, 잡코리아, 사람인, 로켓펀치 등의 채용 사이트에서 실제 공고를 찾아주세요.

## 응답 형식 (JSON)

검색 결과를 분석하여 사용자에게 적합한 채용 공고 5-7개를 다음 JSON 형식으로 정리해주세요:

\`\`\`json
{
  "jobs": [
    {
      "title": "실제 채용 공고 제목",
      "company": "회사명",
      "location": "위치",
      "description": "공고 요약 (2-3문장)",
      "url": "실제 채용 공고 URL",
      "salary": "연봉 정보 (있는 경우)",
      "remote": true/false,
      "source": "출처 (원티드/링크드인/등)",
      "matchReason": "이 사용자에게 적합한 이유",
      "matchScore": 85
    }
  ],
  "searchSummary": "검색 결과 요약 및 채용 시장 동향"
}
\`\`\``
        }
      ]
    });

    spinner.stop();

    // 응답에서 텍스트 추출
    let fullText = '';
    for (const block of response.content) {
      if (block.type === 'text') {
        fullText += block.text;
      }
    }

    if (!fullText) {
      console.log(chalk.red('검색 결과를 가져올 수 없습니다.'));
      return;
    }

    // JSON 파싱
    let searchResults: { jobs: SearchResult[], searchSummary: string };
    try {
      const jsonMatch = fullText.match(/```json\n?([\s\S]*?)\n?```/) ||
                        fullText.match(/\{[\s\S]*"jobs"[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : fullText;
      searchResults = JSON.parse(jsonStr);
    } catch {
      console.log(chalk.yellow('\n웹 검색 결과를 파싱하는 중...'));
      console.log(chalk.gray(fullText.slice(0, 500) + '...'));
      return;
    }

    // 결과 표시
    console.log(chalk.bold.green(`\n✨ ${searchResults.jobs.length}개의 실제 채용 공고를 찾았습니다!\n`));
    console.log(chalk.gray(searchResults.searchSummary + '\n'));
    console.log(chalk.gray('─'.repeat(60) + '\n'));

    for (let i = 0; i < searchResults.jobs.length; i++) {
      const job = searchResults.jobs[i];
      const scoreColor = job.matchScore >= 80 ? 'green' : job.matchScore >= 60 ? 'yellow' : 'gray';

      console.log(chalk.bold(`${i + 1}. ${job.title}`));
      console.log(chalk.cyan(`   ${job.company}`) + chalk.gray(` | ${job.location}`) +
                  (job.remote ? chalk.blue(' | 원격가능') : '') +
                  (job.source ? chalk.magenta(` | ${job.source}`) : ''));
      console.log(chalk.gray(`   ${job.description}`));
      if (job.salary) {
        console.log(chalk.green(`   💰 ${job.salary}`));
      }
      console.log(chalk[scoreColor](`   📊 매칭 점수: ${job.matchScore}%`));
      console.log(chalk.gray(`   💡 ${job.matchReason}`));
      console.log(chalk.blue(`   🔗 ${job.url}`));
      console.log();
    }

    // 저장할 공고 선택
    const { selectedJobs } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedJobs',
        message: '관심 공고를 선택하세요 (저장됩니다):',
        choices: searchResults.jobs.map((job, i) => ({
          name: `[${job.matchScore}%] ${job.title} @ ${job.company}`,
          value: i,
          checked: job.matchScore >= 70
        }))
      }
    ]);

    // 선택된 공고 저장
    for (const idx of selectedJobs) {
      const job = searchResults.jobs[idx];
      const jobListing: JobListing = {
        id: generateId(),
        source: job.source || 'web-search',
        url: job.url,
        company: job.company,
        title: job.title,
        description: job.description,
        requirements: [],
        preferredQualifications: [],
        salary: job.salary ? {
          min: undefined,
          max: undefined,
          currency: 'KRW',
          period: 'yearly'
        } : undefined,
        location: job.location,
        remote: job.remote || false,
        matchScore: job.matchScore,
        status: 'saved',
        notes: job.matchReason,
        createdAt: getCurrentTimestamp(),
        updatedAt: getCurrentTimestamp()
      };
      await saveJobListing(jobListing);
    }

    if (selectedJobs.length > 0) {
      console.log(chalk.green(`\n✅ ${selectedJobs.length}개의 공고가 저장되었습니다.\n`));
    }

  } catch (error) {
    spinner.stop();
    console.log(chalk.red('검색 중 오류가 발생했습니다:'), error);
  }
}

// 기존 AI 기반 검색 (웹 검색 없이)
export async function searchJobs(): Promise<void> {
  const profile = await getProfile();

  if (!profile) {
    console.log(chalk.yellow('\n프로필이 없습니다. 먼저 프로필을 생성해주세요.\n'));
    return;
  }

  // 검색 모드 선택
  const { searchMode } = await inquirer.prompt([
    {
      type: 'list',
      name: 'searchMode',
      message: '검색 방식을 선택하세요:',
      choices: [
        { name: '🌐 실시간 웹 검색 (실제 채용 공고)', value: 'web' },
        { name: '🤖 AI 추천 (프로필 기반 맞춤 추천)', value: 'ai' },
        { name: '← 돌아가기', value: 'back' }
      ]
    }
  ]);

  if (searchMode === 'back') return;

  if (searchMode === 'web') {
    await searchJobsWithWebSearch();
    return;
  }

  // 기존 AI 기반 검색
  console.log(chalk.bold.blue('\n=== AI 채용 공고 추천 ===\n'));
  console.log(chalk.gray('프로필 기반으로 적합한 채용 공고를 추천합니다...\n'));

  const spinner = ora('채용 공고 분석 중...').start();

  try {
    const profileContext = buildProfileContext(profile);

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `당신은 채용 공고를 찾아주는 전문 헤드헌터 AI입니다.

다음 사용자 프로필을 분석하고, 이 사람에게 적합한 채용 공고 5-7개를 추천해주세요.

${profileContext}

## 요청사항

1. 사용자의 기술 스택, 경력, 희망 조건에 맞는 현실적인 채용 공고를 추천해주세요.
2. 각 공고에 대해 왜 이 사용자에게 적합한지 설명해주세요.
3. 매칭 점수(0-100)를 산출해주세요.

## 응답 형식 (JSON)

\`\`\`json
{
  "jobs": [
    {
      "title": "직무명",
      "company": "회사명",
      "location": "위치",
      "description": "채용 공고 요약",
      "url": "https://www.wanted.co.kr/wd/123456",
      "salary": "연봉 정보",
      "remote": true/false,
      "source": "원티드",
      "matchReason": "적합한 이유",
      "matchScore": 85
    }
  ],
  "searchSummary": "검색 결과 요약"
}
\`\`\``
        }
      ]
    });

    spinner.stop();

    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      console.log(chalk.red('추천 결과를 가져올 수 없습니다.'));
      return;
    }

    let searchResults: { jobs: SearchResult[], searchSummary: string };
    try {
      const jsonMatch = textContent.text.match(/```json\n?([\s\S]*?)\n?```/) ||
                        textContent.text.match(/\{[\s\S]*"jobs"[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : textContent.text;
      searchResults = JSON.parse(jsonStr);
    } catch {
      console.log(chalk.red('결과 파싱에 실패했습니다.'));
      return;
    }

    console.log(chalk.bold.green(`\n✨ ${searchResults.jobs.length}개의 채용 공고를 추천합니다!\n`));
    console.log(chalk.gray(searchResults.searchSummary + '\n'));

    for (let i = 0; i < searchResults.jobs.length; i++) {
      const job = searchResults.jobs[i];
      const scoreColor = job.matchScore >= 80 ? 'green' : job.matchScore >= 60 ? 'yellow' : 'gray';

      console.log(chalk.bold(`${i + 1}. ${job.title}`));
      console.log(chalk.cyan(`   ${job.company}`) + chalk.gray(` | ${job.location}`));
      console.log(chalk.gray(`   ${job.description}`));
      console.log(chalk[scoreColor](`   📊 매칭 점수: ${job.matchScore}%`));
      console.log();
    }

    const { selectedJobs } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedJobs',
        message: '관심 공고를 선택하세요:',
        choices: searchResults.jobs.map((job, i) => ({
          name: `[${job.matchScore}%] ${job.title} @ ${job.company}`,
          value: i,
          checked: job.matchScore >= 70
        }))
      }
    ]);

    for (const idx of selectedJobs) {
      const job = searchResults.jobs[idx];
      const jobListing: JobListing = {
        id: generateId(),
        source: job.source || 'ai-recommendation',
        url: job.url,
        company: job.company,
        title: job.title,
        description: job.description,
        requirements: [],
        preferredQualifications: [],
        location: job.location,
        remote: job.remote || false,
        matchScore: job.matchScore,
        status: 'saved',
        notes: job.matchReason,
        createdAt: getCurrentTimestamp(),
        updatedAt: getCurrentTimestamp()
      };
      await saveJobListing(jobListing);
    }

    if (selectedJobs.length > 0) {
      console.log(chalk.green(`\n✅ ${selectedJobs.length}개의 공고가 저장되었습니다.\n`));
    }

  } catch (error) {
    spinner.stop();
    console.log(chalk.red('추천 중 오류가 발생했습니다:'), error);
  }
}

export async function viewSavedJobs(): Promise<JobListing | null> {
  const jobs = await getJobListings();

  if (jobs.length === 0) {
    console.log(chalk.yellow('\n저장된 채용 공고가 없습니다.\n'));
    return null;
  }

  console.log(chalk.bold.blue('\n=== 저장된 채용 공고 ===\n'));

  const statusEmoji: Record<string, string> = {
    'new': '🆕',
    'saved': '💾',
    'applied': '📨',
    'interviewing': '💬',
    'rejected': '❌',
    'offered': '🎉'
  };

  const { selectedJob } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedJob',
      message: '상세 보기할 공고를 선택하세요:',
      choices: [
        ...jobs.map(job => ({
          name: `${statusEmoji[job.status]} [${job.matchScore || '-'}%] ${job.title} @ ${job.company}`,
          value: job
        })),
        { name: chalk.gray('← 돌아가기'), value: null }
      ]
    }
  ]);

  if (!selectedJob) return null;

  console.log(chalk.bold.blue('\n=== 공고 상세 ===\n'));
  console.log(chalk.bold(selectedJob.title));
  console.log(chalk.cyan(selectedJob.company) + chalk.gray(` | ${selectedJob.location}`));
  console.log(chalk.gray(`출처: ${selectedJob.source}`));
  console.log(chalk.gray(`\n${selectedJob.description}`));
  if (selectedJob.matchScore) {
    console.log(chalk.green(`\n매칭 점수: ${selectedJob.matchScore}%`));
  }
  if (selectedJob.notes) {
    console.log(chalk.gray(`\n추천 이유: ${selectedJob.notes}`));
  }
  console.log(chalk.blue(`\n🔗 ${selectedJob.url}\n`));

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: '다음 작업을 선택하세요:',
      choices: [
        { name: '📝 맞춤 이력서 생성', value: 'resume' },
        { name: '🎤 면접 준비하기', value: 'interview' },
        { name: '📋 상태 변경', value: 'status' },
        { name: '🗑️  공고 삭제', value: 'delete' },
        { name: '← 돌아가기', value: 'back' }
      ]
    }
  ]);

  if (action === 'status') {
    const { newStatus } = await inquirer.prompt([
      {
        type: 'list',
        name: 'newStatus',
        message: '새 상태를 선택하세요:',
        choices: [
          { name: '💾 저장됨', value: 'saved' },
          { name: '📨 지원완료', value: 'applied' },
          { name: '💬 면접중', value: 'interviewing' },
          { name: '❌ 불합격', value: 'rejected' },
          { name: '🎉 합격', value: 'offered' }
        ]
      }
    ]);
    selectedJob.status = newStatus;
    selectedJob.updatedAt = getCurrentTimestamp();
    if (newStatus === 'applied') {
      selectedJob.appliedDate = getCurrentTimestamp();
    }
    await saveJobListing(selectedJob);
    console.log(chalk.green('\n상태가 업데이트되었습니다.\n'));
  }

  if (action === 'resume' || action === 'interview') {
    return selectedJob;
  }

  return null;
}

export async function searchWithCustomQuery(): Promise<void> {
  const profile = await getProfile();

  if (!profile) {
    console.log(chalk.yellow('\n프로필이 없습니다.\n'));
    return;
  }

  const { customQuery } = await inquirer.prompt([
    {
      type: 'input',
      name: 'customQuery',
      message: '검색할 키워드를 입력하세요 (예: "스타트업 핀테크", "시리즈B AI"):'
    }
  ]);

  if (!customQuery.trim()) return;

  console.log(chalk.bold.blue('\n=== 맞춤 검색 ===\n'));

  const spinner = ora(`"${customQuery}" 검색 중...`).start();

  try {
    const profileContext = buildProfileContext(profile);

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
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
          content: `다음 사용자 프로필과 검색 키워드로 채용 공고를 찾아주세요.

${profileContext}

## 검색 키워드
"${customQuery} 채용 개발자 2025"

## 응답 형식 (JSON)

\`\`\`json
{
  "jobs": [
    {
      "title": "직무명",
      "company": "회사명",
      "location": "위치",
      "description": "공고 요약",
      "url": "채용 공고 URL",
      "salary": "연봉 정보",
      "remote": true/false,
      "source": "출처",
      "matchReason": "적합한 이유",
      "matchScore": 85
    }
  ],
  "searchSummary": "검색 결과 요약"
}
\`\`\``
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

    let searchResults: { jobs: SearchResult[], searchSummary: string };
    try {
      const jsonMatch = fullText.match(/```json\n?([\s\S]*?)\n?```/) ||
                        fullText.match(/\{[\s\S]*"jobs"[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : fullText;
      searchResults = JSON.parse(jsonStr);
    } catch {
      console.log(chalk.red('검색 결과 파싱에 실패했습니다.'));
      return;
    }

    console.log(chalk.bold.green(`\n✨ ${searchResults.jobs.length}개의 채용 공고를 찾았습니다!\n`));

    for (let i = 0; i < searchResults.jobs.length; i++) {
      const job = searchResults.jobs[i];
      console.log(chalk.bold(`${i + 1}. ${job.title}`));
      console.log(chalk.cyan(`   ${job.company}`) + chalk.gray(` | ${job.location}`));
      console.log(chalk.gray(`   ${job.description}`));
      console.log(chalk.green(`   📊 매칭 점수: ${job.matchScore}%`));
      console.log();
    }

    const { selectedJobs } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedJobs',
        message: '관심 공고를 선택하세요:',
        choices: searchResults.jobs.map((job, i) => ({
          name: `[${job.matchScore}%] ${job.title} @ ${job.company}`,
          value: i
        }))
      }
    ]);

    for (const idx of selectedJobs) {
      const job = searchResults.jobs[idx];
      const jobListing: JobListing = {
        id: generateId(),
        source: job.source || 'custom-search',
        url: job.url,
        company: job.company,
        title: job.title,
        description: job.description,
        requirements: [],
        preferredQualifications: [],
        location: job.location,
        remote: job.remote || false,
        matchScore: job.matchScore,
        status: 'saved',
        notes: `[${customQuery}] ${job.matchReason}`,
        createdAt: getCurrentTimestamp(),
        updatedAt: getCurrentTimestamp()
      };
      await saveJobListing(jobListing);
    }

    if (selectedJobs.length > 0) {
      console.log(chalk.green(`\n✅ ${selectedJobs.length}개의 공고가 저장되었습니다.\n`));
    }

  } catch (error) {
    spinner.stop();
    console.log(chalk.red('검색 중 오류가 발생했습니다:'), error);
  }
}

// 대시보드 기능
export async function showDashboard(): Promise<void> {
  const jobs = await getJobListings();

  console.log(chalk.bold.blue('\n=== 지원 현황 대시보드 ===\n'));

  if (jobs.length === 0) {
    console.log(chalk.yellow('저장된 채용 공고가 없습니다.\n'));
    return;
  }

  // 상태별 통계
  const statusCounts: Record<JobStatus, number> = {
    'new': 0,
    'saved': 0,
    'applied': 0,
    'interviewing': 0,
    'rejected': 0,
    'offered': 0
  };

  for (const job of jobs) {
    statusCounts[job.status]++;
  }

  const statusLabels: Record<JobStatus, string> = {
    'new': '🆕 신규',
    'saved': '💾 저장됨',
    'applied': '📨 지원완료',
    'interviewing': '💬 면접중',
    'rejected': '❌ 불합격',
    'offered': '🎉 합격'
  };

  console.log(chalk.bold('📊 상태별 현황'));
  console.log(chalk.gray('─'.repeat(40)));

  for (const [status, label] of Object.entries(statusLabels)) {
    const count = statusCounts[status as JobStatus];
    const bar = '█'.repeat(count) + '░'.repeat(Math.max(0, 10 - count));
    const color = status === 'offered' ? 'green' :
                  status === 'interviewing' ? 'cyan' :
                  status === 'applied' ? 'blue' :
                  status === 'rejected' ? 'red' : 'gray';
    console.log(`  ${label.padEnd(12)} ${chalk[color](bar)} ${count}개`);
  }
  console.log();

  // 최근 활동
  const recentJobs = jobs
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  console.log(chalk.bold('📅 최근 활동'));
  console.log(chalk.gray('─'.repeat(40)));

  for (const job of recentJobs) {
    const date = new Date(job.updatedAt).toLocaleDateString('ko-KR');
    const statusIcon = statusLabels[job.status].split(' ')[0];
    console.log(`  ${statusIcon} ${job.title.slice(0, 25).padEnd(25)} ${chalk.gray(date)}`);
    console.log(chalk.gray(`     @ ${job.company}`));
  }
  console.log();

  // 매칭 점수 분포
  const highMatch = jobs.filter(j => (j.matchScore || 0) >= 80).length;
  const midMatch = jobs.filter(j => (j.matchScore || 0) >= 60 && (j.matchScore || 0) < 80).length;
  const lowMatch = jobs.filter(j => (j.matchScore || 0) < 60).length;

  console.log(chalk.bold('🎯 매칭 점수 분포'));
  console.log(chalk.gray('─'.repeat(40)));
  console.log(`  ${chalk.green('80%+')}  ${'█'.repeat(highMatch)}${'░'.repeat(Math.max(0, 10 - highMatch))} ${highMatch}개`);
  console.log(`  ${chalk.yellow('60-79%')} ${'█'.repeat(midMatch)}${'░'.repeat(Math.max(0, 10 - midMatch))} ${midMatch}개`);
  console.log(`  ${chalk.gray('<60%')}  ${'█'.repeat(lowMatch)}${'░'.repeat(Math.max(0, 10 - lowMatch))} ${lowMatch}개`);
  console.log();

  // 진행 중인 지원
  const activeApplications = jobs.filter(j => j.status === 'applied' || j.status === 'interviewing');
  if (activeApplications.length > 0) {
    console.log(chalk.bold('⏳ 진행 중인 지원'));
    console.log(chalk.gray('─'.repeat(40)));
    for (const job of activeApplications) {
      const appliedDate = job.appliedDate ? new Date(job.appliedDate).toLocaleDateString('ko-KR') : '-';
      console.log(`  ${statusLabels[job.status].split(' ')[0]} ${job.title}`);
      console.log(chalk.gray(`     @ ${job.company} | 지원일: ${appliedDate}`));
    }
    console.log();
  }

  console.log(chalk.gray(`총 ${jobs.length}개의 공고가 저장되어 있습니다.\n`));
}
