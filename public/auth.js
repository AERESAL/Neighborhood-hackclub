const API_URL_LOCAL = "http://localhost:3000";
const API_URL_PROD = "https://volunteerhub-qfkx.onrender.com";
const API_URL = (window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost")
  ? API_URL_LOCAL
  : API_URL_PROD;
http://127.0.0.1:5500/public/signup.html
document.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.getElementById("signupForm");
  const loginForm = document.getElementById("loginForm");

  // **Signup Form Handling**
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const userData = {
        firstName: document.getElementById("firstName").value.trim(),
        lastName: document.getElementById("lastName").value.trim(),
        email: document.getElementById("email").value.trim(),
        username: document.getElementById("username").value.trim(),
        password: document.getElementById("password").value.trim(),
        zipCode: document.getElementById("zipCode").value.trim(),
        phoneNumber: document.getElementById("phoneNumber") ? document.getElementById("phoneNumber").value.trim() : ""
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

  // **Login Form Handling**
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const username = document.getElementById("username").value.trim();
      const password = document.getElementById("password").value.trim();
      const rememberMe = document.getElementById("rememberMe").checked;

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

        const data = await response.json();

        if (!response.ok) {
          alert(`Login Error: ${data.message}`);
        } else {
          alert("Login successful! Redirecting...");
          window.location.href = "dashboard.html";
        }
      } catch (error) {
        console.error("Login error:", error);
        alert("An unexpected error occurred.");
      }
    });
  }
});