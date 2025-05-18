const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const cookieParser = require("cookie-parser");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const session = require("express-session");
const jwt = require("jsonwebtoken");

// Load service account from environment variable and fail fast if missing
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
  console.error("FATAL: GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is not set.");
  process.exit(1);
}
let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
} catch (e) {
  console.error("FATAL: GOOGLE_APPLICATION_CREDENTIALS_JSON is not valid JSON.");
  process.exit(1);
}
const admin = require("firebase-admin");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://volunteerhub-9ae56.firebaseio.com"
});

const db = admin.firestore();

const app = express();
const PORT = 3000;

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

// Add session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || "volunteerhub_secret",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 }
}));

// Serve Homepage
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Signup Route
app.post("/signup", async (req, res) => {
  try {
    const { firstName, lastName, email, phoneNumber, username, password, zipCode } = req.body;

    if (!firstName || !lastName || !email || !username || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Ensure phoneNumber is never undefined
    const safePhoneNumber = typeof phoneNumber === "undefined" ? "" : phoneNumber;

    // Check if username exists
    const userRef = db.collection("users").doc(username);
    const userDoc = await userRef.get();
    if (userDoc.exists) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // Check if email exists
    const emailQuery = await db.collection("users").where("email", "==", email).get();
    if (!emailQuery.empty) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const userID = uuidv4();

    // Create user object
    const newUser = {
      userID,
      firstName,
      lastName,
      email,
      phoneNumber: safePhoneNumber,
      zipCode,
      password: hashedPassword
    };

    // Add to 'users' collection
    await db.collection("users").doc(username).set(newUser);

    // Add to 'userData' collection
    const userData = {
      name: `${firstName} ${lastName}`,
      email,
      preferences: {},
      activities: []
    };
    await db.collection("userData").doc(userID).set(userData);

    res.status(201).json({ message: "User registered successfully", userID });
  } catch (error) {
    console.error("Signup error", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Login Route
app.post("/login", async (req, res) => {
  try {
    const { username, password, rememberMe } = req.body;
    let user;
    // Get user from 'users' collection
    const userRef = db.collection("users").doc(username);
    const userDoc = await userRef.get();
    if (userDoc.exists) {
      user = userDoc.data();
    }
    if (!user) return res.status(401).json({ message: "User does not exist" });
    // Check hashed password
    if (!(await bcrypt.compare(password, user.password))) return res.status(401).json({ message: "Incorrect password" });
    // Generate JWT token
    const token = jwt.sign({ userID: user.userID, username }, process.env.JWT_SECRET || "volunteerhub_jwt_secret", { expiresIn: "7d" });
    res.status(200).json({ message: "Login successful", userID: user.userID, username, token });
  } catch (error) {
    console.error("Login error", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Token validation endpoint
app.get("/validate-session", (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ valid: false, message: "Token missing" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "volunteerhub_jwt_secret");
    res.status(200).json({ valid: true, userID: decoded.userID, username: decoded.username });
  } catch (error) {
    res.status(401).json({ valid: false, message: "Invalid or expired token" });
  }
});

// Logout Route
app.post("/logout", (req, res) => {
  res.clearCookie("username");
  req.session.destroy();
  res.status(200).json({ message: "Logged out successfully" });
});

// Add Activity Route (session protected)
app.post("/add-activity", async (req, res) => {
  if (!req.session.userID || !req.session.username) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  try {
    const { title, place, start_date, end_date, supervisorName, supervisorEmail } = req.body;
    // Add activity to userData
    const userDataRef = db.collection("userData").doc(req.session.userID);
    const userDataDoc = await userDataRef.get();
    if (!userDataDoc.exists) return res.status(404).json({ message: "User data not found" });
    const userData = userDataDoc.data();
    const newActivity = {
      title,
      place,
      start_date,
      end_date,
      supervisor: { name: supervisorName, email: supervisorEmail }
    };
    const updatedActivities = userData.activities ? [...userData.activities, newActivity] : [newActivity];
    await userDataRef.update({ activities: updatedActivities });
    res.status(201).json({ message: "Activity added successfully" });
  } catch (error) {
    console.error("Add activity error", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Serve Dashboard with dynamic user name
app.get("/dashboard.html", (req, res) => {
  let userName = "";
  if (req.session && req.session.username) {
    userName = req.session.username;
  } else if (req.query && req.query.username) {
    userName = req.query.username;
  } else {
    userName = "Guest";
  }
  const fs = require("fs");
  const dashboardPath = path.join(__dirname, "public", "dashboard.html");
  fs.readFile(dashboardPath, "utf8", (err, html) => {
    if (err) return res.status(500).send("Error loading dashboard");
    // Replace the hardcoded userName in the script
    const replaced = html.replace(/const userName = ".*?";/, `const userName = "${userName}";`);
    res.send(replaced);
  });
});

// Start Server
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));


