export interface ChatMessage {
  message_id?: string;
  message_number?: number;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  token?: null;
  read: boolean;
}
 
export interface Chat {
  chat_id: string;
  company_id: string;
  handoff: boolean;
  is_active: boolean;
  channel?: string;
  messages: ChatMessage[];
}

