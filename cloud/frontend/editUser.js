$(document).ready(async function () {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('id');
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');

    // --- 1. Authentication & Log Out (Same as your reference) ---
    if (!token) { 
        window.location.href = 'login.html'; 
        return; 
    }

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        $('.user').text((payload.user_name || "LOG OUT").substring(0, 10).toUpperCase());
    } catch (e) { 
        console.error("Token parsing failed"); 
    }

    $('.user').on('click', function() { 
        if(confirm('Do you want to log out?')) { 
            localStorage.clear(); 
            window.location.href='login.html'; 
        }
    });

    if (!userId) {
        console.error("No user ID found in URL");
        return;
    }

    // --- 2. Load User Data (full_name and email) ---
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
            $('#full-name').val(user.full_name || '');
            $('#email').val(user.email || '');
        }
    }

    // --- 3. Save Logic (Profile + Password) ---
    $('#edit-user-form').on('submit', async function (e) {
        e.preventDefault();

        const updatedData = {
            full_name: $('#full-name').val(),
            email: $('#email').val()
        };

        const newPass = $('#password-input').val();
        if (newPass && newPass.trim() !== "") {
            updatedData.password = newPass; // Only update password if field is not empty
        }

        const { error } = await supabase
            .from('users')
            .update(updatedData)
            .eq('user_id', userId);

        if (error) {
            alert('Update failed: ' + error.message);
        } else {
            alert('User successfully updated!');
            window.location.href = 'users.html';
        }
    });

    // --- 4. Delete Logic ---
    $('.delete-btn').on('click', async function() {
        if(confirm('Are you sure you want to delete this user?')) {
            const { error } = await supabase
                .from('users')
                .delete()
                .eq('user_id', userId);

            if (!error) {
                window.location.href = 'users.html';
            } else {
                alert('Error deleting user: ' + error.message);
            }
        }
    });

    // --- 5. Navigation ---
    $('.back, .cancel-btn').on('click', () => window.location.href = 'users.html');

    // Initial Execution
    loadUser();
});