$(document).ready(function () {
    const API_URL = '/api';
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('id');

    // Load User Data
    if (userId) {
        $.ajax({
            url: `${API_URL}/users/${userId}`,
            headers: { Authorization: 'Bearer ' + token },
            success: function(user) {
                $('#name').val(user.user_name);
                $('#email').val(user.email || '');
                $('#registration-date').val(user.created_at?.split('T')[0]);
            }
        });
    }

    // Load list of ALL devices for the dropdown
    $.ajax({
        url: `${API_URL}/devices`,
        headers: { Authorization: 'Bearer ' + token },
        success: function(devices) {
            const $select = $('#add-device');
            devices.forEach(d => $select.append(`<option value="${d.device_id}">${d.device_name}</option>`));
        }
    });

    $('.delete-btn').on('click', function() {
        if(confirm('Delete this user?')) {
            $.ajax({
                url: `${API_URL}/users/${userId}`,
                method: 'DELETE',
                headers: { Authorization: 'Bearer ' + token },
                success: () => window.location.href = 'users.html'
            });
        }
    });

    $('.back, .cancel-btn').on('click', () => window.location.href = 'users.html');
});