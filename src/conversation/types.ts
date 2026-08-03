// Type definitions for M07 Conversation Engine

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
  isStreaming?: boolean;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  isStreaming: boolean;
}

export interface ChatActions {
  sendMessage: (content: string) => void;
  clearMessages: () => void;
  retryMessage: (messageId: string) => void;
  cancelStreaming: () => void;
}

export interface StreamingOptions {
  bufferSize?: number;
  onToken?: (token: string) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export interface TypingAnimationOptions {
  dots?: number;
  interval?: number;
  animationClass?: string;
}

export interface MarkdownOptions {
  codeTheme?: string;
  linkTarget?: '_blank' | '_self' | '_parent' | '_top';
  inlineCodePrefix?: string;
  inlineCodeSuffix?: string;
}

export type MessageRole = 'user' | 'assistant' | 'system';

export interface SendMessagePayload {
  content: string;
  conversationId?: string;
}

export interface StreamingPayload {
  tokens: string[];
  isComplete: boolean;
}

export interface ConversationEvents {
  'message:send': SendMessagePayload;
  'message:received': Message;
  'message:stream': { messageId: string; token: string };
  'message:complete': { messageId: string };
  'message:error': { messageId: string; error: string };
  'typing:start': void;
  'typing:stop': void;
  'stream:cancel': void;
}
