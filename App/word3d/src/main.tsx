import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { PlayerApp } from './PlayerApp';
import './styles/main.css';

const rootElement = document.getElementById('root');
if (rootElement) {
  const isPlayerMode = window.location.search.includes('mode=player');
  ReactDOM.createRoot(rootElement).render(
    isPlayerMode ? <PlayerApp /> : <App />
  );
}
