import React, { useState, useCallback } from 'react';
import { HomeLayout, HomeChatPanel } from '../../layouts/home';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'companion';
  timestamp: Date;
}

interface HomePageState {
  messages: Message[];
  isTyping: boolean;
}

export function HomePage() {
  const [state, setState] = useState<HomePageState>({
    messages: [],
    isTyping: false,
  });

  const handleNavigate = useCallback((route: string) => {
    console.log('Navigate to:', route);
  }, []);

  const handleSendMessage = useCallback((content: string) => {
    const userMessage: Message = {
      id: `msg-${Date.now()}-user`,
      content,
      sender: 'user',
      timestamp: new Date(),
    };

    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isTyping: true,
    }));

    setTimeout(() => {
      const companionMessage: Message = {
        id: `msg-${Date.now()}-companion`,
        content: `You said: "${content}". This is a placeholder response. The AI will respond here.`,
        sender: 'companion',
        timestamp: new Date(),
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, companionMessage],
        isTyping: false,
      }));
    }, 1500);
  }, []);

  return (
    <HomeLayout onNavigate={handleNavigate}>
      <div className="home-page">
        <HomeChatPanel
          open={true}
          onClose={() => {}}
          messages={state.messages}
          onSendMessage={handleSendMessage}
          isTyping={state.isTyping}
        />
      </div>
    </HomeLayout>
  );
}

export default HomePage;
