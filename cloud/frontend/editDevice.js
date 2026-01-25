$(document).ready(function () {
    console.log("Edit Device script initialized for Render...");

    // 1. Configuration (Relative path for same-origin deployment)
    const API_URL = window.location.origin + '/api/devices'; 
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    
    const params = new URLSearchParams(window.location.search);
    const deviceId = params.get('id');

    // 2. Initial Security & Validation Checks
    if (!token) {
        console.warn("No auth token found. Redirecting to login...");
        window.location.href = 'login.html';
        return;
    }

    if (!deviceId) { 
        alert('No Device ID found in URL. Returning to dashboard.');
        window.location.href = 'index.html'; 
        return; 
    }

    // Set the ID field visually if it exists in your HTML
    if ($('#device-id').length) {
        $('#device-id').val(deviceId);
    }

    // 3. Fetch Current Device Data
    $.ajax({
        // Make sure there is exactly one slash between API_URL and deviceId
        url: API_URL + '/' + encodeURIComponent(deviceId), 
        method: 'GET',
        headers: { 
            'Authorization': 'Bearer ' + token,
            'Accept': 'application/json'
        },
        success: function(dev) {
            console.log("Device data loaded:", dev);
            // Your backend uses snake_case, so ensure these match exactly
            $('#device-id').val(dev.device_id);
            $('#device-name').val(dev.device_name);
            $('#device-type').val(dev.device_type);
            $('#device-location').val(dev.location);
        },
        error: function(xhr) {
            // Detailed logging to see the ACTUAL error from Supabase
            console.error("Fetch Error:", xhr.status, xhr.responseJSON);
            const msg = xhr.responseJSON?.error || 'Could not fetch device details.';
            alert(`Error ${xhr.status}: ${msg}`);
        }
    });
    //

    // 4. Update Logic (The Submit Form)
    $('#edit-device-form').on('submit', function (e) {
        e.preventDefault();
        
        const payload = {
            device_name: $('#device-name').val().trim(),
            device_type: $('#device-type').val().trim(),
            location: $('#device-location').val().trim(),
            registration_date: new Date().toISOString().split('T')[0]
        };

        // Basic validation
        if (!payload.device_name || !payload.device_type) {
            alert("Please fill in the required fields.");
            return;
        }

        $.ajax({
            url: `${API_URL}/${encodeURIComponent(deviceId)}`,
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

    // 5. Delete Logic
    $('.delete-btn').on('click', function(e) {
        e.preventDefault();
        
        if (confirm('Are you sure you want to delete this device? This action cannot be undone.')) {
            $.ajax({
                url: `${API_URL}/${encodeURIComponent(deviceId)}`,
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

    // 6. Navigation Buttons
    $('.back, .cancel-btn').on('click', function(e) {
        e.preventDefault();
        window.location.href = 'index.html';
    });

    // 7. Logout Logic (User Profile Click)
    $('.user').on('click', function() {
        if(confirm("Do you want to logout?")) {
            localStorage.removeItem('auth_token');
            sessionStorage.removeItem('auth_token');
            window.location.href = 'login.html';
        }
    });
});
