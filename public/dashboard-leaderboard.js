// Leaderboard fetching and rendering for dashboard
const globalLeaderboardBtn = document.getElementById('globalLeaderboardBtn');
const friendsLeaderboardBtn = document.getElementById('friendsLeaderboardBtn');
const localLeaderboardBtn = document.getElementById('localLeaderboardBtn');
let currentLeaderboard = 'global';

async function fetchAndRenderLeaderboard(type = 'global') {
  const leaderboardBody = document.getElementById('leaderboardBody');
  const leaderboardStatus = document.getElementById('leaderboardStatus');
  leaderboardBody.innerHTML = '<tr><td colspan="4" class="text-center text-gray-400 py-4">Loading...</td></tr>';
  leaderboardStatus.textContent = '';
  let url = `${API_URL}/leaderboard`;
  if (type === 'friends') url = `${API_URL}/leaderboard/friends`;
  if (type === 'local') url = `${API_URL}/leaderboard/local`;
  try {
    const res = await fetch(url, {
      credentials: 'include'
    });
    if (!res.ok) throw new Error('Failed to fetch leaderboard');
    const data = await res.json();
    const leaderboard = data.leaderboard || [];
    if (leaderboard.length === 0) {
      leaderboardBody.innerHTML = '<tr><td colspan="4" class="text-center text-gray-400 py-4">No data.</td></tr>';
      return;
    }
    leaderboardBody.innerHTML = leaderboard.map((entry, idx) => `
      <tr>
        <td class="px-6 py-4">${idx + 1}</td>
        <td class="px-6 py-4">${entry.displayName || entry.username}</td>
        <td class="px-6 py-4">${entry.approvedHours}</td>
        <td class="px-6 py-4">${entry.unapprovedHours}</td>
      </tr>
    `).join('');
  } catch (err) {
    leaderboardBody.innerHTML = '<tr><td colspan="4" class="text-center text-red-400 py-4">Error loading leaderboard.</td></tr>';
  }
}

// Expose a function to render leaderboard into any tbody
window.renderLeaderboardTable = function(tbody, leaderboard) {
  if (!tbody) return;
  if (!leaderboard || !leaderboard.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-gray-400 py-4">No data.</td></tr>';
    return;
  }
  tbody.innerHTML = leaderboard.map((entry, idx) => `
    <tr>
      <td class="px-6 py-4">${idx + 1}</td>
      <td class="px-6 py-4">${entry.displayName || entry.username || entry.name || ''}</td>
      <td class="px-6 py-4">${entry.approvedHours ?? entry.approved ?? ''}</td>
      <td class="px-6 py-4">${entry.unapprovedHours ?? entry.unapproved ?? ''}</td>
    </tr>
  `).join('');
}

globalLeaderboardBtn.addEventListener('click', () => {
  currentLeaderboard = 'global';
  globalLeaderboardBtn.classList.add('bg-blue-600');
  globalLeaderboardBtn.classList.remove('bg-gray-400');
  friendsLeaderboardBtn.classList.remove('bg-blue-600');
  friendsLeaderboardBtn.classList.add('bg-gray-400');
  localLeaderboardBtn.classList.remove('bg-blue-600');
  localLeaderboardBtn.classList.add('bg-gray-400');
  fetchAndRenderLeaderboard('global');
});
friendsLeaderboardBtn.addEventListener('click', () => {
  currentLeaderboard = 'friends';
  friendsLeaderboardBtn.classList.add('bg-blue-600');
  friendsLeaderboardBtn.classList.remove('bg-gray-400');
  globalLeaderboardBtn.classList.remove('bg-blue-600');
  globalLeaderboardBtn.classList.add('bg-gray-400');
  localLeaderboardBtn.classList.remove('bg-blue-600');
  localLeaderboardBtn.classList.add('bg-gray-400');
  fetchAndRenderLeaderboard('friends');
});
localLeaderboardBtn.addEventListener('click', () => {
  currentLeaderboard = 'local';
  localLeaderboardBtn.classList.add('bg-blue-600');
  localLeaderboardBtn.classList.remove('bg-gray-400');
  globalLeaderboardBtn.classList.remove('bg-blue-600');
  globalLeaderboardBtn.classList.add('bg-gray-400');
  friendsLeaderboardBtn.classList.remove('bg-blue-600');
  friendsLeaderboardBtn.classList.add('bg-gray-400');
  fetchAndRenderLeaderboard('local');
});
// Fetch leaderboard on page load
document.addEventListener('DOMContentLoaded', () => fetchAndRenderLeaderboard('global'));
