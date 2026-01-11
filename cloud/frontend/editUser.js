$(document).ready(async function () {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('id');
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');

    // --- 1. Authentication & Log Out Logic ---
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Dynamic Username Display
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        $('.user').text((payload.user_name || "LOG OUT").substring(0, 10).toUpperCase());
    } catch (e) {
        console.error("Token parsing failed");
    }

    // Log Out Button (Matches your requested behavior)
    $('.user').on('click', function() {
        if(confirm('Do you want to log out?')) {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = 'login.html';
        }
    });

    if (!userId) {
        console.error("No user ID found in URL");
        return;
    }

    // --- 2. Load User Data ---
    async function loadUser() {
        const { data: user, error } = await supabase
            .from('users')
            .select('full_name, email')
            .eq('user_id', userId)
            .single();

        if (error) {
            console.error('Error loading user:', error.message);
            return;
        }

        if (user) {
            // Set values as placeholders or values depending on preference
            // Setting as .val() allows the user to see/edit current data
            $('#full-name').val(user.full_name || '');
            $('#email').val(user.email || '');
        }
    }

    // --- 3. Save Changes (Profile + Password) ---
    $('#edit-user-form').on('submit', async function (e) {
        e.preventDefault();

        const updatedData = {
            full_name: $('#full-name').val(),
            email: $('#email').val()
        };

        const newPassword = $('#password-input').val();
        
        // If user typed a new password, include it in the update
        if (newPassword && newPassword.trim() !== "") {
            updatedData.password = newPassword; 
        }

        const { error } = await supabase
            .from('users')
            .update(updatedData)
            .eq('user_id', userId);

        if (error) {
            alert('Update failed: ' + error.message);
        } else {
            alert('User updated successfully!');
            window.location.href = 'users.html';
        }
    });

    // --- 4. Delete Logic ---
    $('.delete-btn').on('click', async function() {
        if(confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            const { error } = await supabase
                .from('users')
                .delete()
                .eq('user_id', userId);

            if (error) {
                alert('Delete failed: ' + error.message);
            } else {
                window.location.href = 'users.html';
            }
        }
    });

    // --- 5. Navigation ---
    $('.back, .cancel-btn').on('click', () => window.location.href = 'users.html');

    // Initial load
    loadUser();
});