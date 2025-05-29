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
    }
    if (sidebar) {
        sidebar.style.background = theme.color2 || '';
        sidebar.style.color = theme.textColor || '';
    }
    // Accent color (for edit button, etc.)
    document.documentElement.style.setProperty('--accent', theme.accents || '#2563eb');
    // Body text color
    document.body.style.color = theme.textColor || '';

    // After applying the theme, also update SVG icon color
    if (theme && theme.textColor) {
        if (window.applyThemedIcons) window.applyThemedIcons(theme.textColor);
    }
}

function loadAndApplyDashboardTheme() {
    fetch('themes.json')
        .then(res => res.json())
        .then(data => {
            const themes = data.themes;
            let idx = localStorage.getItem('themeIdx');
            if (!idx || !themes[idx]) idx = 0;
            applyDashboardTheme(themes[idx]);
        })
        .catch(() => {
            // fallback: do nothing or apply default
        });
}

document.addEventListener('DOMContentLoaded', () => {
    loadAndApplyDashboardTheme();
});
