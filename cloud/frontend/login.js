$(document).ready(function () {

    const API_URL = '/api/auth';

    console.log('LOGIN JS LOADED');

    $('#login-form').on('submit', function (e) {
        e.preventDefault();

        const email = $('#login-username').val().trim();
        const password = $('#login-password').val();
        const remember = $('#remember').is(':checked');

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

                if (remember) {
                    localStorage.setItem('auth_token', res.token);
                } else {
                    sessionStorage.setItem('auth_token', res.token);
                }

                console.log(
                  'TOKEN SAVED:',
                  localStorage.getItem('auth_token') ||
                  sessionStorage.getItem('auth_token')
                );

                window.location.href = 'index.html';
            },
            error: function (xhr) {
                console.error('LOGIN ERROR:', xhr.responseText);
                alert('Login failed');
            }
        });
    });
});