$(document).ready(function () {
    const API_URL = '/api';
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('id');

    // 1. Auth Check
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // 2. Load User Data
    if (userId) {
        $.ajax({
            url: `${API_URL}/users/${userId}`,
            method: 'GET',
            headers: { Authorization: 'Bearer ' + token },
            success: function(user) {
                // Ensure these IDs match your Supabase column names
                $('#name').val(user.full_name || user.user_name);
                $('#email').val(user.email || '');
                if (user.created_at) {
                    $('#registration-date').val(user.created_at.split('T')[0]);
                }
            },
            error: function() {
                alert("Error loading user data.");
            }
        });
    }

    // 3. Load Devices for Dropdown
    $.ajax({
        url: `${API_URL}/devices`,
        method: 'GET',
        headers: { Authorization: 'Bearer ' + token },
        success: function(devices) {
            const $select = $('#add-device');
            $select.empty().append('<option value="">Add device to assigned</option>');
            devices.forEach(d => {
                $select.append(`<option value="${d.device_id}">${d.device_name}</option>`);
            });
        }
    });

    // 4. Handle Save (Prevent the "weird link" refresh)
    $('#edit-device-form').on('submit', function(e) {
        e.preventDefault(); // This stops the page reload/redirect!

        const updatedData = {
            full_name: $('#name').val(),
            email: $('#email').val(),
            // add other fields as needed for your API
        };

        $.ajax({
            url: `${API_URL}/users/${userId}`,
            method: 'PUT',
            headers: { Authorization: 'Bearer ' + token },
            contentType: 'application/json',
            data: JSON.stringify(updatedData),
            success: function() {
                alert('User updated successfully!');
                window.location.href = 'users.html';
            },
            error: function() {
                alert('Failed to update user.');
            }
        });
    });

    // 5. Delete User
    $('.delete-btn').on('click', function() {
        if(confirm('Are you sure you want to delete this user?')) {
            $.ajax({
                url: `${API_URL}/users/${userId}`,
                method: 'DELETE',
                headers: { Authorization: 'Bearer ' + token },
                success: () => {
                    window.location.href = 'users.html';
                },
                error: () => alert("Error deleting user.")
            });
        }
    });

    // 6. Log out functionality
    $('.user').on('click', function() {
        if(confirm('Do you want to log out?')) {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = 'login.html';
        }
    });

    // 7. Navigation
    $('.back, .cancel-btn').on('click', function() {
        window.location.href = 'users.html';
    });
});