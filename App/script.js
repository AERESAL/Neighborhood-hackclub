// Import the functions you need from the Firebase SDKs
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBd-PGthBB6nVHX0qsG42N6G4BVv5EZnTY",
    authDomain: "volunteerhub-4e225.firebaseapp.com",
    projectId: "volunteerhub-4e225",
    storageBucket: "volunteerhub-4e225.firebasestorage.app",
    messagingSenderId: "912594963232",
    appId: "1:912594963232:web:333bd92cb8effeef286545",
    measurementId: "G-821CKHW45E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Function to handle login
async function login(event) {
    event.preventDefault();

    const email = document.querySelector('#login-form input[name="Email"]').value;
    const password = document.querySelector('#login-form input[name="Password"]').value;
    const errorMessage = document.querySelector('#login-form .error-message');

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Clear any previous error message
        errorMessage.textContent = '';

        // Redirect to home.html
        window.location.href = 'home.html';
    } catch (error) {
        // Display error message
        errorMessage.textContent = error.message;
    }
}

// Function to handle registration
async function register(event) {
    event.preventDefault();

    const name = document.querySelector('#register-form input[name="Name"]').value;
    const email = document.querySelector('#register-form input[name="Email"]').value;
    const password = document.querySelector('#register-form input[name="Password"]').value;
    const confirmPassword = document.querySelector('#register-form input[name="ConfirmPassword"]').value;
    const errorMessage = document.querySelector('#register-form .error-message');

    // Password validation
    if (password !== confirmPassword) {
        errorMessage.textContent = 'Passwords do not match.';
        return;
    }

    const passwordRegex = /^(?=.*[A-Z]).{8,}$/; // At least 8 characters and 1 capital letter
    if (!passwordRegex.test(password)) {
        errorMessage.textContent = 'Password must be at least 8 characters long and contain at least 1 capital letter.';
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Clear any previous error message
        errorMessage.textContent = '';

        // Redirect to home.html
        window.location.href = 'home.html';
    } catch (error) {
        // Display error message
        errorMessage.textContent = error.message;
    }
}

// Attach event listeners
document.querySelector('#login-form form').addEventListener('submit', login);
document.querySelector('#register-form form').addEventListener('submit', register);

