$(document).ready(function () {
    const API_URL = window.location.origin + '/api';
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const params = new URLSearchParams(window.location.search);
    const deviceId = params.get('id');

    if (!token) { window.location.href = 'login.html'; return; }
    if (!deviceId) { window.location.href = 'index.html'; return; }

    // Display Username in Circle
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        $('.user').text((payload.user_name || "LOG OUT").substring(0, 10).toUpperCase());
    } catch (e) { 
        console.error("Token parsing failed"); 
    }

    // Fetch existing data
    $.ajax({
        url: `${API_URL}/devices/${encodeURIComponent(deviceId)}`,
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token },
        success: function(dev) {
            $('#device-id').val(dev.device_id);
            $('#device-name').val(dev.device_name || '');
            $('#device-type').val(dev.device_type || '');
            $('#device-location').val(dev.location || '');
            $('#device-date').val(dev.registration_date || '');
        },
        error: (xhr) => alert("Could not fetch device data.")
    });

    // Save Logic (PUT)
    $('#edit-device-form').on('submit', function (e) {
        e.preventDefault();
        const payload = {
            device_name: $('#device-name').val().trim(),
            device_type: $('#device-type').val().trim(),
            location: $('#device-location').val().trim(),
            registration_date: $('#device-date').val() // Required by your BE route
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

    // Delete Logic
    $('.delete-btn').on('click', function() {
        if(confirm('Are you sure you want to delete this device permanently?')) {
            $.ajax({
                url: `${API_URL}/devices/${encodeURIComponent(deviceId)}`,
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + token },
                success: () => { 
                    alert('Device deleted successfully.');
                    window.location.href = 'index.html'; 
                },
                error: (xhr) => alert('Delete failed.')
            });
        }
    });

    // Logout and Back
    $('.user').on('click', () => { 
        if(confirm('Log out?')) { 
            localStorage.clear(); 
            sessionStorage.clear();
            window.location.href='login.html'; 
        }
    });
    $('.back, .cancel-btn').on('click', () => window.location.href = 'index.html');
});