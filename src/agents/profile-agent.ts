import Anthropic from '@anthropic-ai/sdk';
import inquirer from 'inquirer';
import chalk from 'chalk';
import type {
  UserProfile,
  WorkExperience,
  Education,
  Skill,
  Project,
  JobPreferences
} from '../types/index.js';
import { getProfile, saveProfile } from '../storage/index.js';
import { generateId, getCurrentTimestamp } from '../utils/index.js';

const client = new Anthropic();

export async function viewProfile(): Promise<void> {
  const profile = await getProfile();

  if (!profile) {
    console.log(chalk.yellow('\n프로필이 없습니다. 먼저 프로필을 생성해주세요.\n'));
    return;
  }

  console.log(chalk.bold.blue('\n=== 내 프로필 ===\n'));

  // Personal Info
  console.log(chalk.bold('기본 정보'));
  console.log(`  이름: ${profile.personalInfo.name}`);
  console.log(`  이메일: ${profile.personalInfo.email}`);
  if (profile.personalInfo.phone) {
    console.log(`  전화번호: ${profile.personalInfo.phone}`);
  }
  console.log(`  위치: ${profile.personalInfo.location}`);

  // Summary
  if (profile.summary) {
    console.log(chalk.bold('\n자기 소개'));
    console.log(`  ${profile.summary}`);
  }

  // Work Experience
  if (profile.workExperience.length > 0) {
    console.log(chalk.bold('\n경력 사항'));
    for (const exp of profile.workExperience) {
      const period = exp.current
        ? `${exp.startDate} ~ 현재`
        : `${exp.startDate} ~ ${exp.endDate}`;
      console.log(`  ${chalk.cyan(exp.title)} @ ${exp.company}`);
      console.log(`    ${period}`);
      console.log(`    ${exp.description}`);
      if (exp.achievements.length > 0) {
        console.log(`    주요 성과:`);
        exp.achievements.forEach(a => console.log(`      - ${a}`));
      }
    }
  }

  // Education
  if (profile.education.length > 0) {
    console.log(chalk.bold('\n학력'));
    for (const edu of profile.education) {
      const period = edu.current
        ? `${edu.startDate} ~ 현재`
        : `${edu.startDate} ~ ${edu.endDate}`;
      console.log(`  ${edu.school} - ${edu.degree} ${edu.field}`);
      console.log(`    ${period}`);
    }
  }

  // Skills
  if (profile.skills.length > 0) {
    console.log(chalk.bold('\n기술 스택'));
    const skillsByCategory = profile.skills.reduce((acc, skill) => {
      if (!acc[skill.category]) acc[skill.category] = [];
      acc[skill.category].push(skill);
      return acc;
    }, {} as Record<string, Skill[]>);

    for (const [category, skills] of Object.entries(skillsByCategory)) {
      console.log(`  ${chalk.cyan(category)}: ${skills.map(s => s.name).join(', ')}`);
    }
  }

  // Projects
  if (profile.projects.length > 0) {
    console.log(chalk.bold('\n프로젝트'));
    for (const project of profile.projects) {
      console.log(`  ${chalk.cyan(project.name)} (${project.role})`);
      console.log(`    ${project.description}`);
      console.log(`    기술: ${project.technologies.join(', ')}`);
    }
  }

  // Preferences
  console.log(chalk.bold('\n희망 조건'));
  console.log(`  희망 직무: ${profile.preferences.targetRoles.join(', ')}`);
  console.log(`  희망 산업: ${profile.preferences.targetIndustries.join(', ')}`);
  console.log(`  희망 지역: ${profile.preferences.locations.join(', ')}`);
  console.log(`  근무 형태: ${profile.preferences.remotePreference}`);
  if (profile.preferences.minSalary) {
    console.log(`  희망 연봉: ${profile.preferences.minSalary.toLocaleString()}원 이상`);
  }

  console.log();
}

export async function createProfile(): Promise<UserProfile> {
  console.log(chalk.bold.blue('\n=== 프로필 생성 ===\n'));
  console.log('기본 정보부터 입력해주세요.\n');

  // Personal Info
  const personalInfo = await inquirer.prompt([
    { type: 'input', name: 'name', message: '이름:' },
    { type: 'input', name: 'email', message: '이메일:' },
    { type: 'input', name: 'phone', message: '전화번호 (선택):' },
    { type: 'input', name: 'location', message: '거주 지역:' }
  ]);

  // Summary
  const { summary } = await inquirer.prompt([
    {
      type: 'editor',
      name: 'summary',
      message: '자기 소개를 입력하세요 (간단한 소개 또는 커리어 요약):'
    }
  ]);

  // Work Experience
  const workExperience: WorkExperience[] = [];
  let addMoreWork = true;

  console.log(chalk.bold('\n경력 사항'));
  while (addMoreWork) {
    const { hasWork } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'hasWork',
        message: workExperience.length === 0
          ? '경력 사항을 추가하시겠습니까?'
          : '경력 사항을 더 추가하시겠습니까?',
        default: workExperience.length === 0
      }
    ]);

    if (!hasWork) {
      addMoreWork = false;
      continue;
    }

    const work = await inquirer.prompt([
      { type: 'input', name: 'company', message: '회사명:' },
      { type: 'input', name: 'title', message: '직책:' },
      { type: 'input', name: 'startDate', message: '입사일 (YYYY-MM):' },
      { type: 'confirm', name: 'current', message: '현재 재직 중입니까?' },
      {
        type: 'input',
        name: 'endDate',
        message: '퇴사일 (YYYY-MM):',
        when: (answers) => !answers.current
      },
      { type: 'input', name: 'description', message: '담당 업무:' },
      {
        type: 'input',
        name: 'achievements',
        message: '주요 성과 (쉼표로 구분):'
      },
      {
        type: 'input',
        name: 'skills',
        message: '사용 기술 (쉼표로 구분):'
      }
    ]);

    workExperience.push({
      ...work,
      achievements: work.achievements.split(',').map((s: string) => s.trim()).filter(Boolean),
      skills: work.skills.split(',').map((s: string) => s.trim()).filter(Boolean)
    });
  }

  // Education
  const education: Education[] = [];
  let addMoreEdu = true;

  console.log(chalk.bold('\n학력'));
  while (addMoreEdu) {
    const { hasEdu } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'hasEdu',
        message: education.length === 0
          ? '학력 사항을 추가하시겠습니까?'
          : '학력 사항을 더 추가하시겠습니까?',
        default: education.length === 0
      }
    ]);

    if (!hasEdu) {
      addMoreEdu = false;
      continue;
    }

    const edu = await inquirer.prompt([
      { type: 'input', name: 'school', message: '학교명:' },
      { type: 'input', name: 'degree', message: '학위 (학사/석사/박사):' },
      { type: 'input', name: 'field', message: '전공:' },
      { type: 'input', name: 'startDate', message: '입학일 (YYYY-MM):' },
      { type: 'confirm', name: 'current', message: '현재 재학 중입니까?' },
      {
        type: 'input',
        name: 'endDate',
        message: '졸업일 (YYYY-MM):',
        when: (answers) => !answers.current
      }
    ]);

    education.push(edu);
  }

  // Skills
  console.log(chalk.bold('\n기술 스택'));
  const { skillsInput } = await inquirer.prompt([
    {
      type: 'input',
      name: 'skillsInput',
      message: '보유 기술을 입력하세요 (쉼표로 구분, 예: JavaScript, Python, React):'
    }
  ]);

  const skills: Skill[] = skillsInput
    .split(',')
    .map((s: string) => s.trim())
    .filter(Boolean)
    .map((name: string) => ({
      name,
      level: 'intermediate' as const,
      category: 'Technical'
    }));

  // Projects
  const projects: Project[] = [];
  let addMoreProjects = true;

  console.log(chalk.bold('\n프로젝트'));
  while (addMoreProjects) {
    const { hasProject } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'hasProject',
        message: projects.length === 0
          ? '프로젝트를 추가하시겠습니까?'
          : '프로젝트를 더 추가하시겠습니까?',
        default: false
      }
    ]);

    if (!hasProject) {
      addMoreProjects = false;
      continue;
    }

    const project = await inquirer.prompt([
      { type: 'input', name: 'name', message: '프로젝트명:' },
      { type: 'input', name: 'role', message: '역할:' },
      { type: 'input', name: 'description', message: '설명:' },
      {
        type: 'input',
        name: 'technologies',
        message: '사용 기술 (쉼표로 구분):'
      },
      {
        type: 'input',
        name: 'achievements',
        message: '성과 (쉼표로 구분):'
      }
    ]);

    projects.push({
      ...project,
      startDate: '',
      technologies: project.technologies.split(',').map((s: string) => s.trim()).filter(Boolean),
      achievements: project.achievements.split(',').map((s: string) => s.trim()).filter(Boolean)
    });
  }

  // Job Preferences
  console.log(chalk.bold('\n희망 조건'));
  const preferences = await inquirer.prompt([
    {
      type: 'input',
      name: 'targetRoles',
      message: '희망 직무 (쉼표로 구분):'
    },
    {
      type: 'input',
      name: 'targetIndustries',
      message: '희망 산업 (쉼표로 구분):'
    },
    {
      type: 'input',
      name: 'locations',
      message: '희망 지역 (쉼표로 구분):'
    },
    {
      type: 'list',
      name: 'remotePreference',
      message: '근무 형태:',
      choices: [
        { name: '재택근무', value: 'remote' },
        { name: '하이브리드', value: 'hybrid' },
        { name: '사무실 출근', value: 'onsite' },
        { name: '상관없음', value: 'any' }
      ]
    },
    {
      type: 'input',
      name: 'minSalary',
      message: '희망 최소 연봉 (만원, 예: 5000):'
    },
    {
      type: 'checkbox',
      name: 'companySize',
      message: '희망 회사 규모:',
      choices: [
        { name: '스타트업', value: 'startup' },
        { name: '중견기업', value: 'mid' },
        { name: '대기업', value: 'enterprise' }
      ]
    }
  ]);

  const jobPreferences: JobPreferences = {
    targetRoles: preferences.targetRoles.split(',').map((s: string) => s.trim()).filter(Boolean),
    targetIndustries: preferences.targetIndustries.split(',').map((s: string) => s.trim()).filter(Boolean),
    locations: preferences.locations.split(',').map((s: string) => s.trim()).filter(Boolean),
    remotePreference: preferences.remotePreference,
    minSalary: preferences.minSalary ? parseInt(preferences.minSalary) * 10000 : undefined,
    companySize: preferences.companySize
  };

  const profile: UserProfile = {
    id: generateId(),
    personalInfo: {
      name: personalInfo.name,
      email: personalInfo.email,
      phone: personalInfo.phone || undefined,
      location: personalInfo.location
    },
    summary: summary.trim() || undefined,
    workExperience,
    education,
    skills,
    projects,
    certifications: [],
    preferences: jobPreferences,
    createdAt: getCurrentTimestamp(),
    updatedAt: getCurrentTimestamp()
  };

  await saveProfile(profile);
  console.log(chalk.green('\n프로필이 저장되었습니다!\n'));

  return profile;
}

