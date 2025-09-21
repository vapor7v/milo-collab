import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { registerServiceWorker } from './lib/serviceWorker'

// Register service worker for PWA functionality
if (process.env.NODE_ENV === 'production') {
  registerServiceWorker();
}

createRoot(document.getElementById("root")!).render(<App />);
