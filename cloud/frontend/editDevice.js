$(document).ready(function () {
    console.log("Edit Device script active...");

    // 1. Configuration - Using the logic from your working version
    const API_URL = window.location.origin + '/api';
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const params = new URLSearchParams(window.location.search);
    const deviceId = params.get('id');

    // 2. Initial Validation
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    if (!deviceId) { 
        alert('No Device ID found in URL.');
        window.location.href = 'index.html'; 
        return; 
    }

    // Set the ID field visually (since it's in your new HTML)
    $('#device-id').val(deviceId);

    // 3. Fetch current data
    $.ajax({
        url: `${API_URL}/devices/${encodeURIComponent(deviceId)}`,
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token },
        success: function(dev) {
            console.log("Data loaded:", dev);
            // We use || to ensure compatibility with different DB column naming
            $('#device-name').val(dev.device_name || dev.deviceName || '');
            $('#device-type').val(dev.device_type || dev.deviceType || '');
            $('#device-location').val(dev.location || '');
        },
        error: function(xhr) {
            console.error("Fetch Error:", xhr);
            alert('Could not fetch device details.');
        }
    });

    // 4. Update Device Logic
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
                alert('Device updated successfully!');
                window.location.href = 'index.html';
            },
            error: (xhr) => {
                const msg = xhr.responseJSON?.error || 'Server error';
                alert('Error: ' + msg);
            }
        });
    });

    // 5. Delete Device Logic
    $('.delete-btn').on('click', function(e) {
        e.preventDefault(); // Prevent any form trigger
        if(confirm('Are you sure you want to delete this device?')) {
            $.ajax({
                url: `${API_URL}/devices/${encodeURIComponent(deviceId)}`,
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + token },
                success: () => {
                    alert('Device deleted.');
                    window.location.href = 'index.html';
                },
                error: (xhr) => alert('Error: ' + (xhr.responseJSON?.error || 'Could not delete'))
            });
        }
    });

    // 6. Navigation Logic
    $('.back, .cancel-btn').on('click', function(e) {
        e.preventDefault();
        window.location.href = 'index.html';
    });

    // 7. Logout Logic
    $('.user').on('click', function() {
        localStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_token');
        window.location.href = 'login.html';
    });
});