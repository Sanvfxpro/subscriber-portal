export type SortType = 'open' | 'closed' | 'hybrid';

export interface Card {
  id: string;
  content: string;
  description?: string;
  sortOrder: number;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  sortOrder: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  type: SortType;
  cards: Card[];
  categories: Category[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface ResultCategory {
  category_name: string;
  suggested_name?: string;
  cards: string[];
}

export interface ParticipantResult {
  email: string;
  categories: ResultCategory[];
}

export interface ProjectResults {
  project: {
    project_id: number;
    name: string;
    type: SortType;
    cards: string[];
    categories: string[];
  };
  results: ParticipantResult[];
}

export interface UserProfile {
  id: string;
  email?: string;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
}
