import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000";

let accessToken = null;

export async function login(lang = "en") {
  const response = await axios.post(`${BASE_URL}/auth/token`, {
    client_id:     "demo-client",
    client_secret: "demo-secret",
    lang:          lang,
  });
  accessToken = response.data.access_token;
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