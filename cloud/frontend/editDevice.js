$(document).ready(function () {
    const API_URL = window.location.origin + '/api';
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const params = new URLSearchParams(window.location.search);
    const deviceId = params.get('id');

    if (!deviceId) { window.location.href = 'index.html'; return; }

    // 1. Fetch current data
    $.ajax({
        url: `${API_URL}/devices/${encodeURIComponent(deviceId)}`,
        method: 'GET',
        headers: { Authorization: 'Bearer ' + token },
        success: function(dev) {
            $('#device-id').val(dev.device_id);
            $('#device-name').val(dev.device_name);
            $('#device-type').val(dev.device_type);
            $('#device-location').val(dev.location);
            
            if (dev.registration_date) {
                $('#device-date').val(dev.registration_date.split('T')[0]);
            }
        },
        error: () => alert('Could not fetch device details.')
    });

    // 2. Update
    $('#edit-device-form').on('submit', function (e) {
        e.preventDefault();
        const payload = {
            device_name: $('#device-name').val().trim(),
            location: $('#device-location').val().trim(),
            device_type: $('#device-type').val().trim(),
            registration_date: $('#device-date').val()
        };

        $.ajax({
            url: `${API_URL}/devices/${encodeURIComponent($('#device-id').val())}`,
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
            error: (xhr) => alert('Error: ' + (xhr.responseJSON?.error || 'Server error'))
        });
    });

    // 3. Delete & Nav
    $('.delete-btn').on('click', function() {
        if(confirm('Delete this device?')) {
            $.ajax({
                url: `${API_URL}/devices/${encodeURIComponent(deviceId)}`,
                method: 'DELETE',
                headers: { Authorization: 'Bearer ' + token },
                success: () => window.location.href='index.html'
            });
        }
    });

    // Logout Functionality
    $('.user').on('click', function() {
        if(confirm('Log out?')) {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = 'login.html';
        }
    });

    // Navigation
    $('.back, .cancel-btn').on('click', () => window.location.href = 'index.html');
});
