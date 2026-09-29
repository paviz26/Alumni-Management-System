const API_BASE_URL = "http://localhost:5000/api";

async function checkBackend() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error("Backend unavailable:", error);
  }
}

checkBackend();
