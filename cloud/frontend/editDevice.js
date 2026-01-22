$(document).ready(function () {
    console.log("Edit Device script initialized...");

    // 1. Configuration & Setup
    // If you are running the frontend on a different port than the server (3000), 
    // change window.location.origin to 'http://localhost:3000'
    const API_URL = window.location.origin + '/api';
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    
    const params = new URLSearchParams(window.location.search);
    const deviceId = params.get('id');

    // 2. Initial Validation
    if (!token) {
        console.error("No auth token found. Redirecting to login...");
        window.location.href = 'login.html';
        return;
    }

    if (!deviceId) { 
        alert('No Device ID found in URL. Returning to dashboard.');
        window.location.href = 'index.html'; 
        return; 
    }

    // Set the ID field visually
    $('#device-id').val(deviceId);

    // 3. Navigation & Logout Logic
    $('.back, .cancel-btn').on('click', function(e) {
        e.preventDefault();
        console.log("Navigation: Returning to index.html");
        window.location.href = 'index.html';
    });

    $('.user').on('click', function() {
        console.log("Logging out...");
        localStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_token');
        window.location.href = 'login.html';
    });

    // 4. Fetch Current Device Data
    // This populates the form fields so you know what you are editing
    $.ajax({
        url: `${API_URL}/devices/${encodeURIComponent(deviceId)}`,
        method: 'GET',
        headers: { 
            'Authorization': 'Bearer ' + token,
            'Accept': 'application/json'
        },
        success: function(dev) {
            console.log("Device data loaded successfully:", dev);
            // We use the column names from your payload logic
            $('#device-name').val(dev.device_name || '');
            $('#device-type').val(dev.device_type || '');
            $('#device-location').val(dev.location || '');
        },
        error: function(xhr) {
            console.error("Fetch Error:", xhr);
            const msg = xhr.responseJSON?.error || 'Could not fetch device details.';
            alert(`Error ${xhr.status}: ${msg}`);
        }
    });

    // 5. Save/Update Logic (The Submit Button)
    $('#edit-device-form').on('submit', function (e) {
        e.preventDefault();
        console.log("Save button clicked. Preparing update...");

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
            success: (response) => {
                console.log("Update successful:", response);
                alert('Device updated successfully!');
                window.location.href = 'index.html';
            },
            error: (xhr) => {
                console.error("Update Error:", xhr);
                const msg = xhr.responseJSON?.error || 'Server error';
                alert('Update Failed: ' + msg);
            }
        });
    });

    // 6. Delete Logic
    $('.delete-btn').on('click', function(e) {
        e.preventDefault();
        
        if (confirm('Are you sure you want to delete this device? This action cannot be undone.')) {
            console.log("Deleting device:", deviceId);
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
                    console.error("Delete Error:", xhr);
                    const msg = xhr.responseJSON?.error || 'Could not delete device';
                    alert('Delete Failed: ' + msg);
                }
            });
        }
    });
});