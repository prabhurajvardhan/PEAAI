import React from 'react';
import { LayoutProvider, useLayout, useBreakpoint } from './hooks';
import { HomeSidebar } from './Sidebar';
import { HomeChatPanel } from './ChatPanel';
import { HomeCanvasArea } from './CanvasArea';
import type { HomeLayoutProps } from './types';
import './styles.css';

interface HomeLayoutInnerProps extends HomeLayoutProps {
  sidebarOpen: boolean;
  chatPanelOpen: boolean;
  toggleSidebar: () => void;
  toggleChatPanel: () => void;
  onNavigate: (route: string) => void;
}

function HomeLayoutInner({
  children,
  className,
  sidebarOpen,
  chatPanelOpen,
  toggleSidebar,
  toggleChatPanel,
  onNavigate,
}: HomeLayoutInnerProps) {
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === 'mobile';

  const handleNavigate = (route: string) => {
    onNavigate(route);
    if (isMobile) {
      toggleSidebar();
    }
  };

  return (
    <div className={`home-layout ${className || ''}`} data-breakpoint={breakpoint}>
      <HomeSidebar
        open={sidebarOpen}
        onClose={toggleSidebar}
        onNavigate={handleNavigate}
      />

      <main className="home-layout__main">
        <header className="home-layout__header">
          <button
            className="home-layout__menu-button"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
            type="button"
          >
            ☰
          </button>
          <h1 className="home-layout__title">PEAAI</h1>
          <button
            className="home-layout__chat-toggle"
            onClick={toggleChatPanel}
            aria-label="Toggle chat panel"
            type="button"
          >
            💬
          </button>
        </header>

        <div className="home-layout__content">
          <HomeCanvasArea className="home-layout__canvas" />
          {children}
        </div>
      </main>

      <HomeChatPanel
        open={chatPanelOpen}
        onClose={toggleChatPanel}
      />
    </div>
  );
}

export function HomeLayout({ children, className, onNavigate }: HomeLayoutProps) {
  return (
    <LayoutProvider>
      <HomeLayoutContent className={className} onNavigate={onNavigate}>
        {children}
      </HomeLayoutContent>
    </LayoutProvider>
  );
}

interface HomeLayoutContentProps extends HomeLayoutProps {
  children?: React.ReactNode;
}

function HomeLayoutContent({ children, className, onNavigate }: HomeLayoutContentProps) {
  const { sidebarOpen, chatPanelOpen, toggleSidebar, toggleChatPanel } = useLayout();
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === 'mobile';

  const handleNavigate = (route: string) => {
    if (onNavigate) {
      onNavigate(route);
    }
    if (isMobile) {
      toggleSidebar();
    }
  };

  return (
    <HomeLayoutInner
      className={className}
      sidebarOpen={sidebarOpen}
      chatPanelOpen={chatPanelOpen}
      toggleSidebar={toggleSidebar}
      toggleChatPanel={toggleChatPanel}
      onNavigate={handleNavigate}
    >
      {children}
    </HomeLayoutInner>
  );
}
