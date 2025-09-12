import { Server } from 'socket.io';

let io;

export function initSocket(server) {
  io = new Server(server, {
    cors: { origin: '*' }
  });

  io.on('connection', (socket) => {
    // Expect client to join a batch room
    socket.on('joinBatch', (batchId) => {
      socket.join(`batch_${batchId}`);
    });

    socket.on('disconnect', () => {
        console.log("❌ Client disconnected:", socket.id)
    });
  });

  console.log('✅ Socket.IO initialized');
  return io;
}

export { io };