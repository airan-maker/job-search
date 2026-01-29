// 페르소나 타입
export interface Persona {
  id: string;
  name: string;
  description: string;
  painPoints: string[];
  goals: string[];
  channels: string[];
  messageStrategy: string;
}

// 콘텐츠 타입
export interface Content {
  id: string;
  type: ContentType;
  platform: Platform;
  title?: string;
  body: string;
  hashtags?: string[];
  cta?: string;
  targetPersona?: string;
  createdAt: string;
}

export type ContentType =
  | 'sns_post'
  | 'blog_post'
  | 'landing_copy'
  | 'email'
  | 'ad_copy';

export type Platform =
  | 'linkedin'
  | 'twitter'
  | 'blog'
  | 'product_hunt'
  | 'email'
  | 'landing_page'
  | 'search_ad'
  | 'display_ad';

// 채널 전략
export interface ChannelStrategy {
  channel: string;
  priority: 'high' | 'medium' | 'low';
  tactics: string[];
  timeline: string;
  metrics: string[];
}

// 경쟁사 분석
export interface CompetitorAnalysis {
  name: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  pricing?: string;
  positioning: string;
}

// 서비스 정보 (Job Search Agent)
export interface ProductInfo {
  name: string;
  tagline: string;
  description: string;
  keyFeatures: string[];
  uniqueValue: string;
  targetAudience: string;
}

// 생성된 콘텐츠 저장
export interface GeneratedContent {
  contents: Content[];
  personas: Persona[];
  strategies: ChannelStrategy[];
  competitors: CompetitorAnalysis[];
}
