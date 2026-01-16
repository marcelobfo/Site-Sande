
import React from 'https://esm.sh/react@19.0.0';
import ReactDOM from 'https://esm.sh/react-dom@19.0.0/client';
import App from './App';

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("FATAL: Elemento #root não encontrado no HTML.");
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("✅ Aplicação Iniciada via CDN ESM.");
  } catch (error) {
    console.error("❌ Erro de Renderização:", error);
    rootElement.innerHTML = `
      <div style="padding: 20px; color: #7E22CE; text-align: center;">
        <h1>Erro Crítico</h1>
        <p>A aplicação não pôde ser renderizada. Verifique o console do navegador.</p>
      </div>
    `;
  }
}
