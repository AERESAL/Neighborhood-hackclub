// UI interactions for dashboard (modals, sidebar, profile menu, drag/resize, etc.)
function toggleMenu() {
    const menu = document.getElementById("profileMenu");
    menu.classList.toggle("hidden");
}

document.addEventListener('click', function(e) {
    const settingsMenu = document.getElementById('settingsMenu');
    if (settingsMenu && !settingsMenu.classList.contains('hidden')) {
        if (!settingsMenu.contains(e.target) && e.target.textContent !== 'Settings') {
            settingsMenu.classList.add('hidden');
        }
    }
});

// Widget drag & resize logic
function setupWidgetDragResize() {
    const container = document.getElementById("container");
    if (!container) return;
    let activeWidget = null;
    let offsetX = 0, offsetY = 0, startX = 0, startY = 0;
    let isDragging = false;
    let isResizing = false;
    let startWidth = 0, startHeight = 0;

    // Ensure all widgets have a .corner-br element for resizing
    Array.from(container.getElementsByClassName('widget')).forEach(widget => {
        if (!widget.querySelector('.corner-br')) {
            const corner = document.createElement('div');
            corner.className = 'corner-br';
            corner.style.position = 'absolute';
            corner.style.right = '0';
            corner.style.bottom = '0';
            corner.style.width = '16px';
            corner.style.height = '16px';
            corner.style.cursor = 'nwse-resize';
            corner.style.zIndex = '10';
            widget.appendChild(corner);
        }
        widget.style.position = 'absolute'; // Ensure widgets are absolutely positioned
    });

    // Remove all previous listeners to avoid duplicates
    Array.from(container.getElementsByClassName('widget')).forEach(widget => {
        const corner = widget.querySelector('.corner-br');
        corner.onmousedown = null;
        widget.onmousedown = null;
    });

    // --- Only one global mousedown handler for the container ---
    let resizingWidget = null;
    let draggingWidget = null;
    let dragOffsetX = 0, dragOffsetY = 0;
    let resizeStartX = 0, resizeStartY = 0, resizeStartWidth = 0, resizeStartHeight = 0;

    container.addEventListener('mousedown', function(e) {
        if (!container.classList.contains('editing')) return;
        const widget = e.target.closest('.widget');
        if (!widget) return;
        if (e.target.classList.contains('corner-br')) {
            // Start resizing
            resizingWidget = widget;
            const rect = widget.getBoundingClientRect();
            resizeStartX = e.clientX;
            resizeStartY = e.clientY;
            resizeStartWidth = rect.width;
            resizeStartHeight = rect.height;
            widget.style.zIndex = 1000;
            document.body.style.userSelect = 'none';
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        // Only start dragging if not on resize handle
        draggingWidget = widget;
        const rect = widget.getBoundingClientRect();
        dragOffsetX = e.clientX - rect.left;
        dragOffsetY = e.clientY - rect.top;
        widget.style.zIndex = 1000;
        document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', function(e) {
        if (resizingWidget) {
            // Calculate new width/height relative to the widget's parent (container)
            const containerRect = container.getBoundingClientRect();
            const widgetRect = resizingWidget.getBoundingClientRect();
            let newWidth = resizeStartWidth + (e.clientX - resizeStartX);
            let newHeight = resizeStartHeight + (e.clientY - resizeStartY);
            // Prevent widget from overflowing container on the right/bottom
            const maxWidth = containerRect.right - widgetRect.left;
            const maxHeight = containerRect.bottom - widgetRect.top;
            newWidth = Math.max(180, Math.min(newWidth, maxWidth));
            newHeight = Math.max(120, Math.min(newHeight, maxHeight));
            resizingWidget.style.width = newWidth + 'px';
            resizingWidget.style.height = newHeight + 'px';
            return;
        }
        if (draggingWidget) {
            let x = e.clientX - dragOffsetX - container.getBoundingClientRect().left;
            let y = e.clientY - dragOffsetY - container.getBoundingClientRect().top;
            x = Math.max(0, Math.min(x, container.offsetWidth - draggingWidget.offsetWidth));
            y = Math.max(0, Math.min(y, container.offsetHeight - draggingWidget.offsetHeight));
            draggingWidget.style.left = x + 'px';
            draggingWidget.style.top = y + 'px';
            draggingWidget.style.right = '';
            draggingWidget.style.bottom = '';
        }
    });

    document.addEventListener('mouseup', function() {
        if (draggingWidget) draggingWidget.style.zIndex = '';
        if (resizingWidget) resizingWidget.style.zIndex = '';
        draggingWidget = null;
        resizingWidget = null;
        document.body.style.userSelect = '';
    });

    // Prevent drag when mousedown is on the resize handle (bottom-right corner)
    Array.from(container.getElementsByClassName('widget')).forEach(widget => {
        widget.addEventListener('mousedown', (event) => {
            if (!container.classList.contains('editing')) return;
            // If mouse is on the resize handle (bottom-right corner), don't allow move
            if (event.offsetX > widget.clientWidth - 20 && event.offsetY > widget.clientHeight - 20) {
                event.stopPropagation();
            }
        });
    });
}

// Widget edit mode logic
function setupWidgetEditButton() {
    const editButton = document.getElementById('editButton');
    const container = document.getElementById('container');
    if (!editButton || !container) return;
    let editing = false;
    editButton.addEventListener('click', function() {
        editing = !editing;
        if (editing) {
            container.classList.add('editing');
            editButton.title = 'Exit Edit Mode';
            editButton.classList.add('bg-yellow-500');
        } else {
            container.classList.remove('editing');
            editButton.title = 'Edit Widgets';
            editButton.classList.remove('bg-yellow-500');
        }
    });
}

function setGreetingAndDate() {
    const greetingEl = document.getElementById('greeting');
    const dateEl = document.getElementById('currentDate');
    if (greetingEl) {
        const hour = new Date().getHours();
        let greeting = 'Hello';
        if (hour < 12) greeting = 'Good morning';
        else if (hour < 18) greeting = 'Good afternoon';
        else greeting = 'Good evening';
        const name = window.currentUsername || localStorage.getItem('username') || '';
        greetingEl.textContent = name ? `${greeting}, ${name}!` : greeting + '!';
    }
    if (dateEl) {
        const now = new Date();
        dateEl.textContent = now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setupWidgetDragResize();
    setGreetingAndDate();
    setupWidgetEditButton();
    // Sidebar settings and print button functionality
    document.getElementById('sidebarSettingsBtn').onclick = function() {
        window.location.href = 'settings.html';
    };
    document.getElementById('sidebarPrintBtn').onclick = function() {
        document.getElementById('printActivitiesBtn').click();
    };
    // Log Out button functionality
    const logoutBtn = document.querySelector('#profileMenu button');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        });
    }
    document.getElementById('profileMenu').addEventListener('click', function(e) {
        if (e.target.matches('#profileMenu .text-red-600')) {
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        }
    });
});
