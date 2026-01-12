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
            // Updated key to 'email'
            data: JSON.stringify({ email: email, password: password }), 
            success: function (res) {
                localStorage.setItem('auth_token', res.token);
                if (!remember) sessionStorage.setItem('auth_token', res.token);
                window.location.href = 'index.html';
            },
            error: function (xhr) {
                // Better error display
                const response = xhr.responseJSON;
                let errMsg = Array.isArray(response) 
                    ? response.map(err => `${err.param}: ${err.msg}`).join('\n')
                    : (response?.error || response?.msg || 'Login failed');
                alert(errMsg);
            }
        });
    });

    /* ============================
    REGISTRATION LOGIC
    ============================ */
    $('#signup-form').on('submit', function (e) {
        e.preventDefault();

        // FIXED: Get the value from the single 'full-name' ID used in your HTML
        const fullName = $('#full-name').val()?.trim() || '';
    
        const email = $('#signup-username').val().trim();
        const password = $('#signup-password').val();
        const confirmPw = $('#signup-password-confirm').val();

        // 1. Requirement: Passwords must match
        if (password !== confirmPw) {
            alert("Error: Passwords do not match!");
            return;
        }

        // 2. Requirement: Password Complexity
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\W]{8,}$/;
        if (!passwordRegex.test(password)) {
            alert("Password Requirements:\n• 8+ characters\n• 1 Uppercase & 1 Lowercase\n• 1 Number");
            return;
        }

        // 3. Send Request
        $.ajax({
            url: `${AUTH_API}/register`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ 
                email: email, 
                password: password,
                full_name: fullName // Now correctly passing the captured name
            }),
            success: function (res) {
                alert('Registration successful!');
                $('#signup-form')[0].reset();
                $('#login-username').val(email);
            },
            error: function (xhr) {
                const response = xhr.responseJSON;
                let errMsg = Array.isArray(response) 
                    ? response.map(err => `${err.param}: ${err.msg}`).join('\n')
                    : (response?.error || response?.msg || 'Registration failed');
                alert(errMsg);
            }
        });
    });

    $('.cancel-btn').on('click', () => $('#signup-form')[0].reset());
    $('.back').on('click', () => window.location.href = 'index.html');
});