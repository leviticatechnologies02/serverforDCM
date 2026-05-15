import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config();
/**
 * Initialize Android Publisher client using service account JSON.
 * Accepts either full JSON in `GOOGLE_SERVICE_ACCOUNT_JSON` (stringified)
 * or a path in `GOOGLE_SERVICE_ACCOUNT_KEY_PATH`.
 */
export const getAndroidPublisher = async () => {
  const authOptions = {
    scopes: ['https://www.googleapis.com/auth/androidpublisher']
  };

  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    // JSON string stored in env (useful for deployment)
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    authOptions.credentials = credentials;
  } else if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH) {
    authOptions.keyFile = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;
  } else {
    throw new Error('Google service account credentials not configured');
  }

  const auth = new google.auth.GoogleAuth(authOptions);
  const androidpublisher = google.androidpublisher({ version: 'v3', auth });
  return androidpublisher;
};

/**
 * Verify an in-app product purchase (non-consumable) via Google Play.
 * Returns the Google API response object.
 */
export const verifyProductPurchase = async ({ packageName, productId, purchaseToken }) => {
  const androidpublisher = await getAndroidPublisher();

  const res = await androidpublisher.purchases.products.get({
    packageName,
    productId,
    token: purchaseToken
  });

  return res.data;
};

/**
 * Acknowledge purchase to Google Play (so it isn't refunded/left pending).
 */
export const acknowledgeProductPurchase = async ({ packageName, productId, purchaseToken }) => {
  const androidpublisher = await getAndroidPublisher();

  await androidpublisher.purchases.products.acknowledge({
    packageName,
    productId,
    token: purchaseToken,
    requestBody: {}
  });
};