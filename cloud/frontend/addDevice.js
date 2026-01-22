$(document).ready(function () {
    const API_URL = window.location.origin + '/api';
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');

    if (!token) { 
        window.location.href = 'login.html'; 
        return; 
    }

    // Set Default Date to Today
    const today = new Date().toISOString().split('T')[0];
    $('#device-date').val(today);

    // Dynamic Username logic
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        $('.user').text((payload.user_name || "LOG OUT").substring(0, 10).toUpperCase());
    } catch (e) { 
        console.error("Token parsing failed"); 
    }

    $('#add-device-form').on('submit', function (e) {
        e.preventDefault();

        // COLLECT DATA: Ensure #device-type matches the ID in your HTML
        const deviceData = {
            device_name: $('#device-name').val().trim(),
            device_type: $('#device-type').val(), // Added this line to fix your issue
            location: $('#device-location').val().trim(),
            registration_date: $('#device-date').val()
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
                alert('Device successfully added!');
                window.location.href = 'index.html';
            },
            error: (xhr) => {
                console.error("Error details:", xhr.responseJSON);
                alert(xhr.responseJSON?.error || 'Failed to add device');
            }
        });
    });

    $('.back').on('click', () => window.location.href = 'index.html');
    
    $('.user').on('click', () => { 
        if(confirm('Do you want to log out?')) { 
            localStorage.clear(); 
            sessionStorage.clear();
            window.location.href='login.html'; 
        }
    });
});