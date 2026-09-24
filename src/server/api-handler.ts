import express, { Request, Response, NextFunction } from 'express';
import { apiRouter } from './routes/api';

const app = express();

// Configuração Vercel Serverless: previne body parser de travar streams já consumidos
app.use((req: any, _res: any, next: any) => {
  if (req.body !== undefined && typeof req.body === 'object') {
    req._body = true;
  }
  next();
});

// Aumenta limite de payload para backups e imports
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configuração completa de CORS para Vercel
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Suporta requisições tanto com prefixo /api quanto diretas na rota
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Health check para Vercel
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    environment: process.env.VERCEL ? 'vercel-serverless' : 'node',
    timestamp: new Date().toISOString(),
  });
});

// Middleware global de captura de erros para evitar FUNCTION_INVOCATION_FAILED no Vercel
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Vercel Serverless Function Error]:', err);
  if (!res.headersSent) {
    res.status(err.status || 500).json({
      error: err.message || 'Erro interno no servidor Vercel ao processar a requisição.',
      details: String(err.stack || err),
    });
  }
});

// Configuração Vercel para desabilitar o bodyParser nativo do runtime e deixar o Express gerenciar
export const config = {
  api: {
    bodyParser: false,
  },
};

// Export compatível com Vercel Serverless Function
export default function handler(req: any, res: any) {
  return app(req, res);
}
