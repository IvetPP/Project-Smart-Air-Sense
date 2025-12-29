const API_BASE_URL = import.meta.env.VITE_API_URL + '/auth';

$(document).ready(function () {
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
            url: API_BASE_URL + '/login',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ email, password }),
            success: function (res) {
                const token = res.token;
                if (!token) {
                    alert('Login failed: no token returned');
                    return;
                }

                // Store token consistently
                if (remember) {
                    localStorage.setItem('auth_token', token);
                } else {
                    sessionStorage.setItem('auth_token', token);
                }

                alert('Login successful');
                window.location.href = 'index.html';
            },
            error: function (xhr) {
                if (xhr.status === 401) {
                    alert('Invalid email or password');
                } else if (xhr.responseJSON && xhr.responseJSON.error) {
                    alert(xhr.responseJSON.error);
                } else {
                    alert('Login failed');
                }
            }
        });
    });

    const $signupForm = $('#signup-form');
    if ($signupForm.length) {
        $signupForm.on('submit', function (e) {
            e.preventDefault();

            const email = $('#signup-username').val().trim();
            const fullName = $('#full-name').val().trim();
            const password = $('#signup-password').val();
            const passwordConfirm = $('#signup-password-confirm').val();

            if (password !== passwordConfirm) {
                alert('Passwords do not match');
                return;
            }

            if (password.length < 8) {
                alert('Password must be at least 8 characters long');
                return;
            }

            $.ajax({
                url: API_BASE_URL + '/register',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ email, password, full_name: fullName }),
                success: function () {
                    alert('Registration successful! You can now log in.');
                    $signupForm.trigger('reset');
                },
                error: function (xhr) {
                    if (xhr.status === 409) {
                        alert('Email already exists');
                    } else if (xhr.responseJSON && xhr.responseJSON.error) {
                        alert(xhr.responseJSON.error);
                    } else {
                        alert('Registration failed');
                    }
                }
            });
        });

        $signupForm.find('.cancel-btn').on('click', function () {
            $signupForm.trigger('reset');
        });
    }

    $(".user").on("click", function () {
        window.location.href = "login.html";
    });

    $(".back").on("click", function () {
        window.history.back();
    });
});