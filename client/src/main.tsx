import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Global error handler for unhandled errors
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
});

// Global error handler for unhandled Promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled Promise rejection:', event.reason);
});

const rootElement = document.getElementById("root");

if (rootElement) {
  try {
    // Insert a direct message to verify the JS is running
    rootElement.innerHTML = `
      <div style="text-align: center; padding: 2rem;">
        <h2>Loading application...</h2>
        <p>Please wait while we initialize the app.</p>
      </div>
    `;
    
    // Delay app render slightly to see the message
    setTimeout(() => {
      try {
        const root = createRoot(rootElement);
        root.render(<App />);
      } catch (err) {
        console.error('Error rendering app:', err);
        // Fallback error UI
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        const errorStack = err instanceof Error ? err.stack || '' : '';
        
        rootElement.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: system-ui, -apple-system, sans-serif;">
            <h1 style="color: #e11d48; margin-bottom: 1rem;">Something went wrong</h1>
            <p>We're working to fix this issue. Please try refreshing the page.</p>
            <div style="background: #f5f5f5; padding: 1rem; margin-top: 1rem; border-radius: 0.5rem; max-width: 800px; overflow: auto;">
              <pre>${errorMessage}</pre>
              <pre>${errorStack}</pre>
            </div>
          </div>
        `;
      }
    }, 500);
  } catch (err) {
    console.error('Top-level error:', err);
    // Fallback error UI
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    const errorStack = err instanceof Error ? err.stack || '' : '';
    
    rootElement.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: system-ui, -apple-system, sans-serif;">
        <h1 style="color: #e11d48; margin-bottom: 1rem;">Something went wrong</h1>
        <p>We're working to fix this issue. Please try refreshing the page.</p>
        <div style="background: #f5f5f5; padding: 1rem; margin-top: 1rem; border-radius: 0.5rem; max-width: 800px; overflow: auto;">
          <pre>${errorMessage}</pre>
          <pre>${errorStack}</pre>
        </div>
      </div>
    `;
  }
} else {
  console.error('Root element not found');
}
