$(document).ready(function () {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    
    // Dynamic Username Display
    if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        $('.user').text((payload.user_name || "USER").substring(0, 5).toUpperCase());
    }

    function loadUsers() {
        $.ajax({
            url: '/api/users', 
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token },
            success: function (users) {
                const tbody = $(".history-table tbody");
                tbody.empty();

                users.forEach(user => {
                    const regDate = user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A';
                    const row = `
                        <tr>
                            <td>${user.full_name || 'No Name Set'}</td>
                            <td>${user.user_name || user.email}</td>
                            <td>${regDate}</td>
                            <td>${user.assigned_device || 'None'}</td>
                            <td>
                                <button class="edit-btn" data-id="${user.id}">
                                    🖊️ EDIT
                                </button>
                            </td>
                        </tr>
                    `;
                    tbody.append(row);
                });
            },
            error: function (xhr) {
                console.error("Failed to load users", xhr);
                $(".history-table tbody").html('<tr><td colspan="5">Error loading users from database.</td></tr>');
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