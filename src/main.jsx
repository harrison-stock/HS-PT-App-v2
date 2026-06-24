import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
ReactDOM.createRoot(document.getElementById('root')).render(<App />)

// Register the service worker so the app can be installed to the home screen.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => { /* ignore */ });
  });
}

