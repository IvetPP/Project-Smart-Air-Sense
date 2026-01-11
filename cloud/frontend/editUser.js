$(document).ready(function () {
    const API_URL = window.location.origin + '/api';
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('id');

    if (!token) { window.location.href = 'login.html'; return; }

    // Log Out Logic
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        $('.user').text((payload.user_name || "LOG OUT").substring(0, 10).toUpperCase());
    } catch (e) { console.error("Token parsing failed"); }

    $('.user').on('click', function() { 
        if(confirm('Do you want to log out?')) { 
            localStorage.clear(); 
            window.location.href = 'login.html'; 
        }
    });

    if (!userId) { window.location.href = 'users.html'; return; }

    // Load User into Placeholders
    function loadUser() {
        $.ajax({
            url: `${API_URL}/users/${encodeURIComponent(userId)}`,
            method: 'GET',
            headers: { Authorization: 'Bearer ' + token },
            success: function(user) {
                $('#full-name').attr('placeholder', user.full_name || 'Full Name');
                $('#email').attr('placeholder', user.email || 'Email');
                $('#full-name, #email, #password-input').val('');
            },
            error: function(xhr) {
                alert('Error ' + xhr.status + ': ' + (xhr.responseJSON?.error || 'User not found'));
            }
        });
    }

    // Save Changes
    $('#edit-user-form').on('submit', function (e) {
        e.preventDefault();
        const payload = {};
        const name = $('#full-name').val().trim();
        const email = $('#email').val().trim();
        const pass = $('#password-input').val().trim();

        if (name) payload.full_name = name;
        if (email) payload.email = email;
        if (pass) payload.password = pass;

        if (Object.keys(payload).length === 0) {
            alert("No changes entered.");
            return;
        }

        $.ajax({
            url: `${API_URL}/users/${encodeURIComponent(userId)}`,
            method: 'PUT',
            headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
            data: JSON.stringify(payload),
            success: function() {
                alert('User updated successfully!');
                window.location.href = 'users.html';
            },
            error: function(xhr) {
                alert('Update failed: ' + (xhr.responseJSON?.error || 'Server error'));
            }
        });
    });

    // Delete
    $('.delete-btn').on('click', function() {
        if(confirm('Are you sure you want to delete this user?')) {
            $.ajax({
                url: `${API_URL}/users/${encodeURIComponent(userId)}`,
                method: 'DELETE',
                headers: { Authorization: 'Bearer ' + token },
                success: () => window.location.href = 'users.html'
            });
        }
    });

    $('.back, .cancel-btn').on('click', () => window.location.href = 'users.html');
    loadUser();
});