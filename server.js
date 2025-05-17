const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const cookieParser = require("cookie-parser");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const admin = require("firebase-admin");
const serviceAccount = {
  "type": "service_account",
  "project_id": "volunteerhub-9ae56",
  "private_key_id": "2ca234f47a2195a70b5cbcf69cb10bcab036dc92",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDoJ1EM26AszRnA\n6hMxRZQJyfX4wTCIeewycxSIRlgJyOCFlmipDBExh1y47EB6iMdf7lSM+0jhfYPo\nNMhs5b+75T0IttVA4sYa4nOjziaQdwd9TaLW7UXYCUtaDdfBPaaZbDi811fX0hYg\nHeViHCe8CTQzGYMVvscPeMAXUIjZ4r42mXyATt1Y+/ZIr1oOZz/SVuFd3yJ/qa68\nLImPUzMPqESN5djPa/T5sWsb/exCX5kzU5MDpSbU40UKsGJSz1zny+tpcdrG5qx9\nYQO5TRUngHJKe5h/VZebtXvy0PZkg09dGA0yOQ9W0+KuJOy+wRZgFlaSQm+ekH1+\n5R58YaJjAgMBAAECggEADS+L00l3e96bs4ZYArjAo3GyI9KCjtiF9DOZxfJg4RAP\nbeb7biaTpMGFywcNfn2IUsg29dmhQRV09C+99oQcyMTzcNbu89mC26y4WWRwckzL\nGHCGwDhdJYZu84rNEgUOElwVjjxDmVbYZN3t1Q25AAgcdo6LZc/JKfV3dkY1D6hN\nOs5RiEzqUXfFYEnrDKTDVL/jq+TnQh/2R/KfNCXfoSHS0dTGLTe/Mb1zgl8wL/vu\np51BCkrbIGDWFAwyRCK5IjKJf8pCAkOuWch/G3TnYeX4GeUSyhnNL8zoBFE7Iq6O\nZ9TfyT7alwr8G6Lm+Px5F0wt82WIVH1Kj9vQlpL9wQKBgQD7OlpkEjrdlKvK6RIY\nCv+Ey35h3oztMscdP1OSSTnFHi2u62d/AktRTWadyXdaKwla0ffTSNEUYtDt7QSv\nc4b6aU0euJsZAhB8qw6i0hjJMcFl8uNQ42yBNg3Z/GEA1PFfBdY/PcxbiYNb7kLj\nI1EOw2ZWkvbYLxelwhNyqe7QQwKBgQDskDXm/Ba1HuHpk1XHQkEyJ23wJCfssiay\nDATVVpOt4T1svOhmXVQ8xsWL7i6jkiLfEVWm3WIPywuAET/in9nSyOK56nchAgtC\n0S+h2h0P6S6rJp2etfsnwWp7bwzNPgZ1gbG/x3K+K8sj4OTQvRsz/LNOltzuEPrG\nvXU7JLVTYQKBgEGpccCgBySs2+3P1vvTvA8QRLr9uOWyFNqvF3+vhdrgVV5Xhphq\nmBbq3Pw2kOxPPUWwhU6CxKrIXQUiosvcrRW7+f0ikN8LbBW5e7zQnsvPJlYoEoOs\nvUpUP3CPByd5gJCubN3goA34tg2MC41kSKZMKe5MwRmlzU90lzKr+ZATAoGBAJ4k\nDZSbYwazXWyK7OXmmbTQfQLy+KmXspyFwllnphOwJiLh6i48J8r1SiwwDoeUcrFS\nYkLJbfuGzepQHbf/CluJpV+JqResySBivQfiyljPlj4d83KczwgVmXxokVNHKoQ1\nLkE5MLCGkCcs+Wm9cUkAnlFkMs8HFM3060CdWoYhAoGBAOs6zZFTtgj0vr9uv0PI\nLxJ/8hEdSVFvU4YOAigUhZqo051lnBjHtksgTk0zrApEflioQpssI28ZrTxkJ/QE\nhxJd8JYyNInD7T7fJFkkmTR5qqKu8HFtcZF42Tg1D0HGxR2MT+Vd/SJqKcHhJYv5\nhRJ2GkHqONjVIgA5VcNWTotL\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@volunteerhub-9ae56.iam.gserviceaccount.com",
  "client_id": "109459100300818990555",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40volunteerhub-9ae56.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};
const fs = require("fs");

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
    if (rememberMe) {
      res.cookie("username", username, { maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: true });
    }
    res.status(200).json({ message: "Login successful", userID: user.userID });
  } catch (error) {
    console.error("Login error", error);
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


