const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const cookieParser = require("cookie-parser");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const session = require("express-session");
const jwt = require("jsonwebtoken");

// Load service account from environment variable or fallback to serviceAccountKey.json
let serviceAccount;
if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
  try {
    serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
  } catch (e) {
    console.error("FATAL: GOOGLE_APPLICATION_CREDENTIALS_JSON is not valid JSON.");
    process.exit(1);
  }
} else {
  try {
    serviceAccount = require(path.join(__dirname, "serviceAccountKey.json"));
  } catch (e) {
    console.error("FATAL: Could not load service account from environment variable or serviceAccountKey.json.");
    process.exit(1);
  }
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
  allowedHeaders: ["Content-Type", "Authorization"]
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

// Middleware to extract user from JWT (for API endpoints)
function authenticateJWT(req, res, next) {
  let token = null;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'volunteerhub_jwt_secret');
    req.userID = decoded.userID;
    req.username = decoded.username;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// Get Activities Route (JWT protected)
app.get('/get-activities', authenticateJWT, async (req, res) => {
  try {
    const userDataRef = db.collection('userData').doc(req.userID);
    const userDataDoc = await userDataRef.get();
    if (!userDataDoc.exists) return res.status(404).json({ activities: [] });
    const userData = userDataDoc.data();
    res.status(200).json({ activities: userData.activities || [] });
  } catch (error) {
    console.error('Get activities error', error);
    res.status(500).json({ activities: [] });
  }
});

// Add Activity Route (JWT protected)
app.post('/add-activity', authenticateJWT, async (req, res) => {
  try {
    const { title, place, activityDate, startTime, endTime, supervisorName, supervisorEmail } = req.body;
    // Add activity to userData
    const userDataRef = db.collection('userData').doc(req.userID);
    const userDataDoc = await userDataRef.get();
    if (!userDataDoc.exists) return res.status(404).json({ message: 'User data not found' });
    const userData = userDataDoc.data();
    const newActivity = {
      title,
      place,
      activityDate,
      startTime,
      endTime,
      supervisorName,
      supervisorEmail
    };
    const updatedActivities = userData.activities ? [...userData.activities, newActivity] : [newActivity];
    await userDataRef.update({ activities: updatedActivities });
    res.status(201).json({ message: 'Activity added successfully' });
  } catch (error) {
    console.error('Add activity error', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add Activity to 'activities' collection, one document per user (JWT protected)
app.post('/activities', authenticateJWT, async (req, res) => {
  try {
    const { name, date, start_time, end_time, location, supervisorName, supervisorEmail } = req.body;
    if (!name || !date || !start_time || !end_time || !location || !supervisorName || !supervisorEmail) {
      return res.status(400).json({ message: 'Missing required activity fields' });
    }
    // The document name is the username
    const activitiesRef = db.collection('activities').doc(req.username);
    const doc = await activitiesRef.get();
    let activitiesArr = [];
    if (doc.exists) {
      const data = doc.data();
      activitiesArr = data.activities || [];
    }
    const newActivity = {
      name,
      date,
      start_time,
      end_time,
      location,
      supervisorName,
      supervisorEmail
    };
    activitiesArr.push(newActivity);
    await activitiesRef.set({ activities: activitiesArr }, { merge: true });
    res.status(201).json({ message: 'Activity added successfully' });
  } catch (error) {
    console.error('Add activity error', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user info (JWT protected)
app.get('/users', authenticateJWT, async (req, res) => {
  try {
    const userRef = db.collection('users').doc(req.username);
    const userDoc = await userRef.get();
    if (!userDoc.exists) return res.status(404).json({});
    const userData = userDoc.data();
    // Remove sensitive info
    if (userData && userData.password) delete userData.password;

    // Fetch activities created by this user from userData
    const userDataRef = db.collection('userData').doc(req.userID);
    const userDataDoc = await userDataRef.get();
    let activities = [];
    if (userDataDoc.exists) {
      const userDataObj = userDataDoc.data();
      activities = userDataObj.activities || [];
    }
    userData.activities = activities;

    res.status(200).json(userData);
  } catch (error) {
    console.error('Get user info error', error);
    res.status(500).json({});
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


