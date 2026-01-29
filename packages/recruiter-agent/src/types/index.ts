// 포지션 정보
export interface Position {
  id: string;
  title: string;
  department: string;
  level: 'junior' | 'mid' | 'senior' | 'lead' | 'manager' | 'director' | 'executive';
  type: 'fulltime' | 'parttime' | 'contract' | 'intern';
  location: string;
  remote: 'onsite' | 'hybrid' | 'remote';
  salaryRange?: {
    min: number;
    max: number;
    currency: string;
  };
  requirements: string[];
  preferences: string[];
  responsibilities: string[];
  createdAt: string;
}

// JD (Job Description)
export interface JobDescription {
  id: string;
  positionId: string;
  title: string;
  content: string;
  sections: {
    intro: string;
    responsibilities: string[];
    requirements: string[];
    preferred: string[];
    benefits: string[];
    aboutCompany: string;
  };
  keywords: string[];
  createdAt: string;
}

// 후보자 페르소나
export interface CandidatePersona {
  id: string;
  positionId: string;
  name: string;
  background: string;
  skills: string[];
  motivations: string[];
  channels: string[];
  messagingStrategy: string;
}

// 면접 질문
export interface InterviewQuestion {
  id: string;
  positionId: string;
  category: 'behavioral' | 'technical' | 'situational' | 'culture_fit';
  question: string;
  followUps: string[];
  evaluationCriteria: string[];
  idealAnswer?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

// 면접 가이드
export interface InterviewGuide {
  positionId: string;
  stages: InterviewStage[];
  overallCriteria: string[];
  redFlags: string[];
  greenFlags: string[];
}

export interface InterviewStage {
  name: string;
  duration: number;
  interviewer: string;
  focus: string[];
  questions: InterviewQuestion[];
}

// 후보자 평가
export interface CandidateEvaluation {
  candidateName: string;
  positionId: string;
  scores: {
    category: string;
    score: number;
    maxScore: number;
    notes: string;
  }[];
  overallScore: number;
  recommendation: 'strong_hire' | 'hire' | 'maybe' | 'no_hire' | 'strong_no_hire';
  strengths: string[];
  concerns: string[];
  nextSteps: string;
}

// 회사 정보
export interface CompanyInfo {
  name: string;
  industry: string;
  size: string;
  stage: 'startup' | 'growth' | 'enterprise';
  culture: string[];
  benefits: string[];
  techStack?: string[];
  mission?: string;
  values?: string[];
}

// 소싱 전략
export interface SourcingStrategy {
  positionId: string;
  channels: {
    name: string;
    priority: 'high' | 'medium' | 'low';
    tactics: string[];
    budget?: number;
  }[];
  outreachTemplates: {
    channel: string;
    subject?: string;
    message: string;
  }[];
  referralProgram?: {
    bonus: number;
    rules: string[];
  };
}
