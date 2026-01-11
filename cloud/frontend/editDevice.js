$(document).ready(function () {
    const API_URL = '/api';
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    
    // Redirect if no token
    if (!token) { window.location.href = 'login.html'; return; }

    // Get ID from URL (e.g., editDevice.html?id=123)
    const params = new URLSearchParams(window.location.search);
    const deviceId = params.get('id');

    if (!deviceId) {
        alert('No device selected!');
        window.location.href = 'index.html';
        return;
    }

    /**
     * 1. Fetch current device data to fill the form
     */
    // Inside editDevice.js -> AJAX GET request

$.ajax({
    url: `${API_URL}/devices/${encodeURIComponent(deviceId)}`,
    method: 'GET',
    headers: { Authorization: 'Bearer ' + token },
    success: function(response) {
        // Debugging: See what the server actually sends
        console.log("Server response:", response);

        // Handle cases where backend wraps data in an object (e.g., response.device or response.data)
        const dev = response.device || response.data || response;

        if(!dev || (!dev.device_id && !dev.id)) {
            alert('Device found but data is empty.');
            return;
        }

        // Fill the form fields
        $('#device-id').val(dev.device_id || dev.id || deviceId);
        $('#device-name').val(dev.device_name || '');
        $('#device-type').val(dev.device_type || '');
        $('#device-location').val(dev.location || '');
        
        if(dev.assigned_user) $('#device-user').val(dev.assigned_user);
        if(dev.install_date) $('#device-date').val(dev.install_date.split('T')[0]);
    },
    error: function(xhr) {
        console.error("Fetch error status:", xhr.status);
        console.error("Fetch error response:", xhr.responseText);
        alert('Could not fetch device details. Status: ' + xhr.status);
    }
});

    /**
     * 2. Handle Update (Save Button)
     */
    $('#edit-device-form').on('submit', function (e) {
        e.preventDefault();

        const payload = {
            device_name: $('#device-name').val().trim(),
            location: $('#device-location').val().trim(),
            device_type: $('#device-type').val().trim(),
            // Adding these in case your backend supports them:
            assigned_user: $('#device-user').val() ? $('#device-user').val().trim() : null,
            install_date: $('#device-date').val() || null
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
                const errorMsg = xhr.responseJSON?.error || xhr.responseText || 'Server error';
                alert('Error updating device: ' + errorMsg);
            }
        });
    });

    /**
     * 3. Handle Delete
     */
    $('.delete-btn').on('click', function() {
        if(confirm('Are you sure you want to permanently delete this device? This action cannot be undone.')) {
            $.ajax({
                url: `${API_URL}/devices/${encodeURIComponent(deviceId)}`,
                method: 'DELETE',
                headers: { Authorization: 'Bearer ' + token },
                success: function() { 
                    alert('Device deleted successfully'); 
                    window.location.href = 'index.html'; 
                },
                error: function(xhr) {
                    alert('Error deleting device: ' + (xhr.responseJSON?.error || 'Server error'));
                }
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