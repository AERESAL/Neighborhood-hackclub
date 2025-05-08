const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

const USERS_FILE = "users.json";
const USER_DATA_FILE = "userData.json";

// Serve user data
app.get("/users", (req, res) => {
  fs.readFile(USERS_FILE, "utf-8", (err, data) => {
    if (err) return res.status(500).json({ error: "Error reading user file" });
    res.json(JSON.parse(data));
  });
});

app.get("/userData", (req, res) => {
  fs.readFile(USER_DATA_FILE, "utf-8", (err, data) => {
    if (err) return res.status(500).json({ error: "Error reading user data file" });
    res.json(JSON.parse(data));
  });
});

// Update user data (for future form)
app.post("/updateUser", (req, res) => {
  const updatedData = req.body;

  fs.writeFile(USER_DATA_FILE, JSON.stringify(updatedData, null, 2), (err) => {
    if (err) return res.status(500).json({ error: "Error writing user data" });
    res.json({ message: "User data updated successfully!" });
  });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));