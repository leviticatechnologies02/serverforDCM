import axios from 'axios';
import { getZoomAccessToken } from './zoomAuth.js';

export async function createMeeting({ topic, start_time, duration, hostEmail, timezone, recurrence,
   endDate }) {
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
      end_times: 7 // Optional: maximum number of occurrences (max 50)
    };
  }

  const { data } = await axios.post(
    `https://api.zoom.us/v2/users/${encodeURIComponent(hostEmail)}/meetings`,
    payload,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return data;
}