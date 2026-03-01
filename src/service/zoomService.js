import axios from 'axios';
import { getZoomAccessToken } from './zoomAuth.js';

export async function createMeeting({ topic, start_time, duration, hostEmail, timezone, recurrence, endDate }) {
  const zoomAuth = await getZoomAccessToken();

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
      { headers: { Authorization: `Bearer ${zoomAuth.access_token}` } }
    );

    return { success: true, data };
  } catch (error) {
    console.error('Error creating meeting:', error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}

export async function getMeeting(meetingId) {
  const zoomAuth = await getZoomAccessToken();

  try {
    const { data } = await axios.get(
      `https://api.zoom.us/v2/meetings/${encodeURIComponent(meetingId)}`,
      { headers: { Authorization: `Bearer ${zoomAuth.access_token}` } }
    );

    return { success: true, data };
  } catch (error) {
    console.error('Error getting meeting:', error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}

export async function getAllMeetings(hostEmail, pageSize = 30, nextPageToken = null) {
  const zoomAuth = await getZoomAccessToken();

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
      { headers: { Authorization: `Bearer ${zoomAuth.access_token}` } }
    );

    return { success: true, data };
  } catch (error) {
    console.error('Error getting meetings:', error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}
export async function updateMeeting(id, updateData) {
  try {
    const zoomAuth = await getZoomAccessToken();

    // Validate startTime
    if (!updateData.startTime) {
      throw new Error("startTime is required");
    }

    const parsedDate = new Date(updateData.startTime);

    if (isNaN(parsedDate.getTime())) {
      throw new Error("Invalid startTime format");
    }

    // ✅ Only send allowed Zoom fields
    const payload = {
      topic: updateData.title,              // Zoom uses topic
      start_time: parsedDate.toISOString(), // Required format
      duration: updateData.duration,
    };

    await axios.patch(
      `${zoomAuth.api_url}/v2/meetings/${encodeURIComponent(id)}`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${zoomAuth.access_token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return { success: true };

  } catch (error) {
    console.error(
      "Error updating meeting:",
      error.response?.data || error.message
    );

    return {
      success: false,
      error: error.response?.data || error.message,
    };
  }
}
export async function deleteMeeting(zoomMeetingId) {
  try {
    const zoomAuth = await getZoomAccessToken();

    await axios.delete(
      `${zoomAuth.api_url}/v2/meetings/${encodeURIComponent(zoomMeetingId)}`,
      {
        headers: {
          Authorization: `Bearer ${zoomAuth.access_token}`,
        },
      }
    );

    return { success: true };

  } catch (error) {
    console.error(
      "Error deleting meeting:",
      error.response?.data || error.message
    );

    return {
      success: false,
      error: error.response?.data || error.message,
    };
  }
}

export async function endMeeting(meetingId) {
  const zoomAuth = await getZoomAccessToken();

  try {
    await axios.put(
      `${zoomAuth.api_url}/v2/meetings/${encodeURIComponent(meetingId)}/status`,
      { action: 'end' },
      { headers: { Authorization: `Bearer ${zoomAuth.access_token}` } }
    );

    return { success: true, message: 'Meeting ended successfully' };
  } catch (error) {
    console.error('Error ending meeting:', error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
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
  updateMeetingSettings,
  batchDeleteMeetings
};