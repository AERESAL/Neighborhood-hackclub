const API_URL_LOCAL = "http://localhost:3000";
const API_URL_PROD = "https://volunteerhub-qfkx.onrender.com";
const API_URL = (window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost")
  ? API_URL_LOCAL
  : API_URL_PROD;

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  const activityInfoDiv = document.getElementById("activityInfo");
  const signatureForm = document.getElementById("signatureForm");
  const statusDiv = document.getElementById("status");
  const canvas = document.getElementById("signature-pad");

  if (!token) {
    statusDiv.textContent = "Invalid or missing signature link.";
    signatureForm.style.display = "none";
    return;
  }

  // Fetch activity by token
  let activity;
  try {
    const res = await fetch(`${API_URL}/activity-by-token/${token}`);
    if (!res.ok) throw new Error();
    activity = await res.json();
    if (activity.signed) throw new Error();
    activityInfoDiv.innerHTML = `
      <h3>Activity: ${activity.name}</h3>
      <div>Date: ${activity.date}</div>
      <div>Location: ${activity.location}</div>
      <div>Supervisor: ${activity.supervisorName}</div>
      <div>Student: ${activity.submitterName || activity.username || ""}</div>
    `;
  } catch {
    statusDiv.textContent = "This signature link is invalid, deleted, or already signed.";
    signatureForm.style.display = "none";
    return;
  }

  signatureForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    // Get the signature as a data URL
    const signatureDataUrl = canvas.toDataURL();
    // Check if the canvas is blank (optional, but recommended)
    function isCanvasBlank(c) {
      const blank = document.createElement('canvas');
      blank.width = c.width;
      blank.height = c.height;
      return c.toDataURL() === blank.toDataURL();
    }
    if (isCanvasBlank(canvas)) {
      statusDiv.textContent = "Please provide a signature.";
      return;
    }
    const res = await fetch(`${API_URL}/sign-activity/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signature: signatureDataUrl })
    });
    if (res.ok) {
      statusDiv.textContent = "Thank you! Your signature has been recorded.";
      signatureForm.style.display = "none";
    } else {
      statusDiv.textContent = "This form is no longer valid.";
      signatureForm.style.display = "none";
    }
  });
});