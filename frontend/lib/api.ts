export const API_URL = "http://localhost:5135/api";

export const api = async (url: string, method = "GET", body?: any) => {
  const token = localStorage.getItem("token");

  const res = await fetch(API_URL + url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : ""
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return res.ok ? { message: text } : { error: text };
  }
};