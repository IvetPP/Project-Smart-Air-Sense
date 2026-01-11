$(document).ready(function () {
    const API_URL = window.location.origin + '/api';
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('id');

    // --- 1. Authentication & Log Out ---
    if (!token) { 
        window.location.href = 'login.html'; 
        return; 
    }

    // Set Logged-in Username logic
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        $('.user').text((payload.user_name || "LOG OUT").substring(0, 10).toUpperCase());
    } catch (e) { 
        console.error("Token parsing failed"); 
    }

    // Log Out with confirmation (Matches your device page logic)
    $('.user').on('click', function() { 
        if(confirm('Do you want to log out?')) { 
            localStorage.clear(); 
            window.location.href = 'login.html'; 
        }
    });

    if (!userId) { 
        window.location.href = 'users.html'; 
        return; 
    }

    // --- 2. Load User Data as Placeholders ---
    function loadUser() {
        $.ajax({
            url: `${API_URL}/users/${encodeURIComponent(userId)}`,
            method: 'GET',
            headers: { Authorization: 'Bearer ' + token },
            success: function(user) {
                // Mapping DB columns to Input Placeholders
                $('#full-name').attr('placeholder', user.full_name || 'Full Name');
                $('#email').attr('placeholder', user.email || 'Email');
                
                // Ensure values are empty so placeholders show
                $('#full-name').val('');
                $('#email').val('');
            },
            error: function(xhr) {
                console.error("Fetch Error:", xhr);
                alert('Could not fetch user details.');
            }
        });
    }

    // --- 3. Save Logic (Update) ---
    $('#edit-user-form').on('submit', function (e) {
        e.preventDefault();

        const nameVal = $('#full-name').val().trim();
        const emailVal = $('#email').val().trim();
        const passVal = $('#password-input').val().trim();

        // Construct payload only with fields that have values
        const payload = {};
        if (nameVal !== "") payload.full_name = nameVal;
        if (emailVal !== "") payload.email = emailVal;
        if (passVal !== "") payload.password = passVal;

        // If user clicked save without typing anything
        if (Object.keys(payload).length === 0) {
            alert("No changes entered to save.");
            return;
        }

        $.ajax({
            url: `${API_URL}/users/${encodeURIComponent(userId)}`,
            method: 'PUT',
            headers: { 
                Authorization: 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(payload),
            success: function() {
                alert('User updated successfully!');
                window.location.href = 'users.html';
            },
            error: function(xhr) {
                alert('Error: ' + (xhr.responseJSON?.error || 'Server error'));
            }
        });
    });

    // --- 4. Delete Logic ---
    $('.delete-btn').on('click', function() {
        if(confirm('Are you sure you want to delete this user?')) {
            $.ajax({
                url: `${API_URL}/users/${encodeURIComponent(userId)}`,
                method: 'DELETE',
                headers: { Authorization: 'Bearer ' + token },
                success: function() {
                    alert('User deleted.');
                    window.location.href = 'users.html';
                },
                error: function(xhr) {
                    alert('Delete failed: ' + (xhr.responseJSON?.error || 'Server error'));
                }
            });
        }
    });

    // --- 5. Navigation ---
    $('.back, .cancel-btn').on('click', function(e) {
        e.preventDefault();
        window.location.href = 'users.html';
    });

    // Initial load
    loadUser();
});