// Core authentication, user context, and utility functions for dashboard
(function() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
    }
})();

function parseJwt(token) {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        return null;
    }
}

let token = localStorage.getItem('token');
let currentUsername = localStorage.getItem('username');
if (!currentUsername && token) {
    const decoded = parseJwt(token);
    if (decoded && decoded.username) {
        currentUsername = decoded.username;
        localStorage.setItem('username', currentUsername);
    }
}
if (!currentUsername || currentUsername === 'Please log in') {
    window.location.href = 'login.html';
}
window.userName = currentUsername;
window.currentUsername = currentUsername; // Make globally accessible
window.token = token; // Make globally accessible

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}
