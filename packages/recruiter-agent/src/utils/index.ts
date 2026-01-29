import fs from 'fs/promises';
import path from 'path';
import type { CompanyInfo } from '../types/index.js';

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

// 기본 회사 정보 (사용자가 설정 가능)
export let companyInfo: CompanyInfo = {
  name: '우리 회사',
  industry: 'IT/소프트웨어',
  size: '50-200명',
  stage: 'growth',
  culture: ['자율과 책임', '빠른 실행', '투명한 소통'],
  benefits: ['스톡옵션', '유연근무', '교육비 지원', '점심 제공'],
  techStack: ['TypeScript', 'React', 'Node.js', 'AWS'],
  mission: '기술로 더 나은 세상을 만듭니다',
  values: ['고객 중심', '지속적 성장', '협업']
};

export function setCompanyInfo(info: Partial<CompanyInfo>): void {
  companyInfo = { ...companyInfo, ...info };
}

// output 폴더에 콘텐츠 저장
export async function saveContent(filename: string, content: string): Promise<string> {
  const outputDir = path.join(process.cwd(), 'output');

  try {
    await fs.mkdir(outputDir, { recursive: true });
  } catch {
    // 폴더가 이미 존재하면 무시
  }

  const filepath = path.join(outputDir, filename);
  await fs.writeFile(filepath, content, 'utf-8');
  return filepath;
}

// 레벨 한글 변환
export function getLevelKorean(level: string): string {
  const levelMap: Record<string, string> = {
    junior: '주니어 (1-3년)',
    mid: '미드레벨 (4-7년)',
    senior: '시니어 (8년+)',
    lead: '리드/팀장',
    manager: '매니저',
    director: '디렉터',
    executive: '임원'
  };
  return levelMap[level] || level;
}

// 근무 형태 한글 변환
export function getRemoteKorean(remote: string): string {
  const remoteMap: Record<string, string> = {
    onsite: '사무실 출근',
    hybrid: '하이브리드',
    remote: '완전 원격'
  };
  return remoteMap[remote] || remote;
}
