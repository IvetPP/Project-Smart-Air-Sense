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
                alert(xhr.responseJSON?.error || 'Login failed');
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

        // 1. Define Password Requirements
        // Criteria: Min 8 chars, 1 uppercase, 1 lowercase, 1 number
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\W]{8,}$/;

        // 2. Validate Password Requirements
        if (!passwordRegex.test(password)) {
            alert(
                "Password does not meet the following requirements:\n" +
                "• Minimum 8 characters long\n" +
                "• At least one uppercase letter (A-Z)\n" +
                "• At least one lowercase letter (a-z)\n" +
                "• At least one number (0-9)"
            );
            return;
        }

        // 3. Validate Password Match
        if (password !== confirmPw) {
            alert("Passwords do not match!");
            return;
        }

        // 4. Proceed with Registration
        $.ajax({
            url: `${AUTH_API}/register`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ email, password }),
            success: function (res) {
                alert('Registration successful! You can now log in using the form above.');
                $('#signup-form')[0].reset();
                // Pre-fill login username for convenience
                $('#login-username').val(email);
            },
            error: function (xhr) {
                alert(xhr.responseJSON?.error || 'Registration failed');
            }
        });
    });

    /* ============================
       UI INTERACTIONS
    ============================ */
    $('.cancel-btn').on('click', () => $('#signup-form')[0].reset());
    $('.back').on('click', () => window.location.href = 'index.html');
});