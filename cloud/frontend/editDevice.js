const API_BASE_URL = 'http://localhost:3000/api';

$(document).ready(function () {

    const params = new URLSearchParams(window.location.search);
    const deviceId = params.get('device_id');

    if (!deviceId) {
        alert('No device selected');
        window.history.back();
    }
    const $form = $('#edit-device-form');

    $form.on('submit', function (e) {
        e.preventDefault();

        const token =
            localStorage.getItem('auth_token') ||
            sessionStorage.getItem('auth_token');

        if (!token) {
            window.location.href = '/login.html';
        return;
        }

        const deviceId = $('#device-id').val().trim();

        const payload = {
            name: $('#device-name').val().trim(),
            location: $('#device-location').val().trim()
        };

        Object.keys(payload).forEach(
        key => payload[key] === '' && delete payload[key]
        );

        $.ajax({
            url: API_BASE_URL + '/devices/' + encodeURIComponent(deviceId),
            method: 'PUT',
            headers: {
                Authorization: 'Bearer ' + token
            },
            contentType: 'application/json',
            data: JSON.stringify(payload),
            success: function () {
                alert('Device updated successfully');
        },
        error: function (xhr) {
            if (xhr.status === 401) {
                window.location.href = '/login.html';
            } else if (xhr.status === 403) {
                alert(xhr.responseJSON?.error || 'Forbidden');
            } else if (xhr.status === 404) {
                alert('Device not found');
            } else {
                alert('Failed to update device');
            }
        }
        });
    });

    $('.cancel-btn').on('click', function () {
        if (confirm('Discard changes?')) {
        window.history.back();
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

    // cancel 
    //TO-DO delete
    $(".delete-btn").on("click", function() {
        alert("Device deleted");
        window.location.href = "index.html";
    });

    // Save button
    $("#add-device-form").on("submit", function(e) {
        e.preventDefault();
        alert("Device saved");
    });
});
