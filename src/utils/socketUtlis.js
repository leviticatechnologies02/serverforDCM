import { io } from '../server.js';

export const socketEvents = {
  // Batch related events
  BATCH_ASSIGNED: 'batchAssigned',
  BATCH_UPDATED: 'batchUpdated',
  
  // Live class events
  CLASS_STARTED: 'classStarted',
  CLASS_ENDED: 'classEnded',
  CLASS_REMINDER: 'classReminder',
  
  // General notifications
  NEW_NOTICE: 'newNotice',
  NEW_TASK: 'newTask',
  TASK_DEADLINE: 'taskDeadline'
};

export const emitToUsers = (userIds, event, data) => {
  userIds.forEach(userId => {
    io.to(`user_${userId}`).emit(event, data);
  });
};

export const emitToBatch = (batchId, event, data) => {
  io.to(`batch_${batchId}`).emit(event, data);
};