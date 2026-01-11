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
            data: JSON.stringify({ email, password }),
            success: function (res) {
                localStorage.setItem('auth_token', res.token);
                if (!remember) {
                    sessionStorage.setItem('auth_token', res.token);
                }
                window.location.href = 'index.html';
            },
            error: function (xhr) {
                // Prevent [object Object] by checking if response is an object
                const errorData = xhr.responseJSON?.error || xhr.responseJSON || 'Login failed';
                alert(typeof errorData === 'object' ? JSON.stringify(errorData) : errorData);
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
            alert("Error: Passwords do not match. Please re-enter your password.");
            // Clear the confirm field to let them try again
            $('#signup-password-confirm').val('');
            $('#signup-password-confirm').focus();
            return; // Stop the function here
        }

        // 2. Password Complexity Requirements
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\W]{8,}$/;
        if (!passwordRegex.test(password)) {
            alert(
                "Password does not meet requirements:\n" +
                "• Minimum 8 characters\n" +
                "• At least one uppercase letter\n" +
                "• At least one lowercase letter\n" +
                "• At least one number"
            );
            return;
        }

        // 3. Send AJAX Request
        $.ajax({
            url: `${AUTH_API}/register`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ email, password }),
            success: function (res) {
                alert('Registration successful! You can now log in.');
                $('#signup-form')[0].reset();
                $('#login-username').val(email);
            },
            error: function (xhr) {
                // Prevent [object Object] for registration errors
                const errorData = xhr.responseJSON?.error || xhr.responseJSON || 'Registration failed';
                alert(typeof errorData === 'object' ? JSON.stringify(errorData) : errorData);
            }
        });
    });

    $('.cancel-btn').on('click', () => $('#signup-form')[0].reset());
    $('.back').on('click', () => window.location.href = 'index.html');
});