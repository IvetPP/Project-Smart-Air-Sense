$(document).ready(function () {
    console.log("Edit User Page Loaded");
    
    const API_URL = '/api';
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('id');

    console.log("Target User ID:", userId);

    // 1. Critical Auth Check - If this fails, it might be redirecting you
    if (!token) {
        console.log("No token found, redirecting to login");
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
                console.log("User data received:", user);
                // Supabase fix: check for full_name OR user_name
                $('#name').val(user.full_name || user.user_name || '');
                $('#email').val(user.email || '');
                if (user.created_at) {
                    $('#registration-date').val(user.created_at.split('T')[0]);
                }
            },
            error: function(xhr) {
                console.error("Failed to fetch user:", xhr.status);
                if(xhr.status === 404) {
                    alert("User not found in database.");
                }
            }
        });
    } else {
        console.error("No User ID provided in URL!");
    }

    // 3. Load Devices Dropdown
    $.ajax({
        url: `${API_URL}/devices`,
        headers: { Authorization: 'Bearer ' + token },
        success: function(devices) {
            const $select = $('#add-device');
            $select.empty().append('<option value="">Add device to assigned</option>');
            devices.forEach(d => {
                $select.append(`<option value="${d.device_id}">${d.device_name}</option>`);
            });
        }
    });

    // 4. Form Submission (Save)
    $('#edit-device-form').on('submit', function(e) {
        e.preventDefault(); 
        console.log("Saving changes...");

        const updatedData = {
            full_name: $('#name').val(),
            email: $('#email').val()
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
                alert('Update failed.');
            }
        });
    });

    // 5. Delete Logic
    $('.delete-btn').on('click', function(e) {
        e.preventDefault();
        if(confirm('Delete this user?')) {
            $.ajax({
                url: `${API_URL}/users/${userId}`,
                method: 'DELETE',
                headers: { Authorization: 'Bearer ' + token },
                success: () => window.location.href = 'users.html'
            });
        }
    });

    // 6. Logout Logic
    $('.user').on('click', function() {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = 'login.html';
    });

    // 7. Manual Navigation - Ensure this doesn't point to index.html accidentally
    $('.back, .cancel-btn').on('click', function(e) {
        e.preventDefault();
        console.log("Back/Cancel clicked - heading to users.html");
        window.location.href = 'users.html';
    });
});