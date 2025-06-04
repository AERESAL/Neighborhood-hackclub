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
    activitiesList.innerHTML = '<div class="text-gray-400 text-center py-8">No activities found.</div>';
    return;
  }

  let html = '<ul class="flex flex-col gap-4">';
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
    // Ensure approved property is always boolean
    const isApproved = typeof act.approved === 'boolean' ? act.approved : false;
    if (isApproved) {
      approvedHours += hours;
      approvedActivities++;
    } else {
      unapprovedHours += hours;
      unapprovedActivities++;
    }
    html += `
      <li class="bg-white rounded-xl shadow-md px-4 py-3 flex flex-col gap-1 border border-gray-100 relative">
        <div class="flex items-center gap-2 mb-1">
          <span class="inline-flex items-center justify-center w-8 h-8 rounded-full ${isApproved ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}">
            ${isApproved ? '<svg xmlns=\'http://www.w3.org/2000/svg\' class=\'w-5 h-5\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'currentColor\'><path stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M5 13l4 4L19 7\' /></svg>' : '<svg xmlns=\'http://www.w3.org/2000/svg\' class=\'w-5 h-5\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'currentColor\'><path stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M12 8v4l3 3\' /></svg>'}
          </span>
          <span class="font-semibold text-base text-gray-800">${act.name || act.title}</span>
          <span class="ml-auto text-xs px-2 py-1 rounded ${isApproved ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}">${isApproved ? 'Approved' : 'Unapproved'}</span>
        </div>
        <div class="text-sm text-gray-600 flex flex-wrap gap-2 items-center">
          <span><svg class="inline w-4 h-4 mr-1 text-blue-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg> ${act.date}</span>
          <span><svg class="inline w-4 h-4 mr-1 text-purple-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3"/></svg> ${act.start_time || ''} - ${act.end_time || ''}</span>
          <span><svg class="inline w-4 h-4 mr-1 text-pink-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 12.414a2 2 0 00-2.828 0l-4.243 4.243"/></svg> ${act.location || act.place || ''}</span>
        </div>
        <div class="text-xs text-gray-500 mt-1">Supervisor: ${act.supervisorName || ''} (${act.supervisorEmail || ''})</div>
        <div class="text-xs text-gray-500">Hours: ${hours.toFixed(2)}</div>
        <div class="absolute top-2 right-2 flex gap-1">
          <button class="activity-options-btn p-1 rounded hover:bg-gray-100" title="Options">
            <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' fill='currentColor' viewBox='0 0 20 20'><circle cx='4' cy='10' r='2'/><circle cx='10' cy='10' r='2'/><circle cx='16' cy='10' r='2'/></svg>
          </button>
          <div class="activity-options-menu hidden absolute right-0 top-8 bg-white border rounded shadow z-10 min-w-[140px]">
            <button class="delete-activity-btn block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100" data-id="${act.id || ''}">Delete</button>
            <button class="request-signature-btn block w-full text-left px-4 py-2 text-blue-600 hover:bg-gray-100" data-id="${act.id || ''}" data-title="${encodeURIComponent(act.name || act.title || '')}" data-email="${encodeURIComponent(act.supervisorEmail || '')}">Request Signature</button>
          </div>
        </div>
      </li>`;
  });
  html += '</ul>';
  activitiesList.innerHTML = html;
  // document.getElementById('printActivitiesBtn').style.display = 'inline-block';
  if (document.getElementById('approvedHours')) document.getElementById('approvedHours').textContent = approvedHours;
  if (document.getElementById('unapprovedHours')) document.getElementById('unapprovedHours').textContent = unapprovedHours;
  if (document.getElementById('approvedActivities')) document.getElementById('approvedActivities').textContent = approvedActivities;
  if (document.getElementById('unapprovedActivities')) document.getElementById('unapprovedActivities').textContent = unapprovedActivities;

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
      if (!id) return alert('Missing activity ID.');
      // Find the full activity object by id
      const activity = activities.find(a => (a.id || '') === id);
      if (!activity) return alert('Could not find activity details.');
      // Prepare the required fields for the signature request
      const reqBody = {
        name: activity.name || activity.title || '',
        date: activity.date || '',
        start_time: activity.start_time || '',
        end_time: activity.end_time || '',
        location: activity.location || activity.place || '',
        supervisorName: activity.supervisorName || '',
        supervisorEmail: activity.supervisorEmail || ''
      };
      // Validate required fields
      if (!reqBody.name || !reqBody.date || !reqBody.start_time || !reqBody.end_time || !reqBody.location || !reqBody.supervisorName || !reqBody.supervisorEmail) {
        return alert('Missing required activity fields for signature request.');
      }
      try {
        const res = await fetch(`${API_URL}/send-signature-request`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${window.token}`
          },
          body: JSON.stringify(reqBody)
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