export async function enhanceProfileWithAI(): Promise<void> {
  const profile = await getProfile();

  if (!profile) {
    console.log(chalk.yellow('\n프로필이 없습니다. 먼저 프로필을 생성해주세요.\n'));
    return;
  }

  console.log(chalk.blue('\nAI가 프로필을 분석하고 개선점을 제안합니다...\n'));

  const profileSummary = `
이름: ${profile.personalInfo.name}
경력: ${profile.workExperience.map(w => `${w.title} @ ${w.company}`).join(', ')}
기술: ${profile.skills.map(s => s.name).join(', ')}
프로젝트: ${profile.projects.map(p => p.name).join(', ')}
희망 직무: ${profile.preferences.targetRoles.join(', ')}
`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `다음 이력서 프로필을 분석하고 개선점을 한국어로 제안해주세요:

${profileSummary}

다음 항목에 대해 조언해주세요:
1. 프로필 강점
2. 보완이 필요한 부분
3. 추가하면 좋을 기술이나 경험
4. 이력서 작성 시 강조할 포인트`
      }
    ]
  });

  const textContent = response.content.find(c => c.type === 'text');
  if (textContent && textContent.type === 'text') {
    console.log(chalk.bold('AI 분석 결과:\n'));
    console.log(textContent.text);
    console.log();
  }
}

