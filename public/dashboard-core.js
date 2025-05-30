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

// Pie chart for widget 3 (approved vs unapproved hours)
function drawHoursPieChart(approved, unapproved) {
    var canvas = document.getElementById('hoursPieChart');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var total = approved + unapproved;
    var center = { x: canvas.width / 2, y: canvas.height / 2 };
    var radius = Math.min(canvas.width, canvas.height) / 2 - 10;
    if (total === 0) {
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = '#e0e0e0';
        ctx.fill();
        ctx.font = '16px sans-serif';
        ctx.fillStyle = '#888';
        ctx.textAlign = 'center';
        ctx.fillText('No Data', center.x, center.y + 6);
        return;
    }
    var startAngle = -0.5 * Math.PI;
    var approvedAngle = (approved / total) * 2 * Math.PI;
    // Approved slice
    ctx.beginPath();
    ctx.moveTo(center.x, center.y);
    ctx.arc(center.x, center.y, radius, startAngle, startAngle + approvedAngle);
    ctx.closePath();
    ctx.fillStyle = '#4ade80'; // green
    ctx.fill();
    // Unapproved slice
    ctx.beginPath();
    ctx.moveTo(center.x, center.y);
    ctx.arc(center.x, center.y, radius, startAngle + approvedAngle, startAngle + 2 * Math.PI);
    ctx.closePath();
    ctx.fillStyle = '#f87171'; // red
    ctx.fill();
    // Remove legend dots from the chart itself
}

// Hook into dashboard data updates
function updatePieChartFromDashboard() {
    var approved = 0, unapproved = 0;
    var approvedEl = document.getElementById('approvedHours');
    var unapprovedEl = document.getElementById('unapprovedHours');
    if (approvedEl && !isNaN(parseInt(approvedEl.textContent))) approved = parseInt(approvedEl.textContent);
    if (unapprovedEl && !isNaN(parseInt(unapprovedEl.textContent))) unapproved = parseInt(unapprovedEl.textContent);
    drawHoursPieChart(approved, unapproved);
}

// Redraw pie chart on dashboard data update
window.updatePieChartFromDashboard = updatePieChartFromDashboard;
document.addEventListener('DOMContentLoaded', function() {
    updatePieChartFromDashboard();
    // Optionally, observe changes to approved/unapproved hours
    var observer = new MutationObserver(updatePieChartFromDashboard);
    var approvedEl = document.getElementById('approvedHours');
    var unapprovedEl = document.getElementById('unapprovedHours');
    if (approvedEl) observer.observe(approvedEl, { childList: true });
    if (unapprovedEl) observer.observe(unapprovedEl, { childList: true });
});
