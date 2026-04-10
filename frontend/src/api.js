import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000";

let accessToken = null;

export async function login(lang = "en", clientId = "demo-client", clientSecret = "demo-secret") {
  try {
    const response = await axios.post(`${BASE_URL}/auth/token`, {
      client_id:     clientId,
      client_secret: clientSecret,
      lang:          lang,
    });
    accessToken = response.data.access_token;
  } catch (err) {
    throw err;
  }
}

export async function fetchTools() {
  const response = await axios.get(`${BASE_URL}/tools`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.data;
}

export async function transferTools(toolIds, targetCountry, lang = "en") {
  const response = await axios.post(
    `${BASE_URL}/transfer`,
    {
      tool_ids:       toolIds,
      target_country: targetCountry,
      lang:           lang,
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  return response.data;
}

export async function fetchHistory() {
  const response = await axios.get(`${BASE_URL}/history`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.data;
}