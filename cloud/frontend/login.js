$(document).ready(function () {
    const AUTH_API = '/api/auth';

    /* ============================
       LOGIN LOGIC
    ============================ */
    $('#login-form').on('submit', function (e) {
        e.preventDefault();

        const email = $('#login-username').val().trim();
        const password = $('#login-password').val();
        const remember = $('#remember').is(':checked');

        $.ajax({
            url: `${AUTH_API}/login`,
            method: 'POST',
            contentType: 'application/json',
            // FIX: Changed 'email' to 'user_name' to match your backend's expectation
            data: JSON.stringify({ user_name: email, password: password }), 
            success: function (res) {
                localStorage.setItem('auth_token', res.token);
                if (!remember) {
                    sessionStorage.setItem('auth_token', res.token);
                }
                window.location.href = 'index.html';
            },
            error: function (xhr) {
                let errMsg = 'Login failed';
                
                // FIX: Parse the array of error objects you received
                if (Array.isArray(xhr.responseJSON)) {
                    errMsg = xhr.responseJSON.map(err => `${err.param}: ${err.msg}`).join('\n');
                } else if (xhr.responseJSON?.error) {
                    errMsg = xhr.responseJSON.error;
                }
                
                alert(errMsg);
            }
        });
    });

    /* ============================
       REGISTRATION LOGIC
    ============================ */
    $('#signup-form').on('submit', function (e) {
        e.preventDefault();

        const email = $('#signup-username').val().trim();
        const password = $('#signup-password').val();
        const confirmPw = $('#signup-password-confirm').val();

        // 1. Check if Passwords Match
        if (password !== confirmPw) {
            alert("Error: Passwords do not match!");
            return;
        }

        // 2. Password Complexity Requirements
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\W]{8,}$/;
        if (!passwordRegex.test(password)) {
            alert("Password must be 8+ chars, with 1 uppercase, 1 lowercase, and 1 number.");
            return;
        }

        // 3. Send AJAX Request
        $.ajax({
            url: `${AUTH_API}/register`,
            method: 'POST',
            contentType: 'application/json',
            // FIX: Match the backend 'user_name' requirement here too
            data: JSON.stringify({ user_name: email, password: password }),
            success: function (res) {
                alert('Registration successful! You can now log in.');
                $('#signup-form')[0].reset();
                $('#login-username').val(email);
            },
            error: function (xhr) {
                let errMsg = 'Registration failed';
                
                // FIX: Parse the error array
                if (Array.isArray(xhr.responseJSON)) {
                    errMsg = xhr.responseJSON.map(err => `${err.param}: ${err.msg}`).join('\n');
                } else if (xhr.responseJSON?.error) {
                    errMsg = xhr.responseJSON.error;
                }
                
                alert(errMsg);
            }
        });
    });

    $('.cancel-btn').on('click', () => $('#signup-form')[0].reset());
    $('.back').on('click', () => window.location.href = 'index.html');
});