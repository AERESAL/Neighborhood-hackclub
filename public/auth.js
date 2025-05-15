// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBLhZoEmreDGCPqMXOPqHeYYoMZUKQMeuI",
  authDomain: "volunteerhub-9ae56.firebaseapp.com",
  projectId: "volunteerhub-9ae56",
  storageBucket: "volunteerhub-9ae56.firebasestorage.app",
  messagingSenderId: "1073714143993",
  appId: "1:1073714143993:web:a9136fea61872c16e3f828",
  measurementId: "G-5GESVQMQGP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const API_URL = "https://volunteerhub-qfkx.onrender.com"; // ✅ Update to Render-hosted API

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