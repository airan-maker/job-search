import fs from 'fs/promises';
import path from 'path';
import type { ProductInfo } from '../types/index.js';

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

// Job Search Agent 제품 정보
export const productInfo: ProductInfo = {
  name: 'Job Search Agent',
  tagline: '내 정보는 비공개, 채용 공고는 AI가 찾아준다',
  description: '프라이버시를 지키면서 이직을 준비할 수 있는 AI 에이전트. 링크드인에 이력을 공개하지 않아도 AI가 맞춤 채용 공고를 찾아주고, 이력서 작성부터 면접 준비까지 도와줍니다.',
  keyFeatures: [
    '프라이버시 보호: 모든 데이터는 로컬에 저장',
    'AI 채용 공고 탐색: 프로필 기반 맞춤 공고 자동 검색',
    '맞춤 이력서 생성: JD 분석 후 최적화된 이력서 생성',
    '면접 코칭: 실시간 피드백 모의 면접',
    '전략 분석: 합격률 예측, 연봉 협상 가이드'
  ],
  uniqueValue: '링크드인에 이력 공개 없이 조용히 이직 준비',
  targetAudience: '현직자 중 이직을 고민하는 개발자, 기획자, 디자이너'
};

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

// 마크다운 형식으로 변환
export function formatAsMarkdown(title: string, content: string): string {
  return `# ${title}\n\n${content}\n\n---\n생성일: ${getCurrentTimestamp()}`;
}
