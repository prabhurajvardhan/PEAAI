export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export interface BreakpointConfig {
  mobile: number;
  tablet: number;
  desktop: number;
}

export interface LayoutState {
  sidebarOpen: boolean;
  chatPanelOpen: boolean;
  activeBreakpoint: Breakpoint;
}

export interface HomeLayoutProps {
  children?: React.ReactNode;
  className?: string;
  onNavigate?: (route: string) => void;
}

export interface SidebarProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (route: string) => void;
}

export interface ChatPanelProps {
  open: boolean;
  onClose: () => void;
}

export interface CanvasAreaProps {
  className?: string;
}

export interface NavItem {
  id: string;
  label: string;
  icon?: string;
  route: string;
}

export interface LayoutContextValue extends LayoutState {
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleChatPanel: () => void;
  setChatPanelOpen: (open: boolean) => void;
}
