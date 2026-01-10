$(document).ready(function () {
    const API_URL = '/api';
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    
    const params = new URLSearchParams(window.location.search);
    const deviceId = params.get('id');

    if (!deviceId) {
        alert('No device selected!');
        window.location.href = 'index.html';
        return;
    }

    // 1. Fetch current device data
    $.ajax({
        url: `${API_URL}/devices/${encodeURIComponent(deviceId)}`,
        headers: { Authorization: 'Bearer ' + token },
        success: function(dev) {
            // Fill form fields - Ensure IDs match your HTML
            $('#device-id').val(dev.device_id);
            $('#device-name').val(dev.device_name);
            $('#device-type').val(dev.device_type);
            $('#device-location').val(dev.location);
        },
        error: function() {
            alert('Could not fetch device details.');
        }
    });

    // 2. Handle Update
    $('#edit-device-form').on('submit', function (e) {
        e.preventDefault();

        const payload = {
            device_name: $('#device-name').val().trim(),
            device_type: $('#device-type').val().trim(),
            location: $('#device-location').val().trim()
            // registration_date is usually not edited, so we exclude it here
        };

        $.ajax({
            url: `${API_URL}/devices/${encodeURIComponent(deviceId)}`,
            method: 'PUT',
            headers: { 
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(payload),
            success: function () {
                alert('Device updated successfully!');
                window.location.href = 'index.html';
            },
            error: function (xhr) {
                console.error('Update Error:', xhr);
                alert('Error: ' + (xhr.responseJSON?.error || 'Server error'));
            }
        });
    });

    // 3. Handle Delete
    $('.delete-btn').on('click', function() {
        if(confirm('Permanently delete this device?')) {
            $.ajax({
                url: `${API_URL}/devices/${encodeURIComponent(deviceId)}`,
                method: 'DELETE',
                headers: { Authorization: 'Bearer ' + token },
                success: () => { 
                    alert('Deleted'); 
                    window.location.href='index.html'; 
                }
            });
        }
    });

    $('.back, .cancel-btn').on('click', () => window.location.href = 'index.html');
});