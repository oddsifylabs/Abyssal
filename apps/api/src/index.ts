import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import { runLimiter } from './middleware/rateLimit.js';
import { leaderboardRouter } from './routes/leaderboard.js';
import { runsRouter } from './routes/runs.js';
import { dailyRouter } from './routes/daily.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.WEB_URL || '*', methods: ['GET', 'POST'] },
});

app.use(helmet());
app.use(cors({ origin: process.env.WEB_URL || '*' }));
app.use(express.json({ limit: '100kb' }));

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Routes
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/runs', runLimiter, ClerkExpressRequireAuth(), runsRouter);
app.use('/api/daily', dailyRouter);

// Socket.io arena rooms
const _rooms = new Map<string, any>();

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('join-arena', (roomId: string) => {
    socket.join(roomId);
    socket.to(roomId).emit('player-joined', socket.id);
  });

  socket.on('player-update', (data: { roomId: string; state: any }) => {
    socket.to(data.roomId).emit('player-updated', { id: socket.id, state: data.state });
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`Abyssal API listening on port ${PORT}`);
});
