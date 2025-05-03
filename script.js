function showForm(formId) {
    document.querySelectorAll(".form-box").forEach(form => form.classList.remove("active"));
    document.getElementById(formId).classList.add("active");
}

async function login(event) {
    event.preventDefault();

    const email = document.querySelector('#login-form input[name="Email"]').value;
    const password = document.querySelector('#login-form input[name="Password"]').value;
    const errorMessage = document.querySelector('#login-form .error-message');

    const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (response.ok) {
        // Clear any previous error message
        errorMessage.textContent = '';

        // Save the token in localStorage
        localStorage.setItem('token', data.token);

        // Redirect to home.html
        window.location.href = 'home.html';
    } else {
        // Display error message
        errorMessage.textContent = 'Incorrect credentials. Please try again.';
    }
}

async function register(event) {
    event.preventDefault();

    const name = document.querySelector('#register-form input[name="Name"]').value;
    const email = document.querySelector('#register-form input[name="Email"]').value;
    const password = document.querySelector('#register-form input[name="Password"]').value;
    const role = document.querySelector('#register-form select[name="Organization or Individual"]').value;
    const errorMessage = document.querySelector('#register-form .error-message');

    // Password validation
    const passwordRegex = /^(?=.*[A-Z]).{8,}$/; // At least 8 characters and 1 capital letter
    if (!passwordRegex.test(password)) {
        errorMessage.textContent = 'Password must be at least 8 characters long and contain at least 1 capital letter.';
        return;
    }

    const response = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
    });

    const data = await response.json();
    if (response.ok) {
        // Clear any previous error message
        errorMessage.textContent = '';

        // Redirect to home.html
        window.location.href = 'home.html';
    } else {
        // Display error message
        errorMessage.textContent = data.message;
    }
}

// Attach event listeners
document.querySelector('#login-form form').addEventListener('submit', login);
document.querySelector('#register-form form').addEventListener('submit', register);