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

