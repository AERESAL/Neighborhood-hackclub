// Theme logic and theme switching for dashboard using themes.json
function applyDashboardTheme(theme) {
    // Set background (video or image)
    const backgroundVideo = document.getElementById('backgroundVideo');
    if (theme.background && theme.background.endsWith('.mp4')) {
        backgroundVideo.src = theme.background;
        backgroundVideo.style.display = '';
    } else if (theme.background) {
        // If it's an image, replace video with image
        if (!backgroundVideo._img) {
            const img = document.createElement('img');
            img.id = 'dashboardBgImg';
            img.style.position = 'fixed';
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            img.style.zIndex = '-1';
            backgroundVideo.parentNode.insertBefore(img, backgroundVideo);
            backgroundVideo._img = img;
        }
        backgroundVideo._img.src = theme.background;
        backgroundVideo._img.style.display = '';
        backgroundVideo.style.display = 'none';
    } else {
        backgroundVideo.style.display = '';
        if (backgroundVideo._img) backgroundVideo._img.style.display = 'none';
    }

    // Header and sidebar colors
    const header = document.querySelector('header');
    const sidebar = document.querySelector('aside');
    if (header) {
        header.style.background = theme.color2 || '';
        header.style.color = theme.textColor || '';
        // Set all text elements in header to theme.textColor
        header.querySelectorAll('h1, h2, h3, h4, h5, h6, span, p, a, button, li, div').forEach(el => {
            el.style.color = theme.textColor || '';
        });
    }
    if (sidebar) {
        sidebar.style.background = theme.color2 || '';
        sidebar.style.color = theme.textColor || '';
        // Set all text elements in sidebar to theme.textColor
        sidebar.querySelectorAll('h1, h2, h3, h4, h5, h6, span, p, a, button, li, div').forEach(el => {
            el.style.color = theme.textColor || '';
        });
    }
    // Accent color (for edit button, etc.)
    document.documentElement.style.setProperty('--accent', theme.accents || '#2563eb');
    // Body text color
    document.body.style.color = theme.textColor || '';
    // Set all text elements in main to theme.textColor
    const main = document.querySelector('main');
    if (main) {
        main.querySelectorAll('h1, h2, h3, h4, h5, h6, span, p, a, button, li, div, th, td').forEach(el => {
            el.style.color = theme.textColor || '';
        });
    }
    // Activities and Leaderboard section backgrounds and text
    const activitiesSection = document.getElementById('activitiesSection');
    if (activitiesSection) {
        activitiesSection.style.background = theme.color2 || '';
        activitiesSection.style.color = theme.textColor || '';
        activitiesSection.querySelectorAll('h1, h2, h3, h4, h5, h6, span, p, a, button, li, div, th, td').forEach(el => {
            el.style.color = theme.textColor || '';
        });
    }
    const leaderboardSection = document.getElementById('leaderboardSection');
    if (leaderboardSection) {
        leaderboardSection.style.background = theme.color2 || '';
        leaderboardSection.style.color = theme.textColor || '';
        leaderboardSection.querySelectorAll('h1, h2, h3, h4, h5, h6, span, p, a, button, li, div, th, td, tr').forEach(el => {
            el.style.color = theme.textColor || '';
            el.style.background = 'transparent'; // Remove Tailwind bg override
        });
        // Also update table header backgrounds to match theme.color2
        leaderboardSection.querySelectorAll('th').forEach(th => {
            th.style.background = theme.color2 || '';
        });
        // Remove Tailwind bg-white from tbody/tr/td
        leaderboardSection.querySelectorAll('tbody, tr, td').forEach(el => {
            el.style.background = 'transparent';
        });
    }
    // Also apply theme to posts in dashboard (if any)
    var postsList = document.getElementById('postsList');
    if (postsList) {
        // Use a more robust selector to get all post containers (including dynamic ones)
        postsList.querySelectorAll('.bg-gray-100, [data-post], .post').forEach(function(div) {
            div.style.background = theme.color3 || '';
            div.style.color = theme.textColor || '';
            div.querySelectorAll('*').forEach(function(el) {
                el.style.color = theme.textColor || '';
                el.style.background = 'transparent';
            });
        });
    }
    // Title card (greeting container)
    var greetingCard = document.getElementById('greetingContainer');
    if (greetingCard) {
        // Use theme.color2 for the background, with lighter opacity
        greetingCard.style.background = hexToRgba(theme.color2 || '#ffffff', 0.5); // 50% opacity for lighter look
        greetingCard.style.color = theme.textColor || '';
        greetingCard.style.backdropFilter = 'blur(12px)';
        greetingCard.querySelectorAll('*').forEach(function(el) {
            el.style.color = theme.textColor || '';
        });
    }
    // Widgets
    document.querySelectorAll('.widget').forEach(function(widget) {
        widget.style.background = hexToRgba(theme.color || '#ffffff', 0.5); // Use color 1 with 10% opacity
        widget.style.color = theme.textColor || '';
        widget.style.backdropFilter = 'blur(12px)'; // Stronger blur for glassy look
        widget.querySelectorAll('*').forEach(function(el) {
            el.style.color = theme.textColor || '';
        });
    });
    // After applying the theme, also update SVG icon color
    if (theme && theme.textColor) {
        if (window.applyThemedIcons) window.applyThemedIcons(theme.textColor);
    }
}

function getSelectedThemeFromStorage() {
  let idx = localStorage.getItem('themeIdx');
  if (!idx) return null;
  if (idx.startsWith('backend:')) {
    // Backend theme: normalize structure
    try {
      const theme = JSON.parse(localStorage.getItem('backendTheme'));
      if (theme) {
        return {
          name: theme.name,
          color: theme.color || (theme.colors && theme.colors.color) || '#2563eb',
          color2: theme.color2 || (theme.colors && theme.colors.color2) || '#22d3ee',
          color3: theme.color3 || (theme.colors && theme.colors.color3) || '#e0e0e0',
          accents: theme.accents || (theme.colors && theme.colors.accents) || '#2563eb',
          textColor: theme.textColor || (theme.colors && theme.colors.textColor) || '#000',
          background: theme.background || (theme.colors && theme.colors.background) || '',
        };
      }
    } catch {}
    return null;
  } else {
    // themes.json theme: load from file
    try {
      const themes = window._themesFromJson;
      if (themes && themes[idx]) return themes[idx];
    } catch {}
    return null;
  }
}

function loadAndApplyDashboardTheme() {
  fetch('themes.json')
    .then(res => res.json())
    .then(data => {
      window._themesFromJson = data.themes;
      let theme = getSelectedThemeFromStorage();
      if (!theme) theme = data.themes[0];
      applyDashboardTheme(theme);
    })
    .catch(() => {
      // fallback: do nothing or apply default
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadAndApplyDashboardTheme();
});

// Helper to convert hex/rgb/rgba to rgba with alpha
function hexToRgba(hex, alpha) {
    if (!hex) return '';
    if (hex.startsWith('rgba')) {
        // Replace alpha
        return hex.replace(/rgba\(([^,]+),([^,]+),([^,]+),[^)]+\)/, `rgba($1,$2,$3,${alpha})`);
    }
    if (hex.startsWith('rgb')) {
        // Convert rgb to rgba
        return hex.replace(/rgb\(([^,]+),([^,]+),([^,]+)\)/, `rgba($1,$2,$3,${alpha})`);
    }
    hex = hex.replace('#', '');
    if (hex.length === 3) {
        hex = hex.split('').map(x => x + x).join('');
    }
    var r = parseInt(hex.substring(0,2), 16);
    var g = parseInt(hex.substring(2,4), 16);
    var b = parseInt(hex.substring(4,6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}
