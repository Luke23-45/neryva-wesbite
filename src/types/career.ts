export interface CreateCareerInput {
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  phone?: string;
  coverLetter?: string;
  linkedInUrl?: string;
  portfolioUrl?: string;
}

export interface CareerResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position: string;
  resumeUrl?: string;
  coverLetter?: string;
  linkedInUrl?: string;
  portfolioUrl?: string;
  status: 'new' | 'reviewed' | 'interviewed' | 'offered' | 'rejected' | 'withdrawn';
  notes?: string;
  createdAt: string;
}
