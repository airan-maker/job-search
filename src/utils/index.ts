import crypto from 'crypto';

export function generateId(): string {
  return crypto.randomUUID();
}

export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

export function extractKeywords(text: string): string[] {
  // Common tech keywords and skill patterns
  const patterns = [
    /\b(javascript|typescript|python|java|go|rust|c\+\+|ruby|php|swift|kotlin)\b/gi,
    /\b(react|vue|angular|svelte|next\.?js|nuxt|node\.?js|express|fastapi|django|flask|spring)\b/gi,
    /\b(aws|gcp|azure|docker|kubernetes|terraform|jenkins|github actions|ci\/cd)\b/gi,
    /\b(sql|nosql|postgresql|mysql|mongodb|redis|elasticsearch)\b/gi,
    /\b(rest|graphql|grpc|api|microservices)\b/gi,
    /\b(agile|scrum|kanban|jira|confluence)\b/gi,
    /\b(\d+\+?\s*years?)\b/gi
  ];

  const keywords = new Set<string>();
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(m => keywords.add(m.toLowerCase()));
    }
  }

  return Array.from(keywords);
}

export function calculateMatchScore(
  userSkills: string[],
  jobRequirements: string[]
): number {
  if (jobRequirements.length === 0) return 0;

  const normalizedUserSkills = userSkills.map(s => s.toLowerCase());
  const normalizedRequirements = jobRequirements.map(r => r.toLowerCase());

  let matches = 0;
  for (const req of normalizedRequirements) {
    if (normalizedUserSkills.some(skill =>
      req.includes(skill) || skill.includes(req)
    )) {
      matches++;
    }
  }

  return Math.round((matches / normalizedRequirements.length) * 100);
}
