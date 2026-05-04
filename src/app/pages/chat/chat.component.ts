import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, computed, DestroyRef, HostListener, inject, OnInit, signal } from '@angular/core';
import { ChatService } from '../../services/chatService/chat.service';
import { Chat } from '../../model/models';
import { AuthTokenService } from '../../core/auth/auth.service';
import { SendMessageRequest } from '../../model/requestModel';
import { WeksocketService } from '../../services/websocket/weksocket.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChatSocketEvent } from '../../model/websocketModel';

type Sender = 'agent' | 'customer';

type ChatMessage = {
  id: number;
  sender: Sender;
  text: string;
  time: string;
  read: boolean;
};

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
  mobileChatOpen = false;
// ── Emoji picker ──
  private readonly destroyRef = inject(DestroyRef);

  private readonly chatSocket = inject(WeksocketService);
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
        // Threads con match nel nome vengono prima
        const aNameMatch = a.customer.toLowerCase().includes(query);
        const bNameMatch = b.customer.toLowerCase().includes(query);
        return (bNameMatch ? 1 : 0) - (aNameMatch ? 1 : 0);
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
  this.selectThread(threadId);
  this.chatService.setMessageRead(threadId).subscribe({
    next: () => {
      this.chatService.getChatById(threadId).subscribe({
        next: (chat) => {
          const c: ChatThread = {
            id: chat.chat_id,
            customer: chat.company_id,
            channel: 'Web Chat',
            status: chat.handoff ? 'Online' : chat.is_active ? 'Nuovo' : 'In attesa',
            messages: chat.messages?.map((msg, msgIndex) => ({
              id: msgIndex + 1,
              sender: (msg.role !== 'user' ? 'customer' : 'agent') as Sender,
              text: msg.content,
              time: msg.timestamp,
              read: msg.read,
            })) ?? [],
            lastMessageAt: chat.messages?.[chat.messages.length - 1]?.timestamp ?? '',
          };
          this.threads.update(threads =>
            threads.map(t => t.id === threadId ? c : t)
          );
        }
      });
    }
  });
  if (this.isMobile()) {
    this.mobileChatOpen = true;
  }

}

closeMobileChat(): void {
  this.mobileChatOpen = false;
}
  readonly threads = signal<ChatThread[]>([]);

  readonly selectedThreadId = signal("101");
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

    this.markThreadAsRead(this.selectedThreadId());
  }

  private subscribeToSocket() {
    this.chatSocket.connect();
    this.chatSocket.events$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => {
        this.applySocketEvent(event);
      });
  }

  private applySocketEvent(event: any) {
    
    console.log('Received socket event:', event);
  }
  ngOnInit(): void {
    const customerId = this.authservice.getUser()?.user_id.toString() ?? '';
    this.chatService.getActiveChatSorted().subscribe({
  next: (chats) => {
    const mapped: ChatThread[] = chats.map((chat: Chat, index: number) => {
      const messages = chat.messages ?? [];
      const lastMsg = messages[messages.length - 1];
      const status: ChatThread['status'] = chat.handoff ? 'Online' : chat.is_active ? 'Nuovo' : 'In attesa';

      return {
        id: chat.chat_id,
        customer: chat.company_id,
        channel: 'Web Chat',
        status,
        lastMessageAt: lastMsg?.timestamp ?? '',
        messages: messages.map((msg, msgIndex) => ({
          id: msgIndex + 1,
          sender: (msg.role !== 'user' ? 'customer' : 'agent') as Sender,
          text: msg.content,
          time: msg.timestamp,
          read: msg.read
          
          ,
        })),
      };
    });

    this.threads.set(mapped);
    if (mapped.length > 0) this.selectedThreadId.set(mapped[0].id);
  },
  error: (err) => {
    console.error('Failed to load chats:', err);
    this.threads.set([]);
  }
});
  }

  selectThread(threadId: string) {
    this.selectedThreadId.set(threadId);
    this.markThreadAsRead(threadId);
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

  this.chatService.sendMessages(new SendMessageRequest(this.selectedThread()?.id.toString() ?? '', text)).subscribe({
    next: (response) => {
      console.log('Message sent successfully:', response);

      this.threads.update(threads =>
        threads.map(thread => {
          if (thread.id !== selectedId) return thread;

          const nextMessage: ChatMessage = {
            id: thread.messages.length + 1,
            sender: 'agent',
            text,
            time: this.formatNow(),
            read: true,
          };

          return {
            ...thread,
            lastMessageAt: nextMessage.time,
            messages: [...thread.messages, nextMessage],
          };
        })
      );

      this.draftMessage = '';
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

  private markThreadAsRead(threadId: string) {
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

  private formatNow() {
    return new Intl.DateTimeFormat('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date());
  }

  onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;

  const selectedId = this.selectedThreadId();

  Array.from(input.files).forEach(file => {
    this.threads.update(threads =>
      threads.map(thread => {
        if (thread.id !== selectedId) return thread;

        const nextMessage: ChatMessage = {
          id: thread.messages.length + 1,
          sender: 'agent',
          text: `📎 ${file.name}`,
          time: this.formatNow(),
          read: true,
        };

        return {
          ...thread,
          lastMessageAt: nextMessage.time,
          messages: [...thread.messages, nextMessage],
        };
      })
    );
  });

  input.value = '';
}
}
