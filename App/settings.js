document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html'; // Redirect to login if no token
        return;
    }

    // Fetch user details and populate the form
    try {
        const response = await fetch('http://localhost:5000/user', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user details');
        }

        const user = await response.json();
        document.getElementById('name').value = user.name;
        document.getElementById('email').value = user.email;
    } catch (error) {
        console.error(error);
        window.location.href = 'index.html'; // Redirect to login on error
    }

    // Handle form submission
    document.getElementById('settings-form').addEventListener('submit', async (event) => {
        event.preventDefault();

        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const profilePicture = document.getElementById('profile-picture').files[0];

        const formData = new FormData();
        formData.append('name', name);
        formData.append('email', email);
        if (profilePicture) {
            formData.append('profilePicture', profilePicture);
        }

        try {
            const response = await fetch('http://localhost:5000/settings', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to update user details');
            }

            alert('Settings updated successfully!');
            window.location.href = 'home.html'; // Redirect back to home
        } catch (error) {
            console.error(error);
            alert('An error occurred while updating settings.');
        }
    });
});