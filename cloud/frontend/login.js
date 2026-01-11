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
            // FIXED: Sending 'email' key instead of 'user_name'
            data: JSON.stringify({ email: email, password: password }), 
            success: function (res) {
                localStorage.setItem('auth_token', res.token);
                if (!remember) {
                    sessionStorage.setItem('auth_token', res.token);
                }
                window.location.href = 'index.html';
            },
            error: function (xhr) {
                let errMsg = 'Login failed';
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

        // Capture all fields
        const firstName = $('#signup-firstname').val()?.trim() || '';
        const lastName = $('#signup-lastname').val()?.trim() || '';
        const email = $('#signup-username').val().trim(); // This is the email input
        const password = $('#signup-password').val();
        const confirmPw = $('#signup-password-confirm').val();

        // 1. Combine names for the 'full_name' column
        const fullName = `${firstName} ${lastName}`.trim();

        // 2. Check if Passwords Match
        if (password !== confirmPw) {
            alert("Error: Passwords do not match!");
            return;
        }

        // 3. Password Complexity Requirements
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\W]{8,}$/;
        if (!passwordRegex.test(password)) {
            alert("Password must be 8+ chars, with 1 uppercase, 1 lowercase, and 1 number.");
            return;
        }

        // 4. Send AJAX Request
        $.ajax({
            url: `${AUTH_API}/register`,
            method: 'POST',
            contentType: 'application/json',
            // FIXED: Sending 'email' and 'full_name' to match Supabase columns
            data: JSON.stringify({ 
                email: email, 
                password: password,
                full_name: fullName 
            }),
            success: function (res) {
                alert('Registration successful! You can now log in.');
                $('#signup-form')[0].reset();
                $('#login-username').val(email);
            },
            error: function (xhr) {
                let errMsg = 'Registration failed';
                if (Array.isArray(xhr.responseJSON)) {
                    errMsg = xhr.responseJSON.map(err => `${err.param}: ${err.msg}`).join('\n');
                } else if (xhr.responseJSON?.error) {
                    errMsg = (typeof xhr.responseJSON.error === 'object') 
                        ? JSON.stringify(xhr.responseJSON.error) 
                        : xhr.responseJSON.error;
                }
                alert(errMsg);
            }
        });
    });

    $('.cancel-btn').on('click', () => $('#signup-form')[0].reset());
    $('.back').on('click', () => window.location.href = 'index.html');
});