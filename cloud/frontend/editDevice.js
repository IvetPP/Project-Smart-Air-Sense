$(document).ready(function () {
    // 1. Configuration & Setup
    const API_URL = window.location.origin + '/api';
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const params = new URLSearchParams(window.location.search);
    const deviceId = params.get('id');

    // 2. Navigation Logic (Back and Cancel)
    // This is placed at the top so navigation works even if API calls fail
    $('.back, .cancel-btn').on('click', function(e) {
        e.preventDefault();
        window.location.href = 'index.html';
    });

    // Logout logic
    $('.user').on('click', function() {
        localStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_token');
        window.location.href = 'login.html';
    });

    // 3. Validation
    if (!deviceId) { 
        alert('No Device ID found in URL.');
        window.location.href = 'index.html'; 
        return; 
    }

    // Set the ID field visually immediately
    $('#device-id').val(deviceId);

    // 4. Fetch Current Device Data
    $.ajax({
        url: `${API_URL}/devices/${encodeURIComponent(deviceId)}`,
        method: 'GET',
        headers: { 
            'Authorization': 'Bearer ' + token,
            'Accept': 'application/json'
        },
        success: function(dev) {
            // Mapping API response to HTML input IDs
            $('#device-name').val(dev.device_name || '');
            $('#device-type').val(dev.device_type || '');
            $('#device-location').val(dev.location || '');
        },
        error: function(xhr) {
            console.error("Fetch Error:", xhr);
            const msg = xhr.responseJSON?.error || xhr.statusText;
            alert(`Could not fetch device details: ${xhr.status} (${msg})`);
        }
    });

    // 5. Save/Update Logic
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
            error: (xhr) => {
                const msg = xhr.responseJSON?.error || 'Server error';
                alert('Update Error: ' + msg);
            }
        });
    });

    // 6. Delete Logic
    $('.delete-btn').on('click', function(e) {
        e.preventDefault();
        
        if(confirm('Are you sure you want to delete this device?')) {
            $.ajax({
                url: `${API_URL}/devices/${encodeURIComponent(deviceId)}`,
                method: 'DELETE',
                headers: { 
                    'Authorization': 'Bearer ' + token 
                },
                success: () => {
                    alert('Device deleted successfully.');
                    window.location.href = 'index.html';
                },
                error: (xhr) => {
                    const msg = xhr.responseJSON?.error || 'Could not delete device';
                    alert('Delete Error: ' + msg);
                }
            });
        }
    });
});