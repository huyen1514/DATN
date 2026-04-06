export const API_URL = "http://localhost:5135/api";

export const api = async (url: string, method = "GET", body?: any) => {
  const token = localStorage.getItem("token");

  return fetch(API_URL + url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : ""
    },
    body: body ? JSON.stringify(body) : undefined
  }).then(res => res.json());
};