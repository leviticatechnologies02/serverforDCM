# serverforDCM

A Node.js/Express backend for Levitica Technologies (DCM).

## 🚀 Quick Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment configuration**
   - Copy `.env.example` to `.env` and populate the values with your own keys.
   - Required variables include:
     - `MONGO_URI` – MongoDB connection URI
     - `ACCESS_SECRET`, `REFRESH_SECRET` – JWT signing secrets
     - Cloudinary credentials (`CLOUDINARY_*`)
     - SMTP settings for email delivery (`SMTP_*`)
     - Frontend/client URLs (`FRONTEND_URL`, `CLIENT_URL`)
     - Razorpay keys if payments are used (`RAZORPAY_*`)

3. **Start the server**
   ```bash
   npm run dev   # development with nodemon
   npm start     # production
   ```

4. **Health check**
   Open `http://localhost:7777/health` (or whatever port you configured) to confirm the server is running.

## 📁 Project structure

Brief overview:
- `src/` – main application code
  - `controllers/`, `routes/`, `models/`, `middlewares/`, etc.
- `server.js` – entrypoint
- `package.json` – dependencies and scripts

## 🔧 Additional notes

- Ensure MongoDB is running locally or provide a cloud URI.
- Cloudinary is used for image uploads (profile pictures, etc.).
- Email services require valid SMTP credentials.
- CORS is configured to allow origins matching `FRONTEND_URL`/`CLIENT_URL`.
- Rate limiting is applied to authentication routes.

For any customizations or debugging, review the controllers and middleware under `src/`.
