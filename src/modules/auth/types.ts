export interface Creator {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface AuthSession {
  user: Creator | null;
  isAuthenticated: boolean;
}
