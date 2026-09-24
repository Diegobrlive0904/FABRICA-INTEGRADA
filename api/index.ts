import express, { Request, Response, NextFunction } from 'express';
import { apiRouter } from '../src/server/routes/api';

const app = express();

// Aumenta limite de payload para backups e imports
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

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

// Export compatível com Vercel Serverless Function
export default function handler(req: any, res: any) {
  return app(req, res);
}
