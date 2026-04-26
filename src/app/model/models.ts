export interface ChatMessage {
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  token?: null;
}
 
export interface Chat {
  chat_id: string;
  customer_id: string;
  handoff: boolean;
  is_active: boolean;
  messages: ChatMessage[];
}