export async function editProfile(): Promise<void> {
  const profile = await getProfile();

  if (!profile) {
    console.log(chalk.yellow('\n프로필이 없습니다. 먼저 프로필을 생성해주세요.\n'));
    return;
  }

  const { section } = await inquirer.prompt([
    {
      type: 'list',
      name: 'section',
      message: '수정할 항목을 선택하세요:',
      choices: [
        { name: '기본 정보', value: 'personal' },
        { name: '자기 소개', value: 'summary' },
        { name: '경력 추가', value: 'addWork' },
        { name: '기술 스택', value: 'skills' },
        { name: '희망 조건', value: 'preferences' },
        { name: '취소', value: 'cancel' }
      ]
    }
  ]);

  if (section === 'cancel') return;

  if (section === 'personal') {
    const personalInfo = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: '이름:',
        default: profile.personalInfo.name
      },
      {
        type: 'input',
        name: 'email',
        message: '이메일:',
        default: profile.personalInfo.email
      },
      {
        type: 'input',
        name: 'phone',
        message: '전화번호:',
        default: profile.personalInfo.phone
      },
      {
        type: 'input',
        name: 'location',
        message: '거주 지역:',
        default: profile.personalInfo.location
      }
    ]);
    profile.personalInfo = personalInfo;
  }

  if (section === 'summary') {
    const { summary } = await inquirer.prompt([
      {
        type: 'editor',
        name: 'summary',
        message: '자기 소개:',
        default: profile.summary
      }
    ]);
    profile.summary = summary.trim();
  }

  if (section === 'skills') {
    const currentSkills = profile.skills.map(s => s.name).join(', ');
    const { skillsInput } = await inquirer.prompt([
      {
        type: 'input',
        name: 'skillsInput',
        message: '기술 스택 (쉼표로 구분):',
        default: currentSkills
      }
    ]);
    profile.skills = skillsInput
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean)
      .map((name: string) => ({
        name,
        level: 'intermediate' as const,
        category: 'Technical'
      }));
  }

  if (section === 'addWork') {
    const work = await inquirer.prompt([
      { type: 'input', name: 'company', message: '회사명:' },
      { type: 'input', name: 'title', message: '직책:' },
      { type: 'input', name: 'startDate', message: '입사일 (YYYY-MM):' },
      { type: 'confirm', name: 'current', message: '현재 재직 중입니까?' },
      {
        type: 'input',
        name: 'endDate',
        message: '퇴사일 (YYYY-MM):',
        when: (answers) => !answers.current
      },
      { type: 'input', name: 'description', message: '담당 업무:' },
      {
        type: 'input',
        name: 'achievements',
        message: '주요 성과 (쉼표로 구분):'
      },
      {
        type: 'input',
        name: 'skills',
        message: '사용 기술 (쉼표로 구분):'
      }
    ]);

    profile.workExperience.unshift({
      ...work,
      achievements: work.achievements.split(',').map((s: string) => s.trim()).filter(Boolean),
      skills: work.skills.split(',').map((s: string) => s.trim()).filter(Boolean)
    });
  }

  if (section === 'preferences') {
    const preferences = await inquirer.prompt([
      {
        type: 'input',
        name: 'targetRoles',
        message: '희망 직무 (쉼표로 구분):',
        default: profile.preferences.targetRoles.join(', ')
      },
      {
        type: 'input',
        name: 'locations',
        message: '희망 지역 (쉼표로 구분):',
        default: profile.preferences.locations.join(', ')
      },
      {
        type: 'list',
        name: 'remotePreference',
        message: '근무 형태:',
        choices: [
          { name: '재택근무', value: 'remote' },
          { name: '하이브리드', value: 'hybrid' },
          { name: '사무실 출근', value: 'onsite' },
          { name: '상관없음', value: 'any' }
        ],
        default: profile.preferences.remotePreference
      },
      {
        type: 'input',
        name: 'minSalary',
        message: '희망 최소 연봉 (만원):',
        default: profile.preferences.minSalary
          ? (profile.preferences.minSalary / 10000).toString()
          : ''
      }
    ]);

    profile.preferences = {
      ...profile.preferences,
      targetRoles: preferences.targetRoles.split(',').map((s: string) => s.trim()).filter(Boolean),
      locations: preferences.locations.split(',').map((s: string) => s.trim()).filter(Boolean),
      remotePreference: preferences.remotePreference,
      minSalary: preferences.minSalary ? parseInt(preferences.minSalary) * 10000 : undefined
    };
  }

  profile.updatedAt = getCurrentTimestamp();
  await saveProfile(profile);
  console.log(chalk.green('\n프로필이 업데이트되었습니다!\n'));
}
