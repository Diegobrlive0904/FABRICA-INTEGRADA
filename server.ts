import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './src/server/routes/api';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body Parser
  app.use(express.json());

  // Rotas de API
  app.use('/api', apiRouter);

  // Healthcheck endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'Fabrica Integrada', timestamp: new Date().toISOString() });
  });

  // Vite middleware para desenvolvimento / estático para produção
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Fábrica Integrada] Servidor operacional iniciado na porta ${PORT}`);

    // Loop de Automação em Segundo Plano (Verificação a cada 45 segundos)
    setInterval(async () => {
      try {
        const { ruleEngine } = await import('./src/server/services/rule-engine');
        const { db } = await import('./src/server/database/db');

        const settings = db.getAutoSettings();
        // 1. SLA Rules
        ruleEngine.evaluateOrderSlas();

        // 2. Automação de Reposição de Estoque Baixo (se ativado)
        if (settings.autoWhatsAppLowStock) {
          db.scanAllLowStockAndTrigger();
        }

        // 3. Automação de Cobrança Financeira (se ativado)
        if (settings.autoWhatsAppCollection) {
          await ruleEngine.executeCollectionAutomation();
        }

        // 4. Identificação e Baixa Automática de Pagamentos pelo Sistema (sem depender de botão)
        db.systemAutoDetectPayments();
      } catch (err) {
        console.error('[Worker Automação] Erro no ciclo de segundo plano:', err);
      }
    }, 45000);
  });
}

startServer();
