$(document).ready(function () {
    const API_URL = window.location.origin + '/api';
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');

    if (!token) { window.location.href = 'login.html'; return; }

    // Dynamic Username Display
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        $('.user').text((payload.user_name || "USER").substring(0, 5).toUpperCase());
    } catch (e) {
        console.error("Token parsing error", e);
    }

    $('#add-device-form').on('submit', function (e) {
        e.preventDefault();

        const deviceData = {
            device_name: $('#device-name').val().trim(),
            device_type: $('#device-type').val().trim(),
            location: $('#device-location').val().trim()
            // registration_date will be set by Supabase automatically
        };

        $.ajax({
            url: API_URL + '/devices',
            method: 'POST',
            headers: { 
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(deviceData),
            success: function (res) {
                // res.device_id comes back from the backend after Supabase insertion
                alert('Device successfully added!');
                window.location.href = 'index.html';
            },
            error: function (xhr) {
                alert(xhr.responseJSON?.error || 'Failed to add device');
            }
        });
    });

    // Reset button or Cancel
    $('.delete-btn').on('click', function(e) {
        e.preventDefault();
        if(confirm('Clear form?')) $('#add-device-form').trigger('reset');
    });
    
    $('.back').on('click', () => window.location.href = 'index.html');
    
    $('.user').on('click', () => { 
        if(confirm('Log out?')) { 
            localStorage.clear(); 
            sessionStorage.clear();
            window.location.href='login.html'; 
        }
    });
});