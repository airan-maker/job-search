// User Profile Types
export interface PersonalInfo {
  name: string;
  email: string;
  phone?: string;
  location: string;
}

export interface WorkExperience {
  company: string;
  title: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description: string;
  achievements: string[];
  skills: string[];
}

export interface Education {
  school: string;
  degree: string;
  field: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  gpa?: string;
}

export interface Skill {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  category: string;
}

export interface Project {
  name: string;
  description: string;
  role: string;
  startDate: string;
  endDate?: string;
  technologies: string[];
  achievements: string[];
  url?: string;
}

export interface Certification {
  name: string;
  issuer: string;
  date: string;
  expiryDate?: string;
  credentialId?: string;
}

export interface JobPreferences {
  targetRoles: string[];
  targetIndustries: string[];
  minSalary?: number;
  maxSalary?: number;
  locations: string[];
  remotePreference: 'remote' | 'hybrid' | 'onsite' | 'any';
  companySize: ('startup' | 'mid' | 'enterprise')[];
}

export interface UserProfile {
  id: string;
  personalInfo: PersonalInfo;
  workExperience: WorkExperience[];
  education: Education[];
  skills: Skill[];
  projects: Project[];
  certifications: Certification[];
  preferences: JobPreferences;
  summary?: string;
  createdAt: string;
  updatedAt: string;
}

// Job Listing Types
export interface SalaryRange {
  min?: number;
  max?: number;
  currency: string;
  period: 'yearly' | 'monthly' | 'hourly';
}

export type JobStatus = 'new' | 'saved' | 'applied' | 'interviewing' | 'rejected' | 'offered';

export interface JobListing {
  id: string;
  source: string;
  url: string;
  company: string;
  title: string;
  description: string;
  requirements: string[];
  preferredQualifications: string[];
  salary?: SalaryRange;
  location: string;
  remote: boolean;
  postedDate?: string;
  deadline?: string;
  matchScore?: number;
  status: JobStatus;
  appliedDate?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// Interview Types
export type QuestionCategory = 'behavioral' | 'technical' | 'situational' | 'company' | 'general';

export interface InterviewQuestion {
  id: string;
  category: QuestionCategory;
  question: string;
  suggestedAnswer?: string;
  userAnswer?: string;
  feedback?: string;
}

export interface PracticeSession {
  id: string;
  jobListingId: string;
  startedAt: string;
  endedAt?: string;
  questions: InterviewQuestion[];
  overallFeedback?: string;
}

export interface CompanyInfo {
  name: string;
  industry: string;
  size?: string;
  founded?: string;
  headquarters?: string;
  description?: string;
  culture?: string;
  recentNews?: string[];
}

export interface InterviewPrep {
  jobListingId: string;
  companyResearch?: CompanyInfo;
  expectedQuestions: InterviewQuestion[];
  practiceSessions: PracticeSession[];
  createdAt: string;
  updatedAt: string;
}

// Resume Types
export interface GeneratedResume {
  id: string;
  jobListingId: string;
  content: string;
  format: 'text' | 'markdown';
  highlights: string[];
  createdAt: string;
}

// Storage Types
export interface AppData {
  profile?: UserProfile;
  jobListings: JobListing[];
  interviewPreps: InterviewPrep[];
  generatedResumes: GeneratedResume[];
}
