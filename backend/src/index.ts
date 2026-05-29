import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import routes from './routes';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;

export const io = new Server(httpServer, {
  cors: { origin: true, methods: ['GET', 'POST'] },
});

io.on('connection', (socket) => {
  console.log('🔌 Cliente conectado:', socket.id);
  socket.on('disconnect', () => console.log('🔌 Cliente desconectado:', socket.id));
  socket.on('join_cocina', () => socket.join('cocina'));
  socket.on('join_mozo', () => socket.join('mozos'));
});

app.use(helmet());
app.use(morgan('dev'));

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:3000',
];

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500 });
const orderLimiter = rateLimit({ windowMs: 60 * 1000, max: 60 });
app.use('/api/', limiter);
app.use('/api/orders', orderLimiter);

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);

app.get('/', (req, res) => res.json({ message: '🍽️ Sistema Gastronómico API', version: '2.0.0' }));
app.use('*', (req, res) => res.status(404).json({ success: false, error: 'Ruta no encontrada' }));
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Error:', err);
  res.status(500).json({ success: false, error: 'Error interno' });
});

httpServer.listen(PORT, () => {
  console.log(`\n🍽️ ================================`);
  console.log(`   Sistema Gastronómico API`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`   Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`================================\n`);
});

export default app;
