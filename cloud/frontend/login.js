$(document).ready(function () {
    const AUTH_API = '/api/auth';

    // Start with Signup hidden
    $('#signup-form').addClass('hidden');

    // Add toggle links dynamically
    $('#login-form').append('<span class="toggle-link" id="show-signup">Don\'t have an account? Sign up</span>');
    $('#signup-form').append('<span class="toggle-link" id="show-login">Already have an account? Log in</span>');

    /* ============================
       TOGGLE LOGIC
    ============================ */
    $(document).on('click', '#show-signup', function() {
        $('#login-form').addClass('hidden');
        $('#signup-form').removeClass('hidden');
    });

    $(document).on('click', '#show-login, .cancel-btn', function() {
        $('#signup-form').addClass('hidden');
        $('#login-form').removeClass('hidden');
    });

    /* ============================
       LOGIN LOGIC
    ============================ */
    $('#login-form').on('submit', function (e) {
        e.preventDefault();
        const user_name = $('#login-username').val().trim();
        const password = $('#login-password').val();
        const remember = $('#remember').is(':checked');

        $.ajax({
            url: `${AUTH_API}/login`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ user_name, password }),
            success: function (res) {
                localStorage.setItem('auth_token', res.token);
                if (!remember) sessionStorage.setItem('auth_token', res.token);
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
        const user_name = $('#signup-username').val().trim();
        const password = $('#signup-password').val();
        const confirmPw = $('#signup-password-confirm').val();

        if (password !== confirmPw) {
            alert("Passwords do not match!");
            return;
        }

        $.ajax({
            url: `${AUTH_API}/register`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ user_name, password }),
            success: function (res) {
                alert('Registration successful! You can now log in.');
                $('#show-login').click(); // Switch back to login form
                $('#login-username').val(user_name);
            },
            error: function (xhr) {
                alert(xhr.responseJSON?.error || 'Registration failed');
            }
        });
    });

    $('.back').on('click', () => window.location.href = 'index.html');
});