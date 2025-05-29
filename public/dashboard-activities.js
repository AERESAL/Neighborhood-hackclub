// Activities CRUD, rendering, and widgets for dashboard
const API_URL_LOCAL = "http://localhost:3000";
const API_URL_PROD = "https://neighborhood-liard.vercel.app";
const API_URL = (window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost")
  ? API_URL_LOCAL
  : API_URL_PROD;

let lastToken = window.token || localStorage.getItem('token');

async function fetchAndRenderActivities() {
  if (!window.currentUsername || !lastToken) return;
  const activitiesList = document.getElementById('activitiesList');
  activitiesList.innerHTML = '<div class="text-gray-500">Loading...</div>';
  try {
    const res = await fetch(`${API_URL}/activities/${window.currentUsername}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${lastToken}`,
        'Accept': 'application/json'
      },
      credentials: 'include'
    });
    const data = await res.json();
    const activities = data.activities || [];
    renderActivitiesSection(activities);
  } catch {
    activitiesList.innerHTML = '<div class="text-red-500">Could not load activities.</div>';
  }
}

function renderActivitiesSection(activities) {
  const activitiesList = document.getElementById('activitiesList');
  let approvedHours = 0;
  let unapprovedHours = 0;
  let approvedActivities = 0;
  let unapprovedActivities = 0;

  if (!activities || activities.length === 0) {
    activitiesList.innerHTML = '<div class="text-gray-400">No activities found.</div>';
    document.getElementById('printActivitiesBtn').style.display = 'none';
    document.getElementById('approvedHours').textContent = 0;
    document.getElementById('unapprovedHours').textContent = 0;
    document.getElementById('approvedActivities').textContent = 0;
    document.getElementById('unapprovedActivities').textContent = 0;
    return;
  }

  let html = '<ul class="space-y-4">';
  activities.forEach(act => {
    // Calculate hours
    let hours = 0;
    if (act.start_time && act.end_time) {
      const start = act.start_time.length === 5 ? act.start_time+':00' : act.start_time;
      const end = act.end_time.length === 5 ? act.end_time+':00' : act.end_time;
      const startDate = new Date(`1970-01-01T${start}Z`);
      const endDate = new Date(`1970-01-01T${end}Z`);
      hours = (endDate - startDate) / (1000 * 60 * 60);
      if (hours < 0) hours += 24; // handle overnight
    }
    if (act.approved) {
      approvedHours += hours;
      approvedActivities++;
    } else {
      unapprovedHours += hours;
      unapprovedActivities++;
    }
    html += `<li class="border-b pb-2 relative group">
      <b>${act.name || act.title}</b> (${act.date})<br>
      ${act.start_time || ''} - ${act.end_time || ''} @ ${act.location || act.place || ''}<br>
      Supervisor: ${act.supervisorName || ''} (${act.supervisorEmail || ''})<br>
      Status: <span class="${act.approved ? 'text-green-600' : 'text-yellow-600'}">${act.approved ? 'Approved' : 'Unapproved'}</span>
      <button class="activity-options-btn absolute top-2 right-2 opacity-70 group-hover:opacity-100 p-1 rounded hover:bg-gray-200" title="Options">
        <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' fill='currentColor' viewBox='0 0 20 20'><circle cx='4' cy='10' r='2'/><circle cx='10' cy='10' r='2'/><circle cx='16' cy='10' r='2'/></svg>
      </button>
      <div class="activity-options-menu hidden absolute right-8 top-2 bg-white border rounded shadow z-10 min-w-[140px]">
        <button class="delete-activity-btn block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100" data-id="${act.id || ''}">Delete</button>
        <button class="request-signature-btn block w-full text-left px-4 py-2 text-blue-600 hover:bg-gray-100" data-id="${act.id || ''}" data-title="${encodeURIComponent(act.name || act.title || '')}" data-email="${encodeURIComponent(act.supervisorEmail || '')}">Request Signature</button>
      </div>
    </li>`;
  });
  html += '</ul>';
  activitiesList.innerHTML = html;
  document.getElementById('printActivitiesBtn').style.display = 'inline-block';
  document.getElementById('approvedHours').textContent = approvedHours;
  document.getElementById('unapprovedHours').textContent = unapprovedHours;
  document.getElementById('approvedActivities').textContent = approvedActivities;
  document.getElementById('unapprovedActivities').textContent = unapprovedActivities;

  // Options menu logic
  document.querySelectorAll('.activity-options-btn').forEach((btn, idx) => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      document.querySelectorAll('.activity-options-menu').forEach((menu, mIdx) => {
        if (mIdx !== idx) menu.classList.add('hidden');
      });
      const menu = btn.nextElementSibling;
      menu.classList.toggle('hidden');
    });
  });
  document.addEventListener('click', function() {
    document.querySelectorAll('.activity-options-menu').forEach(menu => menu.classList.add('hidden'));
  });

  // Attach delete and request signature handlers
  document.querySelectorAll('.delete-activity-btn').forEach(btn => {
    btn.addEventListener('click', async function(e) {
      e.stopPropagation();
      const id = this.getAttribute('data-id');
      if (!id) return alert('Activity ID missing.');
      if (!confirm('Are you sure you want to delete this activity?')) return;
      try {
        const res = await fetch(`${API_URL}/activities/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${window.token}` },
        });
        if (res.ok) {
          fetchAndRenderActivities();
        } else {
          alert('Failed to delete activity.');
        }
      } catch {
        alert('Error deleting activity.');
      }
    });
  });
  document.querySelectorAll('.request-signature-btn').forEach(btn => {
    btn.addEventListener('click', async function(e) {
      e.stopPropagation();
      const id = this.getAttribute('data-id');
      const title = decodeURIComponent(this.getAttribute('data-title'));
      const email = decodeURIComponent(this.getAttribute('data-email'));
      if (!id || !email) return alert('Missing activity or supervisor email.');
      try {
        const res = await fetch(`${API_URL}/send-signature-request`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${window.token}`
          },
          body: JSON.stringify({ id, title, supervisorEmail: email, username: window.currentUsername })
        });
        const data = await res.json();
        if (res.ok) {
          alert('Signature request sent!');
        } else {
          alert('Failed to send signature request: ' + (data.message || 'Unknown error'));
        }
      } catch {
        alert('Error sending signature request.');
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  fetchAndRenderActivities();
  // ...call updateApprovedWidget, updateUnapprovedWidget, etc...
});

document.addEventListener('DOMContentLoaded', function() {
  // Add Activity Modal logic
  const addActivityBtn = document.getElementById('addActivityBtn');
  const activityModal = document.getElementById('activityModal');
  const closeActivityModal = document.getElementById('closeActivityModal');
  const cancelAddActivity = document.getElementById('cancelAddActivity');

  if (addActivityBtn && activityModal) {
    addActivityBtn.addEventListener('click', function() {
      activityModal.classList.remove('hidden');
    });
  }
  if (closeActivityModal && activityModal) {
    closeActivityModal.addEventListener('click', function() {
      activityModal.classList.add('hidden');
    });
  }
  if (cancelAddActivity && activityModal) {
    cancelAddActivity.addEventListener('click', function() {
      activityModal.classList.add('hidden');
    });
  }

  // Add Activity Form submit handler
  const addActivityForm = document.getElementById('addActivityForm');
  const activityStatus = document.getElementById('activityStatus');
  if (addActivityForm) {
    addActivityForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      let lastToken = window.token || localStorage.getItem('token');
      let currentUsername = window.currentUsername || localStorage.getItem('username');
      if (!lastToken) {
        activityStatus.textContent = 'You must be logged in to add an activity.';
        activityStatus.style.color = '#e74c3c';
        return;
      }
      const activity = {
        name: document.getElementById('activityTitle').value.trim(),
        date: document.getElementById('activityDate').value,
        start_time: document.getElementById('activityStartTime').value,
        end_time: document.getElementById('activityEndTime').value,
        location: document.getElementById('activityPlace').value.trim(),
        supervisorName: document.getElementById('supervisorName').value.trim(),
        supervisorEmail: document.getElementById('supervisorEmail').value.trim()
      };
      if (!activity.name || !activity.date || !activity.start_time || !activity.end_time || !activity.location || !activity.supervisorName || !activity.supervisorEmail) {
        activityStatus.textContent = 'Please fill in all activity fields.';
        activityStatus.style.color = '#e74c3c';
        return;
      }
      try {
        const response = await fetch(`${API_URL}/activities`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${lastToken}`
          },
          body: JSON.stringify(activity)
        });
        const data = await response.json();
        if (!response.ok) {
          activityStatus.textContent = `Error: ${data.message || 'Could not add activity.'}`;
          activityStatus.style.color = '#e74c3c';
        } else {
          // If get signature is checked, send email
          const getSignature = document.getElementById('getSignatureCheckbox')?.checked;
          if (getSignature) {
            try {
              const sigRes = await fetch(`${API_URL}/send-signature-request`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${lastToken}`
                },
                body: JSON.stringify(activity)
              });
              const sigData = await sigRes.json();
              if (!sigRes.ok) {
                activityStatus.textContent = `Activity added, but failed to send signature email: ${sigData.message}`;
                activityStatus.style.color = '#e74c3c';
              } else {
                activityStatus.textContent = 'Activity added and signature request sent!';
                activityStatus.style.color = '#27ae60';
              }
            } catch (err) {
              activityStatus.textContent = 'Activity added, but error sending signature email.';
              activityStatus.style.color = '#e74c3c';
            }
          } else {
            activityStatus.textContent = 'Activity added successfully!';
            activityStatus.style.color = '#27ae60';
          }
          addActivityForm.reset();
          activityModal.classList.add('hidden');
          fetchAndRenderActivities();
        }
      } catch (error) {
        activityStatus.textContent = 'An unexpected error occurred.';
        activityStatus.style.color = '#e74c3c';
      }
    });
  }
});
