$(document).ready(function () {
    const API_URL = window.location.origin + '/api';
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const params = new URLSearchParams(window.location.search);
    const deviceId = params.get('id');

    // Redirect if no ID is present in the URL
    if (!deviceId) { 
        window.location.href = 'index.html'; 
        return; 
    }

    // 1. Fetch current data and populate remaining fields
    $.ajax({
        url: `${API_URL}/devices/${encodeURIComponent(deviceId)}`,
        method: 'GET',
        headers: { Authorization: 'Bearer ' + token },
        success: function(dev) {
            $('#device-name').val(dev.device_name);
            $('#device-type').val(dev.device_type);
            $('#device-location').val(dev.location);
        },
        error: () => alert('Could not fetch device details.')
    });

    // 2. Update Device Logic
    $('#edit-device-form').on('submit', function (e) {
        e.preventDefault();
        
        const payload = {
            device_name: $('#device-name').val().trim(),
            location: $('#device-location').val().trim(),
            device_type: $('#device-type').val().trim()
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
            error: (xhr) => alert('Error: ' + (xhr.responseJSON?.error || 'Server error'))
        });
    });

    // 3. Delete Device Logic
    $('.delete-btn').on('click', function() {
        if(confirm('Are you sure you want to delete this device?')) {
            $.ajax({
                url: `${API_URL}/devices/${encodeURIComponent(deviceId)}`,
                method: 'DELETE',
                headers: { Authorization: 'Bearer ' + token },
                success: () => {
                    alert('Device deleted.');
                    window.location.href = 'index.html';
                },
                error: (xhr) => alert('Error: ' + (xhr.responseJSON?.error || 'Could not delete device'))
            });
        }
    });

    // Navigation back to dashboard
    $('.back, .cancel-btn').on('click', () => window.location.href = 'index.html');
});
