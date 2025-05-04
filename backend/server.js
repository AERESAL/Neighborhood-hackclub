const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');

const app = express();
const PORT = 5000;

// Middleware
app.use(bodyParser.json());
app.use(cors());
const upload = multer({ dest: 'uploads/' });

// Mock database (replace with a real database like MongoDB or MySQL)
const users = [
    { name: 'John Doe', email: 'johndoe@example.com', password: 'Password123', role: 'Organization' }
];

// Middleware to verify the token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    jwt.verify(token, 'secretkey', (err, user) => {
        if (err) return res.status(403).json({ message: 'Forbidden' });
        req.user = user;
        next();
    });
}

// Default route for the root URL
app.get('/', (req, res) => {
    console.log('Root route accessed');
    res.send('Welcome to the backend server!');
});

// Register endpoint
app.post('/register', async (req, res) => {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const userExists = users.find(user => user.email === email);
    if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save user
    users.push({ name, email, password: hashedPassword, role });
    res.status(201).json({ message: 'User registered successfully' });
});

// Login endpoint
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Find user
    const user = users.find(user => user.email === email);
    if (!user) {
        return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Generate token with role
    const token = jwt.sign({ email: user.email, role: user.role }, 'secretkey', { expiresIn: '1h' });
    res.status(200).json({ message: 'Login successful', token });
});

// Route to get user details
app.get('/user', authenticateToken, (req, res) => {
    const user = users.find(u => u.email === req.user.email);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ name: user.name, role: user.role });
});

app.post('/settings', authenticateToken, upload.single('profilePicture'), (req, res) => {
    const { name, email } = req.body;
    const profilePicture = req.file;

    const user = users.find(u => u.email === req.user.email);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    // Update user details
    user.name = name || user.name;
    user.email = email || user.email;
    if (profilePicture) {
        user.profilePicture = profilePicture.path; // Save the file path
    }

    res.json({ message: 'User details updated successfully' });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

