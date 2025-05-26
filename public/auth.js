const API_URL_LOCAL = "http://localhost:3000";
const API_URL_PROD = "https://neighborhood-liard.vercel.app";
const API_URL = (window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost")
  ? API_URL_LOCAL
  : API_URL_PROD;

document.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.getElementById("signupForm");
  const loginForm = document.getElementById("loginForm");
  const activityForm = document.getElementById("activityForm");
  const userInfoDiv = document.getElementById("userInfo");
  const activityStatus = document.getElementById("activityStatus");
  let lastToken = null;
  let currentUsername = null;

  // Signup
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const userData = {
        firstName: document.getElementById("firstName")?.value.trim(),
        lastName: document.getElementById("lastName")?.value.trim(),
        email: document.getElementById("email")?.value.trim(),
        username: document.getElementById("signupUsername")?.value.trim() || document.getElementById("username")?.value.trim(),
        password: document.getElementById("signupPassword")?.value.trim() || document.getElementById("password")?.value.trim(),
        zipCode: document.getElementById("zipCode")?.value.trim(),
        phoneNumber: document.getElementById("phoneNumber")?.value.trim() || ""
      };
      if (!userData.username || !userData.password || !userData.email) {
        alert("Please fill in all required fields.");
        return;
      }
      try {
        const response = await fetch(`${API_URL}/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userData),
        });
        const data = await response.json();
        if (!response.ok) {
          alert(`Signup Error: ${data.message}`);
        } else {
          alert("Signup successful! Redirecting...");
          window.location.href = "dashboard.html";
        }
      } catch (error) {
        console.error("Signup error:", error);
        alert("An unexpected error occurred.");
      }
    });
  }

  // Login
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("loginUsername")?.value.trim() || document.getElementById("username")?.value.trim();
      const password = document.getElementById("loginPassword")?.value.trim() || document.getElementById("password")?.value.trim();
      const rememberMe = document.getElementById("rememberMe")?.checked || false;
      if (!username || !password) {
        alert("Please enter your username and password.");
        return;
      }
      try {
        const response = await fetch(`${API_URL}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password, rememberMe }),
        });
        let data;
        try {
          data = await response.json();
        } catch (jsonErr) {
          // If not JSON, likely a 404 or HTML error page
          alert("Login failed: Server error or invalid response.");
          return;
        }
        if (!response.ok) {
          alert(`Login Error: ${data.message || 'Server error.'}`);
        } else {
          // Save token and username for dashboard use
          lastToken = data.token;
          currentUsername = username;
          localStorage.setItem("token", lastToken);
          localStorage.setItem("username", currentUsername);
          alert("Login successful! Redirecting...");
          window.location.href = "dashboard.html";
        }
      } catch (error) {
        console.error("Login error:", error);
        alert("An unexpected error occurred.");
      }
    });
  }

  // Dashboard: Load user info and activities
  if (window.location.pathname.includes("dashboard.html")) {
    lastToken = localStorage.getItem("token");
    currentUsername = localStorage.getItem("username");
    if (lastToken && currentUsername) {
      fetchUserInfo();
      fetchAndRenderActivities();
    }
  }

  // Add Activity
  if (activityForm) {
    activityForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      lastToken = localStorage.getItem("token");
      currentUsername = localStorage.getItem("username");
      if (!lastToken) {
        activityStatus.textContent = "You must be logged in to add an activity.";
        activityStatus.style.color = "#e74c3c";
        return;
      }
      const activity = {
        name: document.getElementById("activityName")?.value.trim(),
        date: document.getElementById("activityDate")?.value,
        start_time: document.getElementById("activityStartTime")?.value,
        end_time: document.getElementById("activityEndTime")?.value,
        location: document.getElementById("activityWhere")?.value.trim(),
        supervisorName: document.getElementById("supervisorName")?.value.trim(),
        supervisorEmail: document.getElementById("supervisorEmail")?.value.trim()
      };
      if (!activity.name || !activity.date || !activity.start_time || !activity.end_time || !activity.location || !activity.supervisorName || !activity.supervisorEmail) {
        activityStatus.textContent = "Please fill in all activity fields.";
        activityStatus.style.color = "#e74c3c";
        return;
      }
      try {
        // Add activity
        const response = await fetch(`${API_URL}/activities`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${lastToken}`
          },
          body: JSON.stringify(activity)
        });
        const data = await response.json();
        if (!response.ok) {
          activityStatus.textContent = `Error: ${data.message || "Could not add activity."}`;
          activityStatus.style.color = "#e74c3c";
        } else {
          // If get signature is checked, send email
          const getSignature = document.getElementById("getSignatureCheckbox")?.checked;
          if (getSignature) {
            try {
              const sigRes = await fetch(`${API_URL}/send-signature-request`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${lastToken}`
                },
                body: JSON.stringify(activity)
              });
              const sigData = await sigRes.json();
              if (!sigRes.ok) {
                activityStatus.textContent = `Activity added, but failed to send signature email: ${sigData.message}`;
                activityStatus.style.color = "#e74c3c";
              } else {
                activityStatus.textContent = "Activity added and signature request sent!";
                activityStatus.style.color = "#27ae60";
              }
            } catch (err) {
              activityStatus.textContent = "Activity added, but error sending signature email.";
              activityStatus.style.color = "#e74c3c";
            }
          } else {
            activityStatus.textContent = "Activity added successfully!";
            activityStatus.style.color = "#27ae60";
          }
          activityForm.reset();
          fetchAndRenderActivities();
        }
      } catch (error) {
        activityStatus.textContent = "An unexpected error occurred.";
        activityStatus.style.color = "#e74c3c";
      }
    });
  }

  // Fetch user info for dashboard
  async function fetchUserInfo() {
    if (!lastToken) return;
    try {
      const res = await fetch(`${API_URL}/users`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${lastToken}` }
      });
      const userData = await res.json();
      renderUserInfo(userData);
    } catch {
      if (userInfoDiv) userInfoDiv.innerHTML = `<div style='color:#e74c3c;'>Could not load user data.</div>`;
    }
  }

  // Fetch activities for dashboard
  async function fetchAndRenderActivities() {
    if (!currentUsername || !lastToken) return;
    try {
      const res = await fetch(`${API_URL}/activities/${currentUsername}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${lastToken}`,
          "Accept": "application/json"
        }
      });
      const data = await res.json();
      renderActivitiesSection(data.activities || []);
    } catch {
      if (activityStatus) {
        activityStatus.textContent = "Could not load activities.";
        activityStatus.style.color = "#e74c3c";
      }
    }
  }

  // Render user info
  function renderUserInfo(user) {
    if (!userInfoDiv) return;
    if (!user || !user.username) {
      userInfoDiv.innerHTML = "<b>No user info found.</b>";
      return;
    }
    userInfoDiv.innerHTML = `
      <h3>User Information</h3>
      <div><b>Username:</b> ${user.username}</div>
      <div><b>Name:</b> ${user.firstName || ""} ${user.lastName || ""}</div>
      <div><b>Email:</b> ${user.email || ""}</div>
      <div><b>Zip Code:</b> ${user.zipCode || ""}</div>
    `;
  }

  // Render activities
  function renderActivitiesSection(activities) {
    const container = document.getElementById("activitiesSection") || document.createElement("div");
    container.id = "activitiesSection";
    let html = `<h3>Activities</h3>`;
    if (activities.length > 0) {
      html += "<ul>";
      activities.forEach(act => {
        html += `<li>
          <b>${act.name}</b> (${act.date})<br>
          ${act.start_time} - ${act.end_time} @ ${act.location}<br>
          Supervisor: ${act.supervisorName} (${act.supervisorEmail})
        </li>`;
      });
      html += "</ul>";
    } else {
      html += "<div>No activities found.</div>";
    }
    container.innerHTML = html;
    if (!document.getElementById("activitiesSection")) {
      document.body.appendChild(container);
    }
  }
});