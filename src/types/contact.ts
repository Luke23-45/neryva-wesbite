export interface CreateContactDTO {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  project: string;
  optInUpdates?: boolean;
}

export interface ContactResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  project: string;
  optInUpdates: boolean;
  status: 'new' | 'read' | 'replied' | 'archived';
  notes?: string;
  createdAt: string;
}
