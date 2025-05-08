document.getElementById("loginForm").addEventListener("submit", async function(event) {
  event.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch("users.json");
    const users = await response.json();
    
    const validUser = users.find(user => user.username === username && user.password === password);

    if (validUser) {
      localStorage.setItem("userId", validUser.id);
      localStorage.setItem("userName", validUser.name);
      window.location.href = "dashboard.html";
    } else {
      document.getElementById("message").innerText = "Invalid username or password.";
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
  }
});

async function loadUserData() {
  const userId = localStorage.getItem("userId");
  if (!userId) return;

  try {
    const response = await fetch("userData.json");
    const userData = await response.json();

    if (userData[userId]) {
      document.getElementById("userName").innerText = userData[userId].name;
      document.getElementById("userEmail").innerText = userData[userId].email;
      document.getElementById("userRole").innerText = userData[userId].role;
      document.getElementById("userTheme").innerText = userData[userId].preferences.theme;

      // Dynamically update activities list
      const activitiesList = document.getElementById("activitiesList");
      activitiesList.innerHTML = "";

      userData[userId].activities.forEach(activity => {
        const listItem = document.createElement("li");
        listItem.innerHTML = `
          <strong>${activity.title}</strong> - ${activity.place} <br>
          <small>(${activity.start_date} to ${activity.end_date})</small><br>
          Supervisor: ${activity.supervisor.name} (${activity.supervisor.email})<br><br>`;
        activitiesList.appendChild(listItem);
      });
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
  }
}