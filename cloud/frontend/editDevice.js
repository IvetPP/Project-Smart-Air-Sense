$(document).ready(function () {
    const API_URL = window.location.origin + '/api';
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const params = new URLSearchParams(window.location.search);
    const deviceId = params.get('id');

    // 1. Initial Validation
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    if (!deviceId) { 
        alert('No Device ID found in URL.');
        window.location.href = 'index.html'; 
        return; 
    }

    // Set the ID field visually
    $('#device-id').val(deviceId);

    // 2. Fetch current data
    $.ajax({
        url: `${API_URL}/devices/${encodeURIComponent(deviceId)}`,
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token },
        success: function(res) {
            // Handle Supabase/Postgres returning an array or a single object
            const dev = Array.isArray(res) ? res[0] : res;

            if (!dev) {
                alert("Device not found.");
                window.location.href = 'index.html';
                return;
            }

            console.log("Data loaded:", dev);
            $('#device-name').val(dev.device_name || dev.deviceName || '');
            $('#device-type').val(dev.device_type || dev.deviceType || '');
            $('#device-location').val(dev.location || '');
        },
        error: function(xhr) {
            console.error("Fetch Error:", xhr);
            alert('Could not fetch device details. Make sure the ID is correct.');
        }
    });

    // 3. Update Device Logic (PUT)
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

    // 4. Delete Device Logic
    $('.delete-btn').on('click', function(e) {
        e.preventDefault();
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

    // 5. Navigation & Logout
    $('.back, .cancel-btn').on('click', () => window.location.href = 'index.html');

    $('.user').on('click', () => {
        if(confirm('Do you want to log out?')) {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = 'login.html';
        }
    });
});