import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ChatApiService } from '../../core/chat/chat-api.service';
import { ChatMessage, ChatSocketEvent, ChatThread } from '../../core/chat/chat.models';
import { ChatSocketService } from '../../core/chat/chat-socket.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly chatApi = inject(ChatApiService);
  private readonly chatSocket = inject(ChatSocketService);

  readonly threads = signal<ChatThread[]>([]);
  readonly selectedThreadId = signal<number | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  draftMessage = '';

  readonly selectedThread = computed(
    () => this.threads().find(thread => thread.id === this.selectedThreadId()) ?? this.threads()[0] ?? null
  );

  readonly totalUnread = computed(() =>
    this.threads().reduce((total, thread) => total + this.unreadCount(thread), 0)
  );

  constructor() {
    this.destroyRef.onDestroy(() => this.chatSocket.disconnect());
    this.loadThreads();
    this.subscribeToSocket();
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
    const selectedThread = this.selectedThread();
    if (!text || !selectedThread) return;

    this.chatApi
      .sendMessage(selectedThread.id, text)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: message => {
          this.upsertThreadMessage(selectedThread.id, { ...message, read: true, sender: 'agent' });
          this.draftMessage = '';
        },
        error: err => {
          this.error.set(this.getErrorMessage(err, 'Invio messaggio fallito'));
        },
      });
  }

  onComposerKeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter' || event.shiftKey) return;

    event.preventDefault();
    this.sendMessage();
  }

  private loadThreads() {
    this.chatApi
      .getThreads()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: threads => {
          this.threads.set(threads);
          this.loading.set(false);
          this.error.set(null);

          if (!threads.length) return;

          const selectedId = this.selectedThreadId() ?? threads[0].id;
          this.selectedThreadId.set(selectedId);
          this.markThreadAsRead(selectedId);
        },
        error: err => {
          this.loading.set(false);
          this.error.set(this.getErrorMessage(err, 'Caricamento chat fallito'));
        },
      });
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
    switch (event.type) {
      case 'thread.snapshot':
        this.threads.set(event.payload);
        if (!this.selectedThreadId() && event.payload.length) {
          this.selectedThreadId.set(event.payload[0].id);
        }
        break;
      case 'thread.message':
        this.upsertThreadMessage(event.payload.threadId, event.payload.message);
        if (event.payload.threadId === this.selectedThreadId()) {
          this.markThreadAsRead(event.payload.threadId);
        }
        break;
      case 'thread.read':
        this.markMessagesAsReadLocally(event.payload.threadId);
        break;
      case 'thread.updated':
        this.upsertThread(event.payload);
        break;
    }
  }

  private upsertThread(thread: ChatThread) {
    this.threads.update(threads => {
      const exists = threads.some(item => item.id === thread.id);
      if (!exists) return [thread, ...threads];

      return threads.map(item => (item.id === thread.id ? thread : item));
    });
  }

  private upsertThreadMessage(threadId: number, message: ChatMessage) {
    this.threads.update(threads =>
      threads.map(thread => {
        if (thread.id !== threadId) return thread;

        const alreadyExists = thread.messages.some(item => item.id === message.id);
        const messages = alreadyExists
          ? thread.messages.map(item => (item.id === message.id ? message : item))
          : [...thread.messages, message];

        return {
          ...thread,
          lastMessageAt: message.time,
          messages,
        };
      })
    );
  }

  private markThreadAsRead(threadId: number) {
    this.markMessagesAsReadLocally(threadId);

    this.chatApi
      .markAsRead(threadId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: err => {
          this.error.set(this.getErrorMessage(err, 'Aggiornamento stato lettura fallito'));
        },
      });
  }

  private markMessagesAsReadLocally(threadId: number) {
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

  private getErrorMessage(error: unknown, fallback: string) {
    if (error instanceof HttpErrorResponse) {
      return error.error?.message ?? fallback;
    }

    return fallback;
  }
}
