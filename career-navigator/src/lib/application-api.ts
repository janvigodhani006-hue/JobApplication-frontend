const API_URL = "http://localhost:9091/api/applications";

export async function createApplication(application: any) {
  const token = localStorage.getItem("auth_token");

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(application),
  });

  if (!response.ok) {
    throw new Error("Failed to create application");
  }

  return response.json();
}