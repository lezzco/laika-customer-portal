import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, computed, DestroyRef, ElementRef, HostListener, inject, OnInit, signal, ViewChild } from '@angular/core';
import { ChatService } from '../../services/chatService/chat.service';
import { Chat } from '../../model/models';
import { AuthTokenService } from '../../core/auth/auth.service';
import { HumanResponseRequest } from '../../model/requestModel';
import { WebsocketService } from '../../services/websocket/weksocket.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChatSocketEvent, HandoffSocketEvent, NewMessageSocketEvent } from '../../model/websocketModel';

type Sender = 'agent' | 'customer';

type ChatMessage = {
  id: string;
  sender: Sender;
  text: string;
  timestamp: string;
  read: boolean;
};

type MessageTimelineItem =
  | { kind: 'divider'; label: string; key: string }
  | { kind: 'message'; message: ChatMessage; key: string };

type ChatThread = {
  id: string;
  customer: string;
  channel: 'WhatsApp' | 'Instagram' | 'Web Chat' | 'Messenger';
  status: 'Online' | 'In attesa' | 'Nuovo';
  lastMessageAt: string;
  messages: ChatMessage[];
};

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent implements OnInit {
  @ViewChild('messageList') private messageListRef?: ElementRef<HTMLDivElement>;

  mobileChatOpen = false;
// ── Emoji picker ──
  private readonly destroyRef = inject(DestroyRef);

  private readonly chatSocket = inject(WebsocketService);
  public readonly  user = inject(AuthTokenService).getUser();

emojiPickerOpen = false;
activeEmojiCategory = 'Smiley';

readonly emojiCategories = [
  { label: 'Smiley', icon: '😊', emojis: ['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🥸','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓'] },
  { label: 'Gesti', icon: '👍', emojis: ['👍','👎','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👋','🤚','🖐️','✋','🖖','💪','🦾','🙏','👏','🤝','🫶','❤️‍🔥','🫰','🫵','🤜','🤛','✊','👊','🤚','🙌','👐','🫙','🤲','🫱','🫲'] },
  { label: 'Persone', icon: '👨', emojis: ['👶','🧒','👦','👧','🧑','👱','👨','🧔','👩','🧓','👴','👵','🧕','👲','👳','🦸','🦹','🧙','🧚','🧛','🧜','🧝','🧞','🧟','💆','💇','🚶','🧍','🧎','🏃','💃','🕺','👯','🧖','🧗','🏋️','🤸','🏊','🚴'] },
  { label: 'Natura', icon: '🌿', emojis: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐻‍❄️','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐔','🐧','🐦','🦆','🦅','🦉','🦇','🐺','🐗','🌸','🌹','🌺','🌻','🌼','🌷','🍀','🌿','🍃','🌲','🌳','🌴','🌵','🎋'] },
  { label: 'Cibo', icon: '🍕', emojis: ['🍕','🍔','🌭','🍟','🌮','🌯','🫔','🥙','🧆','🥚','🍳','🧇','🥞','🧈','🍞','🥐','🥖','🫓','🥨','🥯','🧀','🥗','🥘','🫕','🍲','🍜','🍝','🍛','🍣','🍱','🍤','🍙','🍚','🍘','🍥','🥮','🍡','🧁','🎂','🍰','🍫','🍬','🍭','☕','🍵','🧃','🥤','🍺','🍷'] },
  { label: 'Viaggi', icon: '✈️', emojis: ['🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','🚐','🛻','🚚','🚛','🚜','🛵','🏍️','🚲','🛴','✈️','🚀','🛸','🚁','🛶','⛵','🚢','🚂','🚆','🚇','🚊','🏔️','⛰️','🌋','🗺️','🏕️','🏖️','🏜️','🏝️','🌅','🌆','🌇','🌉','🗼','🗽','🏰','🏯'] },
  { label: 'Simboli', icon: '❤️', emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','❤️‍🔥','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☯️','🕉️','✡️','🔯','☪️','🛐','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓','⛎','🔀','🔁','🔂','▶️','⏸️','⏹️','🎵','🎶','💯','✅','❌','⭐','🌟','💫','⚡','🔥','🌈'] },
];

searchQuery = signal('');

  readonly filteredThreads = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.threads();

    return this.threads()
      .filter(thread => {
        const nameMatch = thread.customer.toLowerCase().includes(query);
        const messageMatch = thread.messages.some(msg =>
          msg.text.toLowerCase().includes(query)
        );
        return nameMatch || messageMatch;
      })
      .sort((a, b) => {
        const aNameMatch = a.customer.toLowerCase().includes(query);
        const bNameMatch = b.customer.toLowerCase().includes(query);
        const namePriority = (bNameMatch ? 1 : 0) - (aNameMatch ? 1 : 0);
        if (namePriority !== 0) return namePriority;
        return this.compareThreadsByLastMessage(b, a);
      });
  });

activeEmojis(): string[] {
  return this.emojiCategories.find(c => c.label === this.activeEmojiCategory)?.emojis ?? [];
}

toggleEmojiPicker() {
  this.emojiPickerOpen = !this.emojiPickerOpen;
}

insertEmoji(emoji: string) {
  this.draftMessage += emoji;
  this.emojiPickerOpen = false;
}

@HostListener('document:click',['$event'])
closeEmojiPicker(event: MouseEvent) {
   const target = event.target as HTMLElement;
  
  // Non chiudere se clicki dentro il picker o sul bottone emoji
  if (target.closest('.emoji-picker') || target.closest('[aria-label="Emoji"]')) {
    return;
  }
  
  this.emojiPickerOpen = false;
}
isMobile(): boolean {
  return window.innerWidth <= 960;
}

openThread(threadId: string): void {
  this.selectedThreadId.set(threadId);
  this.syncReadStatus(threadId);

  this.chatService.getChatById(threadId).subscribe({
    next: chat => {
      const c = this.mapChatToThread(chat);
      this.threads.update(threads =>
        this.sortThreadsByLastMessage(threads.map(t => t.id === threadId ? c : t))
      );
    },
  });

  if (this.isMobile()) {
    this.mobileChatOpen = true;
  }
}

closeMobileChat(): void {
  this.mobileChatOpen = false;
}
  readonly threads = signal<ChatThread[]>([]);

  readonly selectedThreadId = signal('');
  draftMessage = '';

  readonly selectedThread = computed(
    () => this.threads().find(thread => thread.id === this.selectedThreadId()) ?? this.threads()[0]
  );

  readonly totalUnread = computed(() =>
    this.threads().reduce((total, thread) => total + this.unreadCount(thread), 0)
  );

  constructor(private chatService: ChatService , private authservice : AuthTokenService) {
    this.destroyRef.onDestroy(() => this.chatSocket.disconnect());
    this.subscribeToSocket();

  }

  private subscribeToSocket() {
    this.chatSocket.connect();
    this.chatSocket.events$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => {
        this.applySocketEvent(event);
      });
  }

  private applySocketEvent(event: ChatSocketEvent) {
    if (event.type === 'new_message') {
      this.handleNewMessage(event);
    } else if (event.type === 'handoff') {
      this.handleHandoff(event);
    }
  }

  private handleHandoff(event: HandoffSocketEvent) {
    if (event.company_id !== this.user?.company_id) return;

    const chatId = event.chat_id;
    const existing = this.threads().find(t => t.id === chatId);
    if (existing) {
      this.threads.update(threads =>
        threads.map(thread =>
          thread.id === chatId ? { ...thread, status: 'Online' as const } : thread
        )
      );
      return;
    }

    this.chatService.getChatById(chatId).subscribe({
      next: chat => this.upsertThreadFromChat(chat),
      error: err => console.error('Chat non trovata dopo handoff:', err),
    });
  }

  private handleNewMessage(event: NewMessageSocketEvent) {
    if (event.company_id !== this.user?.company_id) return;

    const chatId = event.chat_id;
    const timestamp = this.nowTimestamp();
    const isSelected = this.selectedThreadId() === chatId;

    const existing = this.threads().find(t => t.id === chatId);
    if (!existing) {
      this.chatService.getChatById(chatId).subscribe({
        next: chat => this.upsertThreadFromChat(chat),
        error: err => console.error('Chat non trovata dopo new_message:', err),
      });
      return;
    }

    const alreadyPresent = existing.messages.some(m => m.id === event.message_id);
    if (alreadyPresent) return;

    const role = event.message_role ?? 'user';
    const sender: Sender =
      role === 'user' ? 'customer' : 'agent';

    const incoming: ChatMessage = {
      id: event.message_id,
      sender,
      text: event.message_content,
      timestamp,
      read: isSelected,
    };

    this.threads.update(threads =>
      this.sortThreadsByLastMessage(
        threads.map(thread => {
          if (thread.id !== chatId) return thread;

          return {
            ...thread,
            lastMessageAt: timestamp,
            messages: [...thread.messages, incoming],
          };
        })
      )
    );

    if (isSelected) {
      this.syncReadStatus(chatId);
    }
  }

  private upsertThreadFromChat(chat: Chat) {
    const thread = this.mapChatToThread(chat);
    this.threads.update(threads => {
      const idx = threads.findIndex(t => t.id === thread.id);
      const next = idx === -1
        ? [thread, ...threads]
        : threads.map((t, i) => (i === idx ? thread : t));
      return this.sortThreadsByLastMessage(next);
    });
  }

  private mapChatToThread(chat: Chat): ChatThread {
    const messages = chat.messages ?? [];
    const lastMsg = messages[messages.length - 1];

    return {
      id: chat.chat_id,
      customer: chat.company_id,
      channel: 'Web Chat',
      status: chat.handoff ? 'Online' : chat.is_active ? 'Nuovo' : 'In attesa',
      lastMessageAt: lastMsg?.timestamp ?? '',
      messages: messages.map((msg, msgIndex) => ({
        id: msg.message_id ?? String(msg.message_number ?? msgIndex + 1),
        sender: (msg.role == 'user' ? 'customer' : 'agent') as Sender,
        text: msg.content,
        timestamp: msg.timestamp,
        read: msg.read,
      })),
    };
  }
  ngOnInit(): void {
    const customerId = this.authservice.getUser()?.user_id.toString() ?? '';
    this.chatService.getActiveChatSorted().subscribe({
  next: (chats) => {
    const mapped: ChatThread[] = chats.map((chat: Chat) => this.mapChatToThread(chat));

    this.threads.set(this.sortThreadsByLastMessage(mapped));
    if (mapped.length > 0) this.selectedThreadId.set(mapped[0].id);
  },
  error: (err) => {
    console.error('Failed to load chats:', err);
    this.threads.set([]);
  }
});
  }

  unreadCount(thread: ChatThread) {
    return thread.messages.filter(message => message.sender === 'customer' && !message.read).length;
  }

  lastMessage(thread: ChatThread) {
    return thread.messages[thread.messages.length - 1]?.text ?? '';
  }

  sendMessage() {
  const text = this.draftMessage.trim();
  if (!text) return;

  const selectedId = this.selectedThreadId();

  this.chatService.sendHumanResponse(
    new HumanResponseRequest(
      this.selectedThread()?.id ?? '',
      text     
    )
  ).subscribe({
    next: (response) => {
      console.log('Message sent successfully:', response);

      this.threads.update(threads =>
        this.sortThreadsByLastMessage(
          threads.map(thread => {
            if (thread.id !== selectedId) return thread;

            const nextMessage: ChatMessage = {
              id: thread.messages.length + 1,
              sender: 'agent',
              text,
              timestamp: this.nowTimestamp(),
              read: true,
            };

            return {
              ...thread,
              lastMessageAt: nextMessage.timestamp,
              messages: [...thread.messages, nextMessage],
            };
          })
        )
      );

      this.draftMessage = '';
      this.scrollMessagesToEnd();
    },
    error: (err) => {
      console.error('Errore invio messaggio:', err);
    }
  });
}

  onComposerKeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter' || event.shiftKey) return;

    event.preventDefault();
    this.sendMessage();
  }

  private syncReadStatus(threadId: string) {
    this.chatService.markChatAsRead(threadId).subscribe({
      next: () => this.markThreadAsReadLocally(threadId),
      error: err => console.error('Errore aggiornamento read-status:', err),
    });
  }

  private markThreadAsReadLocally(threadId: string) {
    this.threads.update(threads =>
      threads.map(thread => {
        if (thread.id !== threadId) return thread;

        return {
          ...thread,
          messages: thread.messages.map(message =>
            message.sender === 'customer' ? { ...message, read: true } : message
          ),
        };
      })
    );
  }

  getMessageTimeline(messages: ChatMessage[]): MessageTimelineItem[] {
    const items: MessageTimelineItem[] = [];
    let lastDayKey = '';

    for (const message of messages) {
      const date = this.parseTimestamp(message.timestamp);
      const dayKey = date ? this.dayKey(date) : message.timestamp;

      if (dayKey !== lastDayKey) {
        items.push({
          kind: 'divider',
          label: this.formatWhatsAppDate(message.timestamp),
          key: `divider-${dayKey}`,
        });
        lastDayKey = dayKey;
      }

      items.push({
        kind: 'message',
        message,
        key: `msg-${message.id}`,
      });
    }

    return items;
  }

  formatMessageTime(timestamp: string): string {
    const date = this.parseTimestamp(timestamp);
    if (!date) return timestamp;

    return new Intl.DateTimeFormat('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  formatThreadListTime(timestamp: string): string {
    const date = this.parseTimestamp(timestamp);
    if (!date) return timestamp;

    const today = this.startOfDay(new Date());
    const messageDay = this.startOfDay(date);

    if (messageDay.getTime() === today.getTime()) {
      return this.formatMessageTime(timestamp);
    }

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (messageDay.getTime() === yesterday.getTime()) {
      return 'Ieri';
    }

    const weekStart = new Date(today);
    const day = weekStart.getDay();
    const diff = day === 0 ? 6 : day - 1;
    weekStart.setDate(weekStart.getDate() - diff);

    if (messageDay >= weekStart) {
      return new Intl.DateTimeFormat('it-IT', { weekday: 'short' }).format(date);
    }

    return new Intl.DateTimeFormat('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    }).format(date);
  }

  private formatWhatsAppDate(timestamp: string): string {
    const date = this.parseTimestamp(timestamp);
    if (!date) return timestamp;

    const today = this.startOfDay(new Date());
    const messageDay = this.startOfDay(date);

    if (messageDay.getTime() === today.getTime()) {
      return 'Oggi';
    }

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (messageDay.getTime() === yesterday.getTime()) {
      return 'Ieri';
    }

    const weekStart = new Date(today);
    const day = weekStart.getDay();
    const diff = day === 0 ? 6 : day - 1;
    weekStart.setDate(weekStart.getDate() - diff);

    if (messageDay >= weekStart) {
      const weekday = new Intl.DateTimeFormat('it-IT', { weekday: 'long' }).format(date);
      return weekday.charAt(0).toUpperCase() + weekday.slice(1);
    }

    return new Intl.DateTimeFormat('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  }

  private scrollMessagesToEnd(): void {
    setTimeout(() => {
      const el = this.messageListRef?.nativeElement;
      if (!el) return;
      el.scrollTop = el.scrollHeight;
    });
  }

  private sortThreadsByLastMessage(threads: ChatThread[]): ChatThread[] {
    return [...threads].sort((a, b) => this.compareThreadsByLastMessage(a, b));
  }

  private compareThreadsByLastMessage(a: ChatThread, b: ChatThread): number {
    const aTime = this.parseTimestamp(a.lastMessageAt)?.getTime() ?? 0;
    const bTime = this.parseTimestamp(b.lastMessageAt)?.getTime() ?? 0;
    return bTime - aTime;
  }

  private nowTimestamp(): string {
    return new Date().toISOString();
  }

  private parseTimestamp(value: string): Date | null {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private startOfDay(date: Date): Date {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy;
  }

  private dayKey(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  }

  onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;

  const selectedId = this.selectedThreadId();

  Array.from(input.files).forEach(file => {
    this.threads.update(threads =>
      this.sortThreadsByLastMessage(
        threads.map(thread => {
          if (thread.id !== selectedId) return thread;

          const nextMessage: ChatMessage = {
            id: thread.messages.length + 1,
            sender: 'agent',
            text: `📎 ${file.name}`,
            timestamp: this.nowTimestamp(),
            read: true,
          };

          return {
            ...thread,
            lastMessageAt: nextMessage.timestamp,
            messages: [...thread.messages, nextMessage],
          };
        })
      )
    );
  });

  input.value = '';
}
}
