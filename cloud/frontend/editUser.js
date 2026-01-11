$(document).ready(function () {
    const API_URL = window.location.origin + '/api';
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('id');

    // --- 1. Auth & Log Out ---
    if (!token) { 
        window.location.href = 'login.html'; 
        return; 
    }

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        $('.user').text((payload.user_name || "LOG OUT").substring(0, 10).toUpperCase());
    } catch (e) { 
        console.error("Token parsing failed"); 
    }

    $('.user').on('click', function() { 
        if(confirm('Do you want to log out?')) { 
            localStorage.clear(); 
            window.location.href = 'login.html'; 
        }
    });

    // Check if ID exists before trying to fetch
    if (!userId) { 
        alert("Error: No User ID provided in the URL.");
        window.location.href = 'users.html'; 
        return; 
    }

    // --- 2. Load User Data (GET) ---
    function loadUser() {
        $.ajax({
            url: `${API_URL}/users/${encodeURIComponent(userId)}`,
            method: 'GET',
            headers: { Authorization: 'Bearer ' + token },
            success: function(user) {
                // Check common field name variations from your server
                const displayName = user.full_name || user.user_name || user.name || "";
                const displayEmail = user.email || "";

                $('#full-name').attr('placeholder', displayName);
                $('#email').attr('placeholder', displayEmail);
                
                // Keep values empty so placeholders are visible
                $('#full-name').val('');
                $('#email').val('');
            },
            error: function(xhr) {
                // Log the actual server response to help you debug
                console.error("Server Response Code:", xhr.status);
                console.error("Server Error Detail:", xhr.responseJSON);
                
                if (xhr.status === 404) {
                    alert("User not found (404). Check if the ID in the URL is correct.");
                } else if (xhr.status === 401 || xhr.status === 403) {
                    alert("Session expired or permission denied. Please log in again.");
                } else {
                    alert("Error loading user data. Check console (F12) for details.");
                }
            }
        });
    }

    // --- 3. Save Changes (PUT) ---
    $('#edit-user-form').on('submit', function (e) {
        e.preventDefault();

        const nameVal = $('#full-name').val().trim();
        const emailVal = $('#email').val().trim();
        const passVal = $('#password-input').val().trim();

        // Build payload only with changed fields
        const payload = {};
        if (nameVal !== "") payload.full_name = nameVal;
        if (emailVal !== "") payload.email = emailVal;
        if (passVal !== "") payload.password = passVal;

        if (Object.keys(payload).length === 0) {
            alert("No changes entered.");
            return;
        }

        $.ajax({
            url: `${API_URL}/users/${encodeURIComponent(userId)}`,
            method: 'PUT',
            headers: { 
                Authorization: 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(payload),
            success: function() {
                alert('User updated successfully!');
                window.location.href = 'users.html';
            },
            error: function(xhr) {
                alert('Update failed: ' + (xhr.responseJSON?.error || 'Server error'));
            }
        });
    });

    // --- 4. Delete & Navigation ---
    $('.delete-btn').on('click', function() {
        if(confirm('Are you sure you want to delete this user?')) {
            $.ajax({
                url: `${API_URL}/users/${encodeURIComponent(userId)}`,
                method: 'DELETE',
                headers: { Authorization: 'Bearer ' + token },
                success: () => { window.location.href = 'users.html'; },
                error: (xhr) => alert('Delete failed: ' + (xhr.responseJSON?.error || 'Server error'))
            });
        }
    });

    $('.back, .cancel-btn').on('click', () => window.location.href = 'users.html');

    loadUser();
});