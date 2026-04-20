 export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface User{
    user_id: string;
    email: string;
    full_name: string;
    is_active: boolean;
    created_at: string;
}