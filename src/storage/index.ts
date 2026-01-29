import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import type {
  AppData,
  UserProfile,
  JobListing,
  InterviewPrep,
  GeneratedResume
} from '../types/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'app-data.json');

async function ensureDataDir(): Promise<void> {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

async function loadData(): Promise<AppData> {
  await ensureDataDir();
  try {
    const content = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {
      profile: undefined,
      jobListings: [],
      interviewPreps: [],
      generatedResumes: []
    };
  }
}

async function saveData(data: AppData): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// Profile operations
export async function getProfile(): Promise<UserProfile | undefined> {
  const data = await loadData();
  return data.profile;
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  const data = await loadData();
  data.profile = profile;
  await saveData(data);
}

// Job Listing operations
export async function getJobListings(): Promise<JobListing[]> {
  const data = await loadData();
  return data.jobListings;
}

export async function getJobListing(id: string): Promise<JobListing | undefined> {
  const data = await loadData();
  return data.jobListings.find(j => j.id === id);
}

export async function saveJobListing(job: JobListing): Promise<void> {
  const data = await loadData();
  const existingIndex = data.jobListings.findIndex(j => j.id === job.id);
  if (existingIndex >= 0) {
    data.jobListings[existingIndex] = job;
  } else {
    data.jobListings.push(job);
  }
  await saveData(data);
}

export async function deleteJobListing(id: string): Promise<void> {
  const data = await loadData();
  data.jobListings = data.jobListings.filter(j => j.id !== id);
  await saveData(data);
}

export async function updateJobListing(id: string, updates: Partial<JobListing>): Promise<void> {
  const data = await loadData();
  const index = data.jobListings.findIndex(j => j.id === id);
  if (index >= 0) {
    data.jobListings[index] = { ...data.jobListings[index], ...updates };
    await saveData(data);
  }
}

// Interview Prep operations
export async function getInterviewPrep(jobListingId: string): Promise<InterviewPrep | undefined> {
  const data = await loadData();
  return data.interviewPreps.find(p => p.jobListingId === jobListingId);
}

export async function saveInterviewPrep(prep: InterviewPrep): Promise<void> {
  const data = await loadData();
  const existingIndex = data.interviewPreps.findIndex(p => p.jobListingId === prep.jobListingId);
  if (existingIndex >= 0) {
    data.interviewPreps[existingIndex] = prep;
  } else {
    data.interviewPreps.push(prep);
  }
  await saveData(data);
}

// Generated Resume operations
export async function getGeneratedResumes(jobListingId: string): Promise<GeneratedResume[]> {
  const data = await loadData();
  return data.generatedResumes.filter(r => r.jobListingId === jobListingId);
}

export async function saveGeneratedResume(resume: GeneratedResume): Promise<void> {
  const data = await loadData();
  data.generatedResumes.push(resume);
  await saveData(data);
}

export async function getAllData(): Promise<AppData> {
  return loadData();
}
