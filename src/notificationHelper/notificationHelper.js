import { io } from '../server.js';
import { socketEvents } from './socketEvents.js';

export const sendNotification = async ({
  type,
  userIds,
  batchId,
  title,
  message,
  data = {}
}) => {
  const notification = {
    type,
    title,
    message,
    timestamp: new Date(),
    ...data
  };

  if (userIds?.length) {
    // Send to specific users
    userIds.forEach(userId => {
      io.to(`user_${userId}`).emit(socketEvents[type], notification);
    });
  }

  if (batchId) {
    // Send to entire batch
    io.to(`batch_${batchId}`).emit(socketEvents[type], notification);
  }

  return notification;
};

// Usage examples:
export const notifyClassStarting = async (batchId, classData) => {
  return sendNotification({
    type: 'CLASS_STARTED',
    batchId,
    title: 'Class Starting Soon',
    message: `Your class ${classData.title} is starting in 15 minutes`,
    data: classData
  });
};

export const notifyNewTask = async (userIds, taskData) => {
  return sendNotification({
    type: 'NEW_TASK',
    userIds,
    title: 'New Task Assigned',
    message: `You have been assigned a new task: ${taskData.title}`,
    data: taskData
  });
};