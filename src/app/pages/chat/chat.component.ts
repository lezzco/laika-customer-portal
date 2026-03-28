import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, computed, HostListener, signal } from '@angular/core';

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
export class ChatComponent {
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

@HostListener('document:click')
closeEmojiPicker() {
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
  readonly threads = signal<ChatThread[]>([
    {
      id: 101,
      customer: 'Vincenzo Pafundi',
      channel: 'WhatsApp',
      status: 'Online',
      lastMessageAt: '10:42',
      messages: [
        { id: 1, sender: 'customer', text: 'Ciao, vorrei sapere dove si trova il mio ordine.', time: '10:31', read: true },
        { id: 2, sender: 'agent', text: 'Controllo subito. Mi confermi il numero ordine?', time: '10:33', read: true },
        { id: 3, sender: 'customer', text: 'ORD-24519', time: '10:34', read: true },
        { id: 4, sender: 'agent', text: 'Perfetto, risulta in consegna per oggi.', time: '10:36', read: true },
        { id: 5, sender: 'customer', text: 'Ottimo, grazie.', time: '10:42', read: false },
      ],
    },
    {
      id: 102,
      customer: 'Marco Bianchi',
      channel: 'Web Chat',
      status: 'Nuovo',
      lastMessageAt: '10:18',
      messages: [
        { id: 1, sender: 'customer', text: 'Non riesco ad accedere al mio account.', time: '10:16', read: false },
        { id: 2, sender: 'customer', text: 'Potete aiutarmi?', time: '10:18', read: false },
      ],
    },
    {
      id: 103,
      customer: 'Sara Verdi',
      channel: 'Instagram',
      status: 'In attesa',
      lastMessageAt: '09:54',
      messages: [
        { id: 1, sender: 'customer', text: 'Vorrei fare un reso.', time: '09:40', read: true },
        { id: 2, sender: 'agent', text: 'Certo, ti invio la procedura.', time: '09:43', read: true },
        { id: 3, sender: 'customer', text: 'Grazie, resto in attesa.', time: '09:54', read: false },
      ],
    },
    {
      id: 104,
      customer: 'Luca Neri',
      channel: 'Messenger',
      status: 'Online',
      lastMessageAt: 'Ieri',
      messages: [
        { id: 1, sender: 'customer', text: 'Avete disponibilita della taglia M?', time: '18:21', read: true },
        { id: 2, sender: 'agent', text: 'Si, e disponibile in magazzino.', time: '18:26', read: true },
      ],
    },
  ]);

  readonly selectedThreadId = signal(101);
  draftMessage = '';

  readonly selectedThread = computed(
    () => this.threads().find(thread => thread.id === this.selectedThreadId()) ?? this.threads()[0]
  );

  readonly totalUnread = computed(() =>
    this.threads().reduce((total, thread) => total + this.unreadCount(thread), 0)
  );

  constructor() {
    this.markThreadAsRead(this.selectedThreadId());
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
