$(document).ready(function () {
    console.log("Edit User Script Loaded");

    const API_URL = '/api';
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    
    // Extract ID from URL
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('id');

    // 1. Initial Auth Check
    if (!token) { 
        console.warn("No token found, redirecting to login...");
        window.location.href = 'login.html'; 
        return; 
    }

    if (!userId) {
        console.error("No User ID found in URL parameters.");
        alert("Error: No user specified.");
        window.location.href = 'users.html';
        return;
    }

    /**
     * Fetch the specific user's data
     */
    function loadUserData() {
        $.ajax({
            url: `${API_URL}/users/${userId}`,
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token },
            success: function (user) {
                console.log("User data fetched:", user);
                // Map fields based on your Supabase table columns
                $('#name').val(user.full_name || user.user_name || '');
                $('#email').val(user.email || '');
                
                // Handle date formatting (YYYY-MM-DD for input type="date")
                if (user.created_at) {
                    const datePart = user.created_at.split('T')[0];
                    $('#registration-date').val(datePart);
                }
            },
            error: function (xhr) {
                console.error("Error fetching user details:", xhr);
                alert("Could not find this user in the database.");
            }
        });
    }

    /**
     * Load list of available devices for the dropdown
     */
    function loadDevices() {
        $.ajax({
            url: `${API_URL}/devices`,
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token },
            success: function (devices) {
                const $select = $('#add-device');
                $select.empty().append('<option value="">Add device to assigned</option>');
                
                if (Array.isArray(devices)) {
                    devices.forEach(d => {
                        $select.append(`<option value="${d.device_id}">${d.device_name || d.device_id}</option>`);
                    });
                }
            },
            error: function (xhr) {
                console.error("Error loading devices list:", xhr);
            }
        });
    }

    /* --- Event Listeners --- */

    // Save Changes (Form Submit)
    $('#edit-device-form').on('submit', function (e) {
        e.preventDefault(); // CRITICAL: This stops the page from refreshing/redirecting to dash
        e.stopPropagation();

        const updatedData = {
            full_name: $('#name').val(),
            email: $('#email').val()
            // Password reset logic can be added here if needed
        };

        $.ajax({
            url: `${API_URL}/users/${userId}`,
            method: 'PUT',
            headers: { 
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(updatedData),
            success: function () {
                alert("User updated successfully!");
                window.location.href = 'users.html';
            },
            error: function (xhr) {
                console.error("Update failed:", xhr);
                alert("Failed to save changes. Please check your connection.");
            }
        });
    });

    // Delete Button logic
    $('.delete-btn').on('click', function (e) {
        e.preventDefault();
        if (confirm('Are you sure you want to PERMANENTLY delete this user?')) {
            $.ajax({
                url: `${API_URL}/users/${userId}`,
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + token },
                success: function () {
                    alert("User deleted.");
                    window.location.href = 'users.html';
                },
                error: function (xhr) {
                    console.error("Deletion failed:", xhr);
                    alert("Could not delete user.");
                }
            });
        }
    });

    // Cancel / Back Navigation
    $('.back, .cancel-btn').on('click', function (e) {
        e.preventDefault();
        window.location.href = 'users.html';
    });

    // Log out logic
    $('.user').on('click', function () {
        if (confirm('Do you want to log out?')) {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = 'login.html';
        }
    });

    // Run on initialization
    loadUserData();
    loadDevices();
});