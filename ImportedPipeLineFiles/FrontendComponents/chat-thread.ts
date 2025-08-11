export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  context?: string[]; // RAG context used
}

export interface ConversationThread {
  id: string;
  messages: ChatMessage[];
  createdAt: number;
  lastUpdated: number;
  metadata?: {
    documentCount?: number;
    totalTokens?: number;
  };
}

const THREAD_STORAGE_KEY = 'rag-hero-thread';
const MAX_MESSAGES = 50; // Limit conversation length
const MAX_TOKENS = 4000; // Approximate token limit for context

export class ChatThreadManager {
  private threadId: string;
  private thread: ConversationThread;

  constructor() {
    this.threadId = this.generateThreadId();
    this.thread = this.loadThread();
  }

  private generateThreadId(): string {
    return `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private loadThread(): ConversationThread {
    try {
      const stored = localStorage.getItem(THREAD_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate stored thread
        if (parsed && parsed.messages && Array.isArray(parsed.messages)) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn('Failed to load chat thread from localStorage:', error);
    }

    // Create new thread
    return {
      id: this.threadId,
      messages: [],
      createdAt: Date.now(),
      lastUpdated: Date.now(),
    };
  }

  private saveThread(): void {
    try {
      localStorage.setItem(THREAD_STORAGE_KEY, JSON.stringify(this.thread));
    } catch (error) {
      console.warn('Failed to save chat thread to localStorage:', error);
    }
  }

  public addMessage(message: Omit<ChatMessage, 'timestamp'>): void {
    const newMessage: ChatMessage = {
      ...message,
      timestamp: Date.now(),
    };

    this.thread.messages.push(newMessage);
    this.thread.lastUpdated = Date.now();

    // Limit conversation length
    if (this.thread.messages.length > MAX_MESSAGES) {
      this.thread.messages = this.thread.messages.slice(-MAX_MESSAGES);
    }

    this.saveThread();
  }

  public getMessages(): ChatMessage[] {
    return [...this.thread.messages];
  }

  public getThreadForAPI(): ChatMessage[] {
    // Return messages optimized for API context
    return this.thread.messages.slice(-20); // Last 20 messages for context
  }

  public clearThread(): void {
    this.thread = {
      id: this.generateThreadId(),
      messages: [],
      createdAt: Date.now(),
      lastUpdated: Date.now(),
    };
    this.saveThread();
  }

  public getThreadInfo(): { messageCount: number; lastUpdated: number } {
    return {
      messageCount: this.thread.messages.length,
      lastUpdated: this.thread.lastUpdated,
    };
  }

  public hasMessages(): boolean {
    return this.thread.messages.length > 0;
  }

  public getLastMessage(): ChatMessage | null {
    return this.thread.messages.length > 0 
      ? this.thread.messages[this.thread.messages.length - 1] 
      : null;
  }
}

// Export singleton instance
export const chatThreadManager = new ChatThreadManager(); 