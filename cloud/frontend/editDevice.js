$(document).ready(function () {
    console.log("Edit Device script initialized for Render...");

    // 1. Configuration (Relative path for same-origin deployment)
    const API_URL = window.location.origin + '/api/devices'; 
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const params = new URLSearchParams(window.location.search);
    const deviceId = params.get('id');

    if (!token) { window.location.href = 'login.html'; return; }
    if (!deviceId) { window.location.href = 'index.html'; return; }

    // Dynamic Username logic (match Add Device)
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        $('.user').text((payload.user_name || "LOG OUT").substring(0, 10).toUpperCase());
    } catch (e) { 
        console.error("Token parsing failed"); 
    }

    // 1. Fetch existing data
    $.ajax({
        url: `${API_URL}/devices/${encodeURIComponent(deviceId)}`,
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token },
        success: function(dev) {
            $('#device-id').val(dev.device_id);
            $('#device-name').val(dev.device_name || '');
            $('#device-type').val(dev.device_type || '');
            $('#device-location').val(dev.location || '');
            // Store registration date to send back during Save
            $('#registration-date').val(dev.registration_date || '');
        },
        error: (xhr) => {
            alert("Could not fetch device data.");
            window.location.href = 'index.html';
        }
    });

    // 2. Save Logic (PUT)
    $('#edit-device-form').on('submit', function (e) {
        e.preventDefault();
        const payload = {
            device_name: $('#device-name').val().trim(),
            device_type: $('#device-type').val().trim(),
            location: $('#device-location').val().trim(),
            registration_date: $('#registration-date').val() 
        };

        $.ajax({
            url: `${API_URL}/devices/${encodeURIComponent(deviceId)}`,
            method: 'PUT',
            headers: { 
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json' 
            },
            data: JSON.stringify(payload),
            success: () => {
                alert('Device updated successfully!');
                window.location.href = 'index.html';
            },
            error: (xhr) => alert('Update failed: ' + (xhr.responseJSON?.error || 'Error'))
        });
    });

    // 3. Delete Logic
    $('.delete-btn').on('click', function() {
        if(confirm('Are you sure you want to delete this device? This action cannot be undone.')) {
            $.ajax({
                url: `${API_URL}/devices/${encodeURIComponent(deviceId)}`,
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + token },
                success: () => { 
                    alert('Device deleted.');
                    window.location.href = 'index.html'; 
                },
                error: (xhr) => alert('Delete failed.')
            });
        }
    });

    // Navigation and Logout
    $('.back, .cancel-btn').on('click', () => window.location.href = 'index.html');

    $('.user').on('click', () => { 
        if(confirm('Do you want to log out?')) { 
            localStorage.clear(); 
            sessionStorage.clear();
            window.location.href='login.html'; 
        }
    });
});