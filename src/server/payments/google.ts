import { google } from "googleapis";

const SCOPES = [
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/spreadsheets",
];

const normalizePrivateKey = (key?: string) =>
  key ? key.replace(/\\n/g, "\n") : undefined;

const loadCredentials = () => {
  const base64 = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64;
  if (base64) {
    const decoded = Buffer.from(base64, "base64").toString("utf-8");
    const parsed = JSON.parse(decoded);
    return {
      ...parsed,
      private_key: normalizePrivateKey(parsed.private_key),
    };
  }

  const rawJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (rawJson) {
    const parsed = JSON.parse(rawJson);
    return {
      ...parsed,
      private_key: normalizePrivateKey(parsed.private_key),
    };
  }

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY);
  if (email && privateKey) {
    return {
      client_email: email,
      private_key: privateKey,
    };
  }

  throw new Error(
    "Missing Google Service Account credentials (set GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 or GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_PRIVATE_KEY).",
  );
};

let cachedAuth: InstanceType<typeof google.auth.GoogleAuth> | null = null;

export const getGoogleAuth = () => {
  if (cachedAuth) return cachedAuth;

  const credentials = loadCredentials();
  cachedAuth = new google.auth.GoogleAuth({
    credentials,
    scopes: SCOPES,
  });

  return cachedAuth;
};
