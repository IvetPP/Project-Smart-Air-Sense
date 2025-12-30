$(document).ready(function () {

    const API_URL = '/api/auth';

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

                if (remember) {
                    localStorage.setItem('auth_token', res.token);
                } else {
                    sessionStorage.setItem('auth_token', res.token);
                }

                window.location.href = 'index.html';
            },
            error: function () {
                alert('Login failed');
            }
        });
    });
});