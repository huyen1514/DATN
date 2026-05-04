export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5135/api";

// URL gốc của Backend (không có /api) — Dùng để resolve đường dẫn file tĩnh (audio, ảnh)
export const BACKEND_URL = API_URL.replace(/\/api$/, "");

/**
 * Chuyển đổi đường dẫn tương đối (ví dụ: /uploads/audio/xxx.mp3) 
 * thành URL đầy đủ trỏ về Backend (ví dụ: http://localhost:5135/uploads/audio/xxx.mp3)
 * Trả về undefined nếu url rỗng/null — giúp thẻ <audio> không render khi không có file
 */
export const resolveMediaUrl = (url?: string | null): string | undefined => {
  if (!url || url.trim() === "") return undefined;
  if (url.startsWith("http")) return url;         // Đã là URL đầy đủ
  if (url.startsWith("/")) return BACKEND_URL + url; // Đường dẫn tương đối → nối với Backend
  return url;
};

export const api = async (url: string, method = "GET", body?: unknown, signal?: AbortSignal): Promise<any> => {
  const token = localStorage.getItem("token");

  const res = await fetch(API_URL + url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : ""
    },
    body: body ? JSON.stringify(body) : undefined,
    signal
  });

  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return res.ok ? { message: text } : { error: text };
  }
};

export const uploadAudio = async (file: File) => {
  const token = localStorage.getItem("token");
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(API_URL + "/upload/audio", {
    method: "POST",
    headers: {
      Authorization: token ? `Bearer ${token}` : ""
    },
    body: formData
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || "Upload failed");
  }

  return await res.json();
};

export const uploadImage = async (file: File) => {
  const token = localStorage.getItem("token");
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(API_URL + "/upload/image", {
    method: "POST",
    headers: {
      Authorization: token ? `Bearer ${token}` : ""
    },
    body: formData
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || "Upload failed");
  }

  return await res.json();
};

export const uploadExamQuestionMedia = async (file: File, questionId: number) => {
  const token = localStorage.getItem("token");
  const formData = new FormData();
  formData.append("file", file);
  formData.append("questionId", questionId.toString());

  const res = await fetch(API_URL + "/exams/upload-media", {
    method: "POST",
    headers: {
      Authorization: token ? `Bearer ${token}` : ""
    },
    body: formData
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || "Upload media failed");
  }

  return await res.json();
};
