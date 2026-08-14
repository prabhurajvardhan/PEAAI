import React from 'react';
import type { SidebarProps, NavItem } from './types';

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', route: '/' },
  { id: 'chat', label: 'Chat', route: '/chat' },
  { id: 'stories', label: 'Stories', route: '/stories' },
  { id: 'settings', label: 'Settings', route: '/settings' },
];

interface SidebarNavProps {
  items: NavItem[];
  onNavigate: (route: string) => void;
}

function SidebarNav({ items, onNavigate }: SidebarNavProps) {
  return (
    <nav className="home-sidebar__nav">
      {items.map((item) => (
        <button
          key={item.id}
          className="home-sidebar__nav-item"
          onClick={() => onNavigate(item.route)}
          type="button"
        >
          {item.icon && <span className="home-sidebar__nav-icon">{item.icon}</span>}
          <span className="home-sidebar__nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

export function Sidebar({ open, onClose, onNavigate }: SidebarProps) {
  return (
    <>
      <div
        className={`home-sidebar__overlay ${open ? 'home-sidebar__overlay--visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`home-sidebar ${open ? 'home-sidebar--open' : ''}`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="home-sidebar__header">
          <div className="home-sidebar__logo">
            <span className="home-sidebar__logo-icon">🎭</span>
            <span className="home-sidebar__logo-text">PEAAI</span>
          </div>
          <button
            className="home-sidebar__close"
            onClick={onClose}
            aria-label="Close sidebar"
            type="button"
          >
            ✕
          </button>
        </div>
        <SidebarNav items={NAV_ITEMS} onNavigate={onNavigate} />
      </aside>
    </>
  );
}

export function HomeSidebar({ open, onClose, onNavigate }: SidebarProps) {
  return <Sidebar open={open} onClose={onClose} onNavigate={onNavigate} />;
}
