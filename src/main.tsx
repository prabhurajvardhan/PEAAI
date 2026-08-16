import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './foundation/design-system/styles/variables.css';
import './app/styles/global.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find the root element');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
