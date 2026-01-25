$(document).ready(function () {
    console.log("Edit Device script initialized for Render...");

    // 1. Configuration
    const API_URL = window.location.origin + '/api/devices'; 
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    
    const params = new URLSearchParams(window.location.search);
    const urlId = params.get('id');
    
    // This variable will hold the EXACT device_id string returned by the server
    let verifiedDeviceId = null;

    // 2. Initial Security & Validation Checks
    if (!token) {
        console.warn("No auth token found. Redirecting to login...");
        window.location.href = 'login.html';
        return;
    }

    if (!urlId) { 
        alert('No Device ID found in URL. Returning to dashboard.');
        window.location.href = 'index.html'; 
        return; 
    }

    // 3. Fetch Current Device Data
    $.ajax({
        url: API_URL + '/' + encodeURIComponent(urlId), 
        method: 'GET',
        headers: { 
            'Authorization': 'Bearer ' + token,
            'Accept': 'application/json'
        },
        success: function(dev) {
            console.log("Device data loaded successfully:", dev);
            
            // Store the exact ID from the database to use in the PUT request
            verifiedDeviceId = dev.device_id;

            // Fill the form fields
            $('#device-id').val(dev.device_id);
            $('#device-name').val(dev.device_name);
            $('#device-type').val(dev.device_type);
            $('#device-location').val(dev.location);
        },
        error: function(xhr) {
            console.error("Fetch Error:", xhr.status, xhr.responseJSON);
            const msg = xhr.responseJSON?.error || 'Could not fetch device details.';
            
            // If we get a 403 here, it means the mapping in device_users is missing
            if (xhr.status === 403) {
                alert("Access Denied: You do not have permission to manage this device.");
                window.location.href = 'index.html';
            } else {
                alert(`Error ${xhr.status}: ${msg}`);
            }
        }
    });

    // 4. Update Logic (The Submit Form)
    $('#edit-device-form').on('submit', function (e) {
        e.preventDefault();
        
        // Use the ID from the DB if available, otherwise fallback to URL ID
        const targetId = verifiedDeviceId || urlId;

        const payload = {
            device_name: $('#device-name').val().trim(),
            device_type: $('#device-type').val().trim(),
            location: $('#device-location').val().trim(),
            // Ensure registration_date is sent if your backend requires it
            registration_date: new Date().toISOString().split('T')[0]
        };

        if (!payload.device_name || !payload.device_type) {
            alert("Please fill in the required fields.");
            return;
        }

        console.log("Sending update for:", targetId, payload);

        $.ajax({
            url: `${API_URL}/${encodeURIComponent(targetId)}`,
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
        const targetId = verifiedDeviceId || urlId;
        
        if (confirm('Are you sure you want to delete this device? This action cannot be undone.')) {
            $.ajax({
                url: `${API_URL}/${encodeURIComponent(targetId)}`,
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

    // 6. Navigation & UI Logic
    $('.back, .cancel-btn').on('click', function(e) {
        e.preventDefault();
        window.location.href = 'index.html';
    });

    $('.user').on('click', function() {
        if(confirm("Do you want to logout?")) {
            localStorage.removeItem('auth_token');
            sessionStorage.removeItem('auth_token');
            window.location.href = 'login.html';
        }
    });
});