/**
 * editUser.js
 */

// 1. IMMEDIATE REDIRECT PROTECTION
// This runs before anything else to try and "catch" the page before other scripts bounce you
(function() {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (!token) {
        window.location.replace('login.html');
    }
})();

$(document).ready(function () {
    console.log("Edit User Script Active");

    const API_URL = '/api';
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('id');

    // If a different script (like index.js) is trying to redirect, 
    // we try to cancel global click listeners that might be misfiring.
    $(document).off('click', '.back'); 
    $(document).off('click', '.home');

    if (!userId) {
        alert("No user selected.");
        window.location.href = 'users.html';
        return;
    }

    /**
     * Load User Details
     */
    function loadUser() {
        $.ajax({
            url: `${API_URL}/users/${userId}`,
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
            success: function (user) {
                console.log("Successfully loaded user:", user);
                // Supabase uses user_id, but check what the API returns
                $('#name').val(user.full_name || user.user_name || '');
                $('#email').val(user.email || '');
                
                if (user.created_at) {
                    $('#registration-date').val(user.created_at.split('T')[0]);
                }
            },
            error: function (xhr) {
                console.error("User Load Error:", xhr);
                if (xhr.status === 401) {
                    window.location.href = 'login.html';
                }
            }
        });
    }

    /**
     * Load All Devices for assignment dropdown
     */
    function loadDevices() {
        $.ajax({
            url: `${API_URL}/devices`,
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
            success: function (devices) {
                const $select = $('#add-device');
                $select.empty().append('<option value="">Add device to assigned</option>');
                devices.forEach(d => {
                    $select.append(`<option value="${d.device_id}">${d.device_name || d.device_id}</option>`);
                });
            }
        });
    }

    /* --- Event Listeners --- */

    // Save Form
    $('#edit-device-form').on('submit', function (e) {
        e.preventDefault();
        e.stopPropagation();

        const payload = {
            full_name: $('#name').val(),
            email: $('#email').val()
        };

        $.ajax({
            url: `${API_URL}/users/${userId}`,
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json' 
            },
            data: JSON.stringify(payload),
            success: function () {
                alert("User updated successfully");
                window.location.href = 'users.html';
            },
            error: function () {
                alert("Update failed.");
            }
        });
    });

    // Delete User
    $('.delete-btn').on('click', function (e) {
        e.preventDefault();
        if (confirm("Permanently delete this user?")) {
            $.ajax({
                url: `${API_URL}/users/${userId}`,
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
                success: () => window.location.href = 'users.html',
                error: () => alert("Delete failed.")
            });
        }
    });

    // Logout
    $('.user').on('click', function() {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = 'login.html';
    });

    // Fix for the "Back" button redirecting to dashboard instead of users list
    $('.back, .cancel-btn').on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        window.location.href = 'users.html';
    });

    // Initial load
    loadUser();
    loadDevices();
});