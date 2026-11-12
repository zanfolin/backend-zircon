export type UserType = 'ADMIN' | 'EMPRESA' | 'PROFISSIONAL';
export type UserStatus = 'ATIVO' | 'INATIVO' | 'BLOQUEADO';
export type DocumentType = 'CPF' | 'CNPJ' | 'Passaporte';

export type WorkModality = 'HOME_OFFICE' | 'HIBRIDO' | 'PRESENCIAL';
export type OpportunityStatus = 'ATIVA' | 'PAUSADA' | 'FINALIZADA' | 'CANCELADA';
export type ApplicationStatus = 'PENDENTE' | 'EM_ANALISE' | 'APROVADA' | 'REJEITADA' | 'CANCELADA';

export interface User {
  id: number;
  email: string;
  user_type: UserType;
  status: UserStatus;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  phone_number: string | null;
  document_type: DocumentType;
  document_number: string;
  verified_email: number;
  created_at: string;
  updated_at: string;
}

export interface Opportunity {
  id: number;
  user_id: number;
  company_sector: string | null;
  job_title: string;
  job_description: string | null;
  payment_value: number | null;
  benefits_text: string | null;
  work_modality: WorkModality;
  status: OpportunityStatus;
  created_at: string;
  updated_at: string;
  company_name?: string | null;
  company_email?: string | null;
  company_phone?: string | null;
}

export interface Application {
  id: number;
  user_id: number;
  vacancy_id: number;
  status: ApplicationStatus;
  expiration_date: string | null;
  created_at: string;
  updated_at: string;
  job_title?: string | null;
  company_sector?: string | null;
  work_modality?: WorkModality | null;
  payment_value?: number | null;
  opportunity_user_id?: number | null;
  company_name?: string | null;
  company_email?: string | null;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  errors?: Array<string | { message?: string }>;
}

export interface AuthSessionData {
  user: Pick<User, 'id' | 'email' | 'user_type' | 'full_name' | 'verified_email'>;
  accessToken: string;
  refreshToken: string;
}
