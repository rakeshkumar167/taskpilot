export interface User {
  id: string;
  googleId: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface AuthContext {
  user: User | null;
  loading: boolean;
  error: string | null;
}
