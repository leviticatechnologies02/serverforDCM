import axios from 'axios';
import { getZoomAccessToken } from './zoomAuth.js';

export async function createMeeting({ topic, start_time, duration, hostEmail, timezone }) {
  const token = await getZoomAccessToken();

  const payload = {
    topic,
    type: 2, // scheduled
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

  const { data } = await axios.post(
    `https://api.zoom.us/v2/users/${encodeURIComponent(hostEmail)}/meetings`,
    payload,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return data; // contains id, join_url, start_url, etc.
}