$(document).ready(function () {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    
    // Dynamic Username Display
    if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        $('.user').text((payload.user_name || "USER").substring(0, 5).toUpperCase());
    }

    function loadUsers() {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    
    $.ajax({
        url: '/api/users', // This now matches app.use('/api/users', ...)
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token },
        success: function (users) {
            const tbody = $(".history-table tbody");
            tbody.empty();

            if (!Array.isArray(users)) {
                console.error("Expected array, got:", users);
                return;
            }

            users.forEach(user => {
                const regDate = user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A';
                const row = `
                    <tr>
                        <td>${user.full_name}</td>
                        <td>${user.email}</td>
                        <td>${regDate}</td>
                        <td>${user.assigned_device || 'None'}</td>
                        <td>
                            <button class="edit-btn" data-id="${user.id}">🖊️ EDIT</button>
                        </td>
                    </tr>
                `;
                tbody.append(row);
            });
        },
        error: function (xhr) {
            console.error("Failed to load users", xhr.responseJSON);
            $(".history-table tbody").html(`<tr><td colspan="5">Error: ${xhr.responseJSON?.error || 'Endpoint not found'}</td></tr>`);
        }
    });
}

    // Edit button click - use the real database ID
    $(document).on("click", ".edit-btn", function () {
        const userId = $(this).data("id");
        window.location.href = `editUser.html?id=${userId}`;
    });

    // Navigation
    $(".back, .home").on("click", () => window.location.href = "index.html");

    $('.user').on('click', function () {
        if (confirm('Do you want to log out?')) {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = 'login.html';
        }
    });

    loadUsers();
});