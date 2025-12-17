const API_BASE_URL = 'http://localhost:3000/api';

$(document).ready(function () {
    const $form = $('#add-device-form');
    $form.on('submit', function (e) {
        e.preventDefault();

        const token =
            localStorage.getItem('auth_token') ||
            sessionStorage.getItem('auth_token');

        if (!token) {
            window.location.href = '/login.html';
        return;
        }

        const deviceData = {
            name: $('#device-name').val().trim(),
            type: $('#device-type').val().trim(),
            location: $('#device-location').val().trim()
        };

        if (!deviceData.name || !deviceData.type) {
            alert('Device name and type are required');
        return;
        }

        $.ajax({
            url: API_BASE_URL + '/devices',
            method: 'POST',
            headers: {
                Authorization: 'Bearer ' + token
            },
            contentType: 'application/json',
            data: JSON.stringify(deviceData),
            success: function (res) {
                $('#device-id').val(res.device_id);
                alert('Device successfully added');
        },
        error: function (xhr) {
            if (xhr.status === 401) {
                window.location.href = '/login.html';
            } else if (xhr.responseJSON?.error) {
                alert(xhr.responseJSON.error);
            } else {
                alert('Failed to add device');
            }
        }
        });
    });

    $('.delete-btn').on('click', function () {
        if (confirm('Clear form?')) {
        $form.trigger('reset');
        $('#device-id').val('');
        }
    });

    $('.user').on('click', function () {
        const token =
            localStorage.getItem('auth_token') ||
            sessionStorage.getItem('auth_token');

            // User is NOT logged in
            if (!token) {
                window.location.href = 'login.html';
                return;
            }

            // User IS logged in
            const confirmLogout = confirm('Do you want to log out?');

            if (confirmLogout) {
                localStorage.removeItem('auth_token');
                sessionStorage.removeItem('auth_token');

                alert('You have been logged out.');
                window.location.href = 'login.html';
            }
    });
  
    // back
    $(".back").on("click", function () {
        window.history.back();
    });

    // Save button
    $("#add-device-form").on("submit", function(e) {
        e.preventDefault();
        alert("Device saved");
    });
});
