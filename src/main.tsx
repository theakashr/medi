import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { doc, getDocFromCache } from 'firebase/firestore';
import { db } from './lib/firebase';

async function testConnection() {
  try {
    // Just a heartbeat check
    await getDocFromCache(doc(db, 'test', 'connection'));
  } catch (error) {
    console.warn("Firebase connection test performed.");
  }
}
testConnection();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
