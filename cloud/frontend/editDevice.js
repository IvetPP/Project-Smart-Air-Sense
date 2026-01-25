$(document).ready(function () {
    // 1. Use consistent URL logic
    const API_URL = window.location.origin + '/api';
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const params = new URLSearchParams(window.location.search);
    const deviceId = params.get('id');

    if (!token) { window.location.href = 'login.html'; return; }
    if (!deviceId) { window.location.href = 'index.html'; return; }

    // Display ID immediately
    $('#device-id').val(deviceId);

    // 2. Set Username in the circle (like you did in addDevice)
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        $('.user').text((payload.user_name || "LOG OUT").substring(0, 10).toUpperCase());
    } catch (e) { console.error("Token parsing failed"); }

    // 3. Fetch existing data
    $.ajax({
        url: `${API_URL}/devices/${encodeURIComponent(deviceId)}`,
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token },
        success: function(dev) {
            // Map DB columns to form IDs
            $('#device-name').val(dev.device_name || '');
            $('#device-type').val(dev.device_type || '');
            $('#device-location').val(dev.location || '');
        },
        error: (xhr) => alert("Could not fetch device data. Check if the ID exists.")
    });

    // 4. Save Logic
    $('#edit-device-form').on('submit', function (e) {
        e.preventDefault();
        const payload = {
            device_name: $('#device-name').val().trim(),
            device_type: $('#device-type').val().trim(),
            location: $('#device-location').val().trim()
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
                alert('Device updated!');
                window.location.href = 'index.html';
            },
            error: (xhr) => alert('Update failed: ' + (xhr.responseJSON?.error || 'Error'))
        });
    });

    // 5. Delete Logic
    $('.delete-btn').on('click', function() {
        if(confirm('Are you sure you want to delete this device? This cannot be undone.')) {
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

    // Logout & Navigation
    $('.user').on('click', () => { 
        if(confirm('Do you want to log out?')) { 
            localStorage.clear(); 
            sessionStorage.clear();
            window.location.href='login.html'; 
        }
    });
    $('.back, .cancel-btn').on('click', () => window.location.href = 'index.html');
});