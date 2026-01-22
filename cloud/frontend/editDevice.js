$(document).ready(function () {
    const API_URL = window.location.origin + '/api';
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const params = new URLSearchParams(window.location.search);
    const deviceId = params.get('id');

    // Redirect if no ID is present in the URL
    if (!deviceId) { 
        alert('No Device ID found in URL.');
        window.location.href = 'index.html'; 
        return; 
    }

    // Set the ID field immediately
    $('#device-id').val(deviceId);

    // 1. Fetch current data
    $.ajax({
        url: `${API_URL}/devices/${encodeURIComponent(deviceId)}`,
        method: 'GET',
        headers: { 
            'Authorization': 'Bearer ' + token,
            'Accept': 'application/json'
        },
        success: function(dev) {
            // Populate fields based on your API response structure
            $('#device-name').val(dev.device_name || '');
            $('#device-type').val(dev.device_type || '');
            $('#device-location').val(dev.location || '');
            $('#device-user').val(dev.user || 'Admin'); // Fallback if user field exists
            
            // Handle Date: Format must be YYYY-MM-DD for <input type="date">
            if (dev.date) {
                const dateVal = new Date(dev.date).toISOString().split('T')[0];
                $('#device-date').val(dateVal);
            } else {
                // Fallback to today's date if empty
                $('#device-date').val(new Date().toISOString().split('T')[0]);
            }
        },
        error: function(xhr) {
            console.error("Fetch Error:", xhr);
            const msg = xhr.responseJSON?.error || xhr.statusText;
            alert(`Could not fetch device details: ${xhr.status} (${msg})`);
        }
    });

    // 2. Update Device Logic
    $('#edit-device-form').on('submit', function (e) {
        e.preventDefault();
        
        const payload = {
            device_name: $('#device-name').val().trim(),
            location: $('#device-location').val().trim(),
            device_type: $('#device-type').val().trim(),
            // add other fields if your API expects them
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
                alert('Update Error: ' + (xhr.responseJSON?.error || 'Server error'));
            }
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
                error: (xhr) => {
                    alert('Delete Error: ' + (xhr.responseJSON?.error || 'Could not delete device'));
                }
            });
        }
    });

    // Navigation back to dashboard
    $('.back, .cancel-btn').on('click', () => window.location.href = 'index.html');
    
    // Logout logic (optional)
    $('.user').on('click', function() {
        localStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_token');
        window.location.href = 'login.html';
    });
});