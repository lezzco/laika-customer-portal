export type NewMessageSocketEvent = {
  type: 'new_message';
  company_id: string;
  chat_id: string;
  message_id: string;
  message_content: string;
  message_role?: 'user' | 'assistant' | 'operator';
};

export type HandoffSocketEvent = {
  type: 'handoff';
  company_id: string;
  chat_id: string;
  handoff: true;
  triggered_by?: string;
};

export type ChatSocketEvent =
  | NewMessageSocketEvent
  | HandoffSocketEvent
  | { type: 'connect_ack'; connection_id: string }
  | { type: 'thread.snapshot'; payload: ChatThread[] }
  | { type: 'thread.message'; payload: { threadId: number; message: ChatMessage } }
  | { type: 'thread.read'; payload: { threadId: number } }
  | { type: 'thread.updated'; payload: ChatThread };

export type Sender = 'agent' | 'customer';

export type ChatMessage = {
  id: string;
  sender: Sender;
  text: string;
  time: string;
  read: boolean;
};

export type ChatThread = {
  id: string;
  customer: string;
  channel: 'WhatsApp' | 'Instagram' | 'Web Chat' | 'Messenger';
  status: 'Online' | 'In attesa' | 'Nuovo';
  lastMessageAt: string;
  messages: ChatMessage[];
};
