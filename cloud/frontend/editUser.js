// 1. LOCK THE PAGE (Run this before jQuery loads anything)
// This prevents other scripts from changing the location for 2 seconds
(function() {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (!token) {
        window.location.replace('login.html');
        return;
    }
    console.log("Edit User Page: Auth Lock Engaged");
})();

$(document).ready(function () {
    const API_URL = '/api';
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('id');

    // 2. STOP GLOBAL REDIRECTS
    // This disables any click listeners from index.js that might be "bleeding" into this page
    $(document).off('click'); 

    if (!userId) {
        console.error("No ID found in URL");
        window.location.href = 'users.html';
        return;
    }

    function loadUser() {
        $.ajax({
            url: `${API_URL}/users/${userId}`,
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token },
            success: function (user) {
                // Supabase fix: try multiple field names
                $('#name').val(user.full_name || user.user_name || '');
                $('#email').val(user.email || '');
                if (user.created_at) {
                    $('#registration-date').val(user.created_at.split('T')[0]);
                }
            },
            error: function (xhr) {
                console.error("Load Error:", xhr);
                if(xhr.status === 401) window.location.href = 'login.html';
            }
        });
    }

    // 3. Form Submit Fix
    $('#edit-device-form').on('submit', function (e) {
        e.preventDefault();
        e.stopImmediatePropagation(); // Prevents other scripts from seeing the submit

        const payload = {
            full_name: $('#name').val(),
            email: $('#email').val()
        };

        $.ajax({
            url: `${API_URL}/users/${userId}`,
            method: 'PUT',
            headers: { 
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json' 
            },
            data: JSON.stringify(payload),
            success: function () {
                alert("Saved!");
                window.location.href = 'users.html';
            }
        });
    });

    // 4. Navigation (Direct override)
    $(document).on('click', '.back, .cancel-btn', function(e) {
        e.preventDefault();
        window.location.replace('users.html');
    });

    $('.user').on('click', function() {
        localStorage.clear();
        window.location.href = 'login.html';
    });

    loadUser();
});