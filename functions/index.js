const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();

const db = admin.firestore();

exports.connectSchwab = onCall({ enforceAppCheck: false }, async (request) => {
  // 1. Verify user's identity
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }
  const { uid } = request.auth;
  const { code } = request.data;

  if (!code) {
    throw new HttpsError(
      "invalid-argument",
      "The function must be called with a 'code' argument."
    );
  }

  // 2. Exchange authorization code for tokens
  const SCHWAB_CLIENT_ID = process.env.SCHWAB_CLIENT_ID;
  const SCHWAB_CLIENT_SECRET = process.env.SCHWAB_CLIENT_SECRET;
  const redirectUri = process.env.SCHWAB_REDIRECT_URI;

  const tokenUrl = "https://api.schwabapi.com/v1/oauth/token";
  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    Authorization: `Basic ${Buffer.from(
      `${SCHWAB_CLIENT_ID}:${SCHWAB_CLIENT_SECRET}`
    ).toString("base64")}`,
  };
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: code,
    redirect_uri: redirectUri,
  });

  try {
    const response = await axios.post(tokenUrl, body.toString(), { headers });
    const { refresh_token } = response.data;

    // 3. Securely store the refresh token and set status flag
    const userCredentialsRef = db.collection("user_credentials").doc(uid);
    const userStatusRef = db.collection("users").doc(uid).collection("status").doc("schwab");

    await Promise.all([
      userCredentialsRef.set({
        schwab_refresh_token: refresh_token,
        last_refresh_at: admin.firestore.FieldValue.serverTimestamp(),
      }),
      userStatusRef.set({ connected: true })
    ]);

    return { success: true };
  } catch (error) {
    logger.error(
      "Error exchanging Schwab authorization code:",
      error.response?.data || error.message
    );
    throw new HttpsError("internal", "Failed to connect to Schwab.");
  }
});

exports.refreshSchwabToken = onCall(
  { enforceAppCheck: false },
  async (request) => {
    // 1. Verify user's identity
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "The function must be called while authenticated."
      );
    }
    const { uid } = request.auth;

    // 2. Retrieve the stored refresh token from Firestore
    const userCredentialsRef = db.collection("user_credentials").doc(uid);
    const doc = await userCredentialsRef.get();

    if (!doc.exists) {
      throw new HttpsError(
        "not-found",
        "No Schwab credentials found for this user."
      );
    }

    const { schwab_refresh_token } = doc.data();

    // 3. Exchange refresh token for a new access token
    const SCHWAB_CLIENT_ID = process.env.SCHWAB_CLIENT_ID;
    const SCHWAB_CLIENT_SECRET = process.env.SCHWAB_CLIENT_SECRET;

    const tokenUrl = "https://api.schwabapi.com/v1/oauth/token";
    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${SCHWAB_CLIENT_ID}:${SCHWAB_CLIENT_SECRET}`
      ).toString("base64")}`,
    };
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: schwab_refresh_token,
    });

    try {
      const response = await axios.post(tokenUrl, body.toString(), {
        headers,
      });
      const { access_token, refresh_token: new_refresh_token } =
        response.data;

      // 4. Overwrite the old refresh token with the new one
      await userCredentialsRef.update({
        schwab_refresh_token: new_refresh_token,
        last_refresh_at: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 5. Return the new access token to the client
      return { access_token };
    } catch (error) {
      logger.error(
        "Error refreshing Schwab token:",
        error.response?.data || error.message
      );
      throw new HttpsError("internal", "Failed to refresh Schwab token.");
    }
  }
);

