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
        const response = await fetch("http://localhost:3000/signup", {
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
        alert("An unexpected error occurred. Please check the console.");
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
        const response = await fetch("http://localhost:3000/login", {
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
        alert("An unexpected error occurred. Please check the console.");
      }
    });
  }
});