import axios from 'axios';
import { getZoomAccessToken } from './zoomAuth.js';

export async function createMeeting({ topic, start_time, duration, hostEmail, timezone, recurrence, endDate }) {
  const token = await getZoomAccessToken();

  // Base payload
  const payload = {
    topic,
    type: recurrence === 'daily' ? 8 : 2, // 8 for recurring meeting with fixed time, 2 for scheduled
    start_time,            // ISO 8601 string
    duration,              // minutes
    timezone: timezone || process.env.APP_TIMEZONE || 'UTC',
    settings: {
      join_before_host: false,
      waiting_room: true,
      approval_type: 0,
      mute_upon_entry: true,
      host_video: true,
      participant_video: false
    }
  };

  // Add recurrence settings for daily meetings
  if (recurrence === 'daily') {
    payload.recurrence = {
      type: 1, // Daily
      end_date_time: endDate, // ISO 8601 string for when recurrence should end
    };
  }

  try {
    const { data } = await axios.post(
      `https://api.zoom.us/v2/users/${encodeURIComponent(hostEmail)}/meetings`,
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return { success: true, data };
  } catch (error) {
    console.error('Error creating meeting:', error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}

export async function getMeeting(meetingId) {
  const token = await getZoomAccessToken();

  try {
    const { data } = await axios.get(
      `https://api.zoom.us/v2/meetings/${encodeURIComponent(meetingId)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return { success: true, data };
  } catch (error) {
    console.error('Error getting meeting:', error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}

export async function getAllMeetings(hostEmail, pageSize = 30, nextPageToken = null) {
  const token = await getZoomAccessToken();

  try {
    const params = new URLSearchParams({
      page_size: pageSize.toString(),
      type: 'scheduled'
    });

    if (nextPageToken) {
      params.append('next_page_token', nextPageToken);
    }

    const { data } = await axios.get(
      `https://api.zoom.us/v2/users/${encodeURIComponent(hostEmail)}/meetings?${params}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return { success: true, data };
  } catch (error) {
    console.error('Error getting meetings:', error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}

export async function updateMeeting(meetingId, updateData) {
  const token = await getZoomAccessToken();

  try {
    const { data } = await axios.patch(
      `https://api.zoom.us/v2/meetings/${encodeURIComponent(meetingId)}`,
      updateData,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return { success: true, data };
  } catch (error) {
    console.error('Error updating meeting:', error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}

export async function deleteMeeting(meetingId) {
  const token = await getZoomAccessToken();

  try {
    await axios.delete(
      `https://api.zoom.us/v2/meetings/${encodeURIComponent(meetingId)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return { success: true, message: 'Meeting deleted successfully' };
  } catch (error) {
    console.error('Error deleting meeting:', error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}

export async function endMeeting(meetingId) {
  const token = await getZoomAccessToken();

  try {
    await axios.put(
      `https://api.zoom.us/v2/meetings/${encodeURIComponent(meetingId)}/status`,
      { action: 'end' },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return { success: true, message: 'Meeting ended successfully' };
  } catch (error) {
    console.error('Error ending meeting:', error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}

// Utility function to update specific meeting properties
export async function updateMeetingTopic(meetingId, newTopic) {
  return updateMeeting(meetingId, { topic: newTopic });
}

export async function updateMeetingTime(meetingId, newStartTime, newDuration) {
  const updateData = { start_time: newStartTime };
  if (newDuration) {
    updateData.duration = newDuration;
  }
  return updateMeeting(meetingId, updateData);
}

export async function updateMeetingSettings(meetingId, settings) {
  return updateMeeting(meetingId, { settings });
}

// Batch operations
export async function batchDeleteMeetings(meetingIds) {
  const results = [];

  for (const meetingId of meetingIds) {
    const result = await deleteMeeting(meetingId);
    results.push({ meetingId, ...result });
  }

  return results;
}

export default {
  createMeeting,
  getMeeting,
  getAllMeetings,
  updateMeeting,
  deleteMeeting,
  endMeeting,
  updateMeetingTopic,
  updateMeetingTime,
  updateMeetingSettings,
  batchDeleteMeetings
};