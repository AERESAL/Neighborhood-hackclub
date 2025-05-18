// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, collection, query, where, getDocs, addDoc } from "firebase/firestore";

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
const db = getFirestore(app);

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
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  }

async function loadUserActivities() {
  const userId = localStorage.getItem("userId");
  const userName = localStorage.getItem("userName");
  if (!userId || !userName) return;

  try {
    const q = query(
      collection(db, "activities"),
      where("userId", "==", userId),
      where("userName", "==", userName)
    );
    const querySnapshot = await getDocs(q);
    const activitiesList = document.getElementById("activitiesList");
    activitiesList.innerHTML = "";
    querySnapshot.forEach((doc) => {
      const activity = doc.data();
      const listItem = document.createElement("li");
      listItem.innerHTML = `
        <strong>${activity.title}</strong> - ${activity.place} <br>
        <small>(${activity.start_date} to ${activity.end_date})</small><br>
        Supervisor: ${activity.supervisorName} (${activity.supervisorEmail})<br><br>`;
      activitiesList.appendChild(listItem);
    });
  } catch (error) {
    console.error("Error fetching activities from Firebase:", error);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  loadUserData();
  loadUserActivities();
});

// Add Activity Form logic
const addActivityBtn = document.getElementById("addActivityBtn");
const addActivityForm = document.getElementById("addActivityForm");
const cancelAddActivity = document.getElementById("cancelAddActivity");

if (addActivityBtn && addActivityForm && cancelAddActivity) {
  addActivityBtn.addEventListener("click", () => {
    addActivityForm.classList.remove("hidden");
    addActivityBtn.classList.add("hidden");
  });
  cancelAddActivity.addEventListener("click", () => {
    addActivityForm.classList.add("hidden");
    addActivityBtn.classList.remove("hidden");
    addActivityForm.reset && addActivityForm.reset();
  });
  addActivityForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("activityTitle").value.trim();
    const place = document.getElementById("activityPlace").value.trim();
    const start_date = document.getElementById("activityStartDate").value;
    const end_date = document.getElementById("activityEndDate").value;
    const supervisorName = document.getElementById("supervisorName").value.trim();
    const supervisorEmail = document.getElementById("supervisorEmail").value.trim();
    try {
      const response = await fetch("/add-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, place, start_date, end_date, supervisorName, supervisorEmail })
      });
      const data = await response.json();
      if (!response.ok) {
        alert(`Error: ${data.message}`);
      } else {
        alert("Activity added successfully!");
        addActivityForm.classList.add("hidden");
        addActivityBtn.classList.remove("hidden");
        addActivityForm.reset && addActivityForm.reset();
        window.location.reload();
      }
    } catch (error) {
      alert("Failed to add activity");
      console.error(error);
    }
  });
}

