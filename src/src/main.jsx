import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'

// Intercept all fetch requests to inject JWT
const originalFetch = window.fetch;
window.fetch = async (url, options = {}) => {
  const token = localStorage.getItem("token");
  if (token) {
    options.headers = options.headers || {};
    if (options.headers instanceof Headers) {
      if (!options.headers.has("Authorization")) {
        options.headers.set("Authorization", `Bearer ${token}`);
      }
    } else {
      if (!options.headers["Authorization"] && !options.headers["authorization"]) {
        options.headers["Authorization"] = `Bearer ${token}`;
      }
    }
  }
  return originalFetch(url, options);
};

createRoot(document.getElementById('root')).render(
<StrictMode>
    <App />
</StrictMode>
)
