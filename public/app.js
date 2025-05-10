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

