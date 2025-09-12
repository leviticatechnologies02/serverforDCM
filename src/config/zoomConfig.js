
import axios from 'axios';

const ZOOM_API_BASE_URL = 'https://api.zoom.us/v2';

class ZoomService {
  constructor() {
    this.accountId = process.env.ZOOM_ACCOUNT_ID;
    this.clientId = process.env.ZOOM_CLIENT_ID;
    this.clientSecret = process.env.ZOOM_CLIENT_SECRET;
    this.token = null;
  }

  async getAccessToken() {
    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    
    try {
      const response = await axios.post('https://zoom.us/oauth/token', 
        'grant_type=account_credentials&account_id=' + this.accountId,
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      this.token = response.data.access_token;
      return this.token;
    } catch (error) {
      console.error('Failed to get Zoom access token:', error);
      throw error;
    }
  }

  async createMeeting(data) {
    if (!this.token) {
      await this.getAccessToken();
    }

    try {
      const response = await axios.post(
        `${ZOOM_API_BASE_URL}/users/me/meetings`,
        {
          topic: data.topic,
          type: 2, // Scheduled meeting
          start_time: data.start_time,
          duration: data.duration,
          settings: {
            host_video: true,
            participant_video: true,
            join_before_host: false,
            waiting_room: true
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Failed to create Zoom meeting:', error);
      throw error;
    }
  }

  async updateMeeting(meetingId, data) {
    if (!this.token) {
      await this.getAccessToken();
    }

    try {
      const response = await axios.patch(
        `${ZOOM_API_BASE_URL}/meetings/${meetingId}`,
        {
          topic: data.topic,
          start_time: data.start_time,
          duration: data.duration
        },
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Failed to update Zoom meeting:', error);
      throw error;
    }
  }
}

export default new ZoomService();