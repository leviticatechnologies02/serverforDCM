import axios from 'axios';

let cache = { token: null, exp: 0 };

export async function getZoomAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  if (cache.token && now < cache.exp - 60) return cache.token;

  const res = await axios.post(
    'https://zoom.us/oauth/token',
    null,
    {
      params: {
        grant_type: 'account_credentials',
        account_id: process.env.ZOOM_ACCOUNT_ID
      },
      auth: {
        username: process.env.ZOOM_CLIENT_ID,
        password: process.env.ZOOM_CLIENT_SECRET
      }
    }
  );

  cache.token = res.data.access_token;
  cache.exp = now + res.data.expires_in;
  return cache.token;
}