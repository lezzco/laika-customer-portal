export type Sender = 'agent' | 'customer';

export type ChatMessage = {
  id: number;
  sender: Sender;
  text: string;
  time: string;
  read: boolean;
};

export type ChatThread = {
  id: number;
  customer: string;
  channel: 'WhatsApp' | 'Instagram' | 'Web Chat' | 'Messenger';
  status: 'Online' | 'In attesa' | 'Nuovo';
  lastMessageAt: string;
  messages: ChatMessage[];
};

export type ChatSocketEvent =
  | { type: 'thread.snapshot'; payload: ChatThread[] }
  | { type: 'thread.message'; payload: { threadId: number; message: ChatMessage } }
  | { type: 'thread.read'; payload: { threadId: number } }
  | { type: 'thread.updated'; payload: ChatThread };
