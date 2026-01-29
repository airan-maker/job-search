import Anthropic from '@anthropic-ai/sdk';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import type { UserProfile, JobListing } from '../types/index.js';
import { getProfile, saveJobListing, getJobListings } from '../storage/index.js';
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
}

function buildSearchQuery(profile: UserProfile): string {
  const roles = profile.preferences.targetRoles.join(' OR ');
  const skills = profile.skills.slice(0, 5).map(s => s.name).join(' ');
  const locations = profile.preferences.locations.join(' OR ');

  return `${roles} ${skills} 채용 ${locations} 2024 2025`;
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

export async function searchJobs(): Promise<void> {
  const profile = await getProfile();

  if (!profile) {
    console.log(chalk.yellow('\n프로필이 없습니다. 먼저 프로필을 생성해주세요.\n'));
    console.log(chalk.gray('메인 메뉴에서 "프로필 관리" → "프로필 생성"을 선택하세요.\n'));
    return;
  }

  console.log(chalk.bold.blue('\n=== AI 채용 공고 탐색 ===\n'));
  console.log(chalk.gray('프로필 기반으로 적합한 채용 공고를 찾고 있습니다...\n'));

  const spinner = ora('채용 공고 검색 중...').start();

  try {
    const profileContext = buildProfileContext(profile);
    const searchQuery = buildSearchQuery(profile);

    spinner.text = `검색 쿼리: "${searchQuery}"`;

    // Claude에게 웹 검색을 요청하고 채용 공고 분석
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

1. 사용자의 기술 스택, 경력, 희망 조건에 맞는 실제 존재할 법한 채용 공고를 찾아주세요.
2. 각 공고에 대해 왜 이 사용자에게 적합한지 설명해주세요.
3. 매칭 점수(0-100)를 산출해주세요.

## 응답 형식 (JSON)

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트 없이 JSON만 출력하세요.

\`\`\`json
{
  "jobs": [
    {
      "title": "직무명",
      "company": "회사명",
      "location": "위치",
      "description": "채용 공고 요약 (2-3문장)",
      "requirements": ["요구사항1", "요구사항2"],
      "url": "https://example.com/job/123",
      "salary": "연봉 정보 (있는 경우)",
      "remote": true/false,
      "matchReason": "이 사용자에게 적합한 이유",
      "matchScore": 85
    }
  ],
  "searchSummary": "검색 결과 요약"
}
\`\`\`

현재 한국 IT 채용 시장의 트렌드를 반영하여, 원티드, 로켓펀치, 잡플래닛, 링크드인, 사람인 등에서 볼 수 있는 실제적인 채용 공고 형태로 작성해주세요.`
        }
      ]
    });

    spinner.stop();

    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      console.log(chalk.red('검색 결과를 가져올 수 없습니다.'));
      return;
    }

    // JSON 파싱
    let searchResults: { jobs: SearchResult[], searchSummary: string };
    try {
      const jsonMatch = textContent.text.match(/```json\n?([\s\S]*?)\n?```/) ||
                        textContent.text.match(/\{[\s\S]*"jobs"[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : textContent.text;
      searchResults = JSON.parse(jsonStr);
    } catch {
      console.log(chalk.red('검색 결과 파싱에 실패했습니다.'));
      console.log(chalk.gray(textContent.text));
      return;
    }

    // 결과 표시
    console.log(chalk.bold.green(`\n✨ ${searchResults.jobs.length}개의 채용 공고를 찾았습니다!\n`));
    console.log(chalk.gray(searchResults.searchSummary + '\n'));
    console.log(chalk.gray('─'.repeat(60) + '\n'));

    for (let i = 0; i < searchResults.jobs.length; i++) {
      const job = searchResults.jobs[i];
      const scoreColor = job.matchScore >= 80 ? 'green' : job.matchScore >= 60 ? 'yellow' : 'gray';

      console.log(chalk.bold(`${i + 1}. ${job.title}`));
      console.log(chalk.cyan(`   ${job.company}`) + chalk.gray(` | ${job.location}`) +
                  (job.remote ? chalk.blue(' | 원격가능') : ''));
      console.log(chalk.gray(`   ${job.description}`));
      if (job.salary) {
        console.log(chalk.green(`   💰 ${job.salary}`));
      }
      console.log(chalk[scoreColor](`   📊 매칭 점수: ${job.matchScore}%`));
      console.log(chalk.gray(`   💡 ${job.matchReason}`));
      console.log(chalk.gray(`   🔗 ${job.url}`));
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
        source: 'ai-search',
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

export async function viewSavedJobs(): Promise<JobListing | null> {
  const jobs = await getJobListings();

  if (jobs.length === 0) {
    console.log(chalk.yellow('\n저장된 채용 공고가 없습니다.\n'));
    console.log(chalk.gray('"채용 공고 탐색"에서 관심 공고를 저장해보세요.\n'));
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

  // 상세 정보 표시
  console.log(chalk.bold.blue('\n=== 공고 상세 ===\n'));
  console.log(chalk.bold(selectedJob.title));
  console.log(chalk.cyan(selectedJob.company) + chalk.gray(` | ${selectedJob.location}`));
  console.log(chalk.gray(`\n${selectedJob.description}`));
  if (selectedJob.matchScore) {
    console.log(chalk.green(`\n매칭 점수: ${selectedJob.matchScore}%`));
  }
  if (selectedJob.notes) {
    console.log(chalk.gray(`\n메모: ${selectedJob.notes}`));
  }
  console.log(chalk.blue(`\n🔗 ${selectedJob.url}\n`));

  // 액션 선택
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: '다음 작업을 선택하세요:',
      choices: [
        { name: '📝 이 공고에 맞는 이력서 생성', value: 'resume' },
        { name: '🎤 면접 준비하기', value: 'interview' },
        { name: '📋 상태 변경', value: 'status' },
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
    console.log(chalk.yellow('\n프로필이 없습니다. 먼저 프로필을 생성해주세요.\n'));
    return;
  }

  const { customQuery } = await inquirer.prompt([
    {
      type: 'input',
      name: 'customQuery',
      message: '추가 검색 조건을 입력하세요 (예: "스타트업", "시리즈B", "핀테크"):'
    }
  ]);

  console.log(chalk.bold.blue('\n=== 맞춤 검색 ===\n'));

  const spinner = ora('채용 공고 검색 중...').start();

  try {
    const profileContext = buildProfileContext(profile);

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `당신은 채용 공고를 찾아주는 전문 헤드헌터 AI입니다.

다음 사용자 프로필과 추가 검색 조건을 고려하여 적합한 채용 공고 5개를 추천해주세요.

${profileContext}

## 추가 검색 조건
${customQuery}

## 응답 형식 (JSON)

반드시 아래 JSON 형식으로만 응답하세요.

\`\`\`json
{
  "jobs": [
    {
      "title": "직무명",
      "company": "회사명",
      "location": "위치",
      "description": "채용 공고 요약",
      "url": "https://example.com/job/123",
      "salary": "연봉 정보",
      "remote": true/false,
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
      console.log(chalk.red('검색 결과를 가져올 수 없습니다.'));
      return;
    }

    let searchResults: { jobs: SearchResult[], searchSummary: string };
    try {
      const jsonMatch = textContent.text.match(/```json\n?([\s\S]*?)\n?```/) ||
                        textContent.text.match(/\{[\s\S]*"jobs"[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : textContent.text;
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
        source: 'ai-search-custom',
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
        notes: `${customQuery} | ${job.matchReason}`,
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
