$(document).ready(function () {
    const API_URL = window.location.origin + '/api';
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('id');

    if (!token) { window.location.href = 'login.html'; return; }

    // Log Out Logic
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        $('.user').text((payload.user_name || "LOG OUT").substring(0, 10).toUpperCase());
    } catch (e) { console.error("Token parsing failed"); }

    $('.user').on('click', function() { 
        if(confirm('Do you want to log out?')) { 
            localStorage.clear(); 
            window.location.href = 'login.html'; 
        }
    });

    if (!userId) { window.location.href = 'users.html'; return; }

    // --- NEW: Load Available Devices into "Add Device" Dropdown ---
    function loadAvailableDevices() {
        $.ajax({
            url: `${API_URL}/devices`,
            method: 'GET',
            headers: { Authorization: 'Bearer ' + token },
            success: function(devices) {
                const $dropdown = $('#add-device');
                $dropdown.empty().append('<option value="">Add device to be assigned</option>');
                devices.forEach(device => {
                    $dropdown.append(`<option value="${device.id}">${device.device_name || 'Device ' + device.id}</option>`);
                });
            }
        });
    }

    // --- NEW: Load Devices already assigned to this user ---
    function loadAssignedDevices() {
        $.ajax({
            url: `${API_URL}/devices/assigned/${userId}`,
            method: 'GET',
            headers: { Authorization: 'Bearer ' + token },
            success: function(devices) {
                const $list = $('#assigned-device');
                $list.empty().append('<option value="">Assigned Device List</option>');
                devices.forEach(d => {
                    $list.append(`<option value="${d.device_id}">${d.device_name || 'Assigned Device'}</option>`);
                });
            }
        });
    }

    // --- NEW: Handle Assignment Logic ---
    $('#add-device').on('change', function() {
        const deviceId = $(this).val();
        if (!deviceId) return;

        if (confirm('Assign this device to the user?')) {
            $.ajax({
                url: `${API_URL}/devices/assign`,
                method: 'POST',
                headers: { 
                    Authorization: 'Bearer ' + token,
                    'Content-Type': 'application/json' 
                },
                data: JSON.stringify({ device_id: deviceId, user_id: userId }),
                success: function() {
                    alert('Device assigned successfully!');
                    loadAssignedDevices(); // Refresh the list
                    $('#add-device').val(''); // Reset dropdown
                },
                error: (xhr) => alert('Error: ' + (xhr.responseJSON?.error || 'Failed to assign'))
            });
        }
    });

    // Load User into Placeholders
    function loadUser() {
        $.ajax({
            url: `${API_URL}/users/${encodeURIComponent(userId)}`,
            method: 'GET',
            headers: { Authorization: 'Bearer ' + token },
            success: function(user) {
                $('#full-name').attr('placeholder', user.full_name || 'Full Name');
                $('#email').attr('placeholder', user.email || 'Email');
                $('#full-name, #email, #password-input').val('');
            },
            error: function(xhr) {
                alert('Error ' + xhr.status + ': ' + (xhr.responseJSON?.error || 'User not found'));
            }
        });
    }

    // Save Changes (Profile Info)
    $('#edit-user-form').on('submit', function (e) {
        e.preventDefault();
        const payload = {};
        const name = $('#full-name').val().trim();
        const email = $('#email').val().trim();
        const pass = $('#password-input').val().trim();

        if (name) payload.full_name = name;
        if (email) payload.email = email;
        if (pass) payload.password = pass;

        if (Object.keys(payload).length === 0) {
            alert("No changes entered.");
            return;
        }

        $.ajax({
            url: `${API_URL}/users/${encodeURIComponent(userId)}`,
            method: 'PUT',
            headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
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

    // Delete User
    $('.delete-btn').on('click', function() {
        if(confirm('Are you sure you want to delete this user?')) {
            $.ajax({
                url: `${API_URL}/users/${encodeURIComponent(userId)}`,
                method: 'DELETE',
                headers: { Authorization: 'Bearer ' + token },
                success: () => window.location.href = 'users.html'
            });
        }
    });

    $('.back, .cancel-btn').on('click', () => window.location.href = 'users.html');

    // Initialize Page
    loadUser();
    loadAvailableDevices();
    loadAssignedDevices();
});