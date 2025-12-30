$(document).ready(function () {

    const API_URL = '/api/auth';

    console.log('LOGIN JS LOADED');

    $('#login-form').on('submit', function (e) {
        e.preventDefault();

        const email = $('#login-username').val().trim();
        const password = $('#login-password').val();
        const remember = $('#remember').is(':checked');

        if (!email || !password) {
            alert('Email and password are required');
            return;
        }

        $.ajax({
            url: API_URL + '/login',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ email, password }),
            success: function (res) {
                console.log('LOGIN RESPONSE:', res);

                if (!res.token) {
                    alert('NO TOKEN FROM SERVER');
                    return;
                }

                // Always use localStorage to persist across page reloads
                localStorage.setItem('auth_token', res.token);
                if (!remember) {
                    // Also keep in sessionStorage if not remembering
                    sessionStorage.setItem('auth_token', res.token);
                }

                console.log('TOKEN SAVED:');
                console.log('localStorage:', localStorage.getItem('auth_token'));
                console.log('sessionStorage:', sessionStorage.getItem('auth_token'));

                // Redirect after token is saved
                window.location.href = 'index.html';
            },
            error: function (xhr) {
                console.error('LOGIN ERROR:', xhr.responseText);
                if (xhr.status === 401) {
                    alert('Invalid email or password');
                } else {
                    alert('Login failed');
                }
            }
        });
    });
});