$(document).ready(function () {
    const API_URL = '/api';
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const params = new URLSearchParams(window.location.search);
    const deviceId = params.get('id');

    if (!token) { window.location.href = 'login.html'; return; }
    if (!deviceId) { window.location.href = 'index.html'; return; }

    $('#device-id').val(deviceId);

    // Fetch existing data
    $.ajax({
        url: `${API_URL}/devices/${encodeURIComponent(deviceId)}`,
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token },
        success: function(dev) {
            // Using your actual DB column names
            $('#device-name').val(dev.device_name || '');
            $('#device-type').val(dev.device_type || '');
            $('#device-location').val(dev.location || '');
        },
        error: (xhr) => alert("Could not fetch device data.")
    });

    // Save Logic
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

    $('.delete-btn').on('click', function() {
        if(confirm('Delete device?')) {
            $.ajax({
                url: `${API_URL}/devices/${encodeURIComponent(deviceId)}`,
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + token },
                success: () => { window.location.href = 'index.html'; }
            });
        }
    });

    $('.back, .cancel-btn').on('click', () => window.location.href = 'index.html');
});