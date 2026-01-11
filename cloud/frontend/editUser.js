$(document).ready(async function () {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('id');

    if (!userId) {
        console.error("No user ID found in URL");
        return;
    }

    // --- 1. Load User Data ---
    async function loadUser() {
        const { data: user, error } = await supabase
            .from('users')
            .select('user_id, user_name, email, full_name, created_at')
            .eq('user_id', userId)
            .single();

        if (error) {
            console.error('Error loading user:', error.message);
            return;
        }

        if (user) {
            // Mapping values to your inputs
            $('#name').val(user.user_name);
            $('#full-name').val(user.full_name || '');
            $('#email').val(user.email || '');
            $('#registration-date').val(user.created_at?.split('T')[0]);
        }
    }

    // --- 2. Change Password Function ---
    async function updatePassword(newPassword) {
        if (!newPassword) return alert("Please enter a new password.");

        const { error } = await supabase
            .from('users')
            .update({ password: newPassword }) // Directly updating the password column
            .eq('user_id', userId);

        if (error) {
            alert('Update failed: ' + error.message);
        } else {
            alert('Password changed successfully!');
            $('#password-input').val(''); // Clear the field
        }
    }

    // --- 3. Save General Profile Changes ---
    async function updateProfile() {
        const updatedData = {
            user_name: $('#name').val(),
            full_name: $('#full-name').val(),
            email: $('#email').val()
        };

        const { error } = await supabase
            .from('users')
            .update(updatedData)
            .eq('user_id', userId);

        if (error) alert('Error: ' + error.message);
        else alert('Profile updated!');
    }

    // --- Event Handlers ---

    // Password change trigger (replace #change-pw-btn with your actual ID)
    $('#change-pw-btn').on('click', function() {
        const newPass = $('#password-input').val();
        updatePassword(newPass);
    });

    // Save button trigger
    $('.save-btn').on('click', updateProfile);

    // Delete trigger
    $('.delete-btn').on('click', async function() {
        if(confirm('Are you sure you want to delete this user?')) {
            const { error } = await supabase
                .from('users')
                .delete()
                .eq('user_id', userId);

            if (!error) window.location.href = 'users.html';
        }
    });

    $('.back, .cancel-btn').on('click', () => window.location.href = 'users.html');

    // Initial Execution
    loadUser();
});