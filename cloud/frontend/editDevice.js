$(document).ready(function () {
    const API_URL = window.location.origin + '/api';
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    
    // Get the ID from URL: editdevice.html?id=sensor-123
    const params = new URLSearchParams(window.location.search);
    const deviceId = params.get('id');

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    if (!deviceId) { 
        alert('No Device ID found in URL.');
        window.location.href = 'index.html'; 
        return; 
    }

    // Display the ID in the readonly input
    $('#device-id').val(deviceId);

    // 1. Fetch current data to fill the form
    $.ajax({
        url: `${API_URL}/devices/${encodeURIComponent(deviceId)}`,
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token },
        success: function(dev) {
            console.log("Device loaded:", dev);
            // Match your Supabase column names
            $('#device-name').val(dev.device_name || '');
            $('#device-type').val(dev.device_type || '');
            $('#device-location').val(dev.location || '');
        },
        error: function(xhr) {
            console.error("Fetch Error:", xhr);
            alert('Error: Could not find this device in the database.');
        }
    });

    // 2. Save/Update Logic
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
                alert('Update failed: ' + (xhr.responseJSON?.error || 'Server error'));
            }
        });
    });

    // 3. Delete Logic
    $('.delete-btn').on('click', function(e) {
        e.preventDefault();
        if(confirm('Are you sure you want to delete this device? This action cannot be undone.')) {
            $.ajax({
                url: `${API_URL}/devices/${encodeURIComponent(deviceId)}`,
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + token },
                success: () => {
                    alert('Device deleted.');
                    window.location.href = 'index.html';
                },
                error: (xhr) => alert('Delete failed: ' + (xhr.responseJSON?.error || 'Could not delete'))
            });
        }
    });

    // Navigation & Logout
    $('.back, .cancel-btn').on('click', () => window.location.href = 'index.html');
    
    $('.user').on('click', () => { 
        if(confirm('Do you want to log out?')) { 
            localStorage.clear(); 
            sessionStorage.clear();
            window.location.href='login.html'; 
        }
    });
});