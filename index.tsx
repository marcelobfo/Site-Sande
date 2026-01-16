
import React from 'react';
import ReactDOM from 'react-dom/client';
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
    console.log("✅ Professora Protagonista: Aplicação iniciada com sucesso.");
  } catch (error) {
    console.error("❌ Erro ao renderizar a aplicação:", error);
    rootElement.innerHTML = `
      <div style="padding: 20px; color: #7E22CE; text-align: center;">
        <h1>Erro de Inicialização</h1>
        <p>Por favor, limpe o cache do seu navegador e tente novamente.</p>
      </div>
    `;
  }
}
