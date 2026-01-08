$(document).ready(function () {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            $('.user').text((payload.user_name || "USER").substring(0, 5).toUpperCase());
        } catch (e) {
            console.error("Token parsing error");
        }
    }

    function loadUsers() {
        $.ajax({
            url: '/api/users', 
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token },
            success: function (users) {
                const tbody = $(".history-table tbody");
                tbody.empty();

                if (!Array.isArray(users)) {
                    tbody.append('<tr><td colspan="5">Invalid data format from server.</td></tr>');
                    return;
                }

                users.forEach(user => {
                    const regDate = user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A';
                    const userId = user.id || 'N/A';
                    
                    const row = `
                        <tr>
                            <td>${user.full_name}</td>
                            <td>${user.email}</td>
                            <td>${regDate}</td>
                            <td>${user.assigned_device || 'None'}</td>
                            <td>
                                <button class="edit-btn" data-id="${userId}">🖊️ EDIT</button>
                            </td>
                        </tr>
                    `;
                    tbody.append(row);
                });
            },
            error: function (xhr) {
                const errorMsg = xhr.responseJSON?.error || 'Endpoint not found';
                $(".history-table tbody").html(`<tr><td colspan="5">Error: ${errorMsg}</td></tr>`);
            }
        });
    }

    // Event Delegation for Edit Button
    $(document).on("click", ".edit-btn", function () {
        const userId = $(this).data("id");
        if (userId && userId !== 'N/A') {
            window.location.href = `editUser.html?id=${userId}`;
        } else {
            alert("Cannot edit user: ID missing.");
        }
    });

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