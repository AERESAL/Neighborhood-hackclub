const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const cookieParser = require("cookie-parser");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const admin = require("firebase-admin");
const serviceAccount = require("serviceAccountKey.json");
const fs = require("fs");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://volunteerhub-9ae56.firebaseio.com"
});

const db = admin.firestore();

const app = express();
const PORT = 3000;
const usersFilePath = path.join(__dirname, "users.json");
const userDataFilePath = path.join(__dirname, "userdata.json");

// CORS Configuration
app.use(cors({
  origin: ["http://127.0.0.1:5500", "http://localhost:5500", "https://volunteerhub-qfkx.onrender.com"],
  credentials: true,
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Serve Homepage
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Helper function to read users.json
function readUsersFromFile() {
  if (fs.existsSync(usersFilePath)) {
    const data = fs.readFileSync(usersFilePath);
    return JSON.parse(data);
  }
  return {};
}

// Helper function to write users.json
function writeUsersToFile(users) {
  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
}

// Helper function to read userdata.json
function readUserDataFromFile() {
  if (fs.existsSync(userDataFilePath)) {
    const data = fs.readFileSync(userDataFilePath);
    return JSON.parse(data);
  }
  return {};
}

// Helper function to write userdata.json
function writeUserDataToFile(userData) {
  fs.writeFileSync(userDataFilePath, JSON.stringify(userData, null, 2));
}

// Signup Route
app.post("/signup", async (req, res) => {
  try {
    const { firstName, lastName, email, phoneNumber, username, password, zipCode } = req.body;

    if (!firstName || !lastName || !email || !username || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    let userExists = false;

    try {
      const userRef = db.collection("users").doc(username);
      const userDoc = await userRef.get();
      userExists = userDoc.exists;
    } catch (error) {
      console.error("Firestore error", error);
      return res.status(500).json({ message: "Database error" });
    }

    if (userExists) return res.status(400).json({ message: "Username already exists" });

    const emailQuery = await db.collection("users").where("email", "==", email).get();
    if (!emailQuery.empty) return res.status(400).json({ message: "Email already registered" });

    const userID = uuidv4(); // Generate a random user ID
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      userID,
      firstName,
      lastName,
      email,
      phoneNumber,
      zipCode,
      password: hashedPassword
    };

    try {
      await db.collection("users").doc(username).set(newUser);

      // Add user-specific data to Firestore
      const userData = {
        name: `${firstName} ${lastName}`,
        email,
        preferences: {},
        activities: []
      };
      await db.collection("userData").doc(userID).set(userData);
    } catch (error) {
      console.error("Firestore error", error);
      return res.status(500).json({ message: "Database error" });
    }

    res.status(201).json({ message: "User registered successfully", userID });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Login Route
app.post("/login", async (req, res) => {
  try {
    const { username, password, rememberMe } = req.body;

    let user;

    try {
      const userRef = db.collection("users").doc(username);
      const userDoc = await userRef.get();
      if (userDoc.exists) {
        user = userDoc.data();
      }
    } catch (error) {
      console.error("Firestore error, falling back to users.json", error);
      const users = readUsersFromFile();
      user = users[username];
    }

    if (!user) return res.status(401).json({ message: "User does not exist" });

    if (!(await bcrypt.compare(password, user.password))) return res.status(401).json({ message: "Incorrect password" });

    if (rememberMe) {
      res.cookie("username", username, { maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: true });
    }

    res.status(200).json({ message: "Login successful", userID: user.userID });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Logout Route
app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.status(200).json({ message: "Logged out successfully" });
});

// Start Server
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));