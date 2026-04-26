import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, computed, HostListener, OnInit, signal } from '@angular/core';
import { ChatService } from '../../services/chatService/chat.service';
import { Chat } from '../../model/models';
import { AuthTokenService } from '../../core/auth/auth.service';

type Sender = 'agent' | 'customer';

type ChatMessage = {
  id: number;
  sender: Sender;
  text: string;
  time: string;
  read: boolean;
};

type ChatThread = {
  id: number;
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

openThread(threadId: number): void {
  this.selectThread(threadId);

  if (this.isMobile()) {
    this.mobileChatOpen = true;
  }
}

closeMobileChat(): void {
  this.mobileChatOpen = false;
}
  readonly threads = signal<ChatThread[]>([]);

  readonly selectedThreadId = signal(101);
  draftMessage = '';

  readonly selectedThread = computed(
    () => this.threads().find(thread => thread.id === this.selectedThreadId()) ?? this.threads()[0]
  );

  readonly totalUnread = computed(() =>
    this.threads().reduce((total, thread) => total + this.unreadCount(thread), 0)
  );

  constructor(private chatService: ChatService , private authservice : AuthTokenService) {
    this.markThreadAsRead(this.selectedThreadId());
  }
  ngOnInit(): void {
    const customerId = this.authservice.getUser()?.user_id.toString() ?? '';
    this.chatService.getChatsFromCustomer(customerId).subscribe({
  next: (chats) => {
    const mapped: ChatThread[] = chats.map((chat: Chat, index: number) => {
      const messages = chat.messages ?? [];
      const lastMsg = messages[messages.length - 1];
      const status: ChatThread['status'] = chat.handoff ? 'Online' : chat.is_active ? 'Nuovo' : 'In attesa';

      return {
        id: index + 1,
        customer: chat.customer_id,
        channel: 'Web Chat',
        status,
        lastMessageAt: lastMsg?.timestamp ?? '',
        messages: messages.map((msg, msgIndex) => ({
          id: msgIndex + 1,
          sender: (msg.role !== 'user' ? 'customer' : 'agent') as Sender,
          text: msg.content,
          time: msg.timestamp,
          read: true,
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

  selectThread(threadId: number) {
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
  }

  onComposerKeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter' || event.shiftKey) return;

    event.preventDefault();
    this.sendMessage();
  }

  private markThreadAsRead(threadId: number) {
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
