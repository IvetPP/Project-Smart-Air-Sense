$(document).ready(function () {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    
    // Redirect if not logged in
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Dynamic Username Display
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        $('.user').text((payload.user_name || "USER").substring(0, 5).toUpperCase());
    } catch (e) {
        console.error("Token parsing error:", e);
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
                    console.error("Expected array, got:", users);
                    tbody.append('<tr><td colspan="5">Invalid data format from server.</td></tr>');
                    return;
                }

                if (users.length === 0) {
                    tbody.append('<tr><td colspan="5">No users found in the database.</td></tr>');
                    return;
                }

                users.forEach(user => {
                    const regDate = user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A';
                    const userId = user.id || 'N/A';
                    
                    // Style the device ID if it exists, otherwise show 'None'
                    const deviceDisplay = (user.assigned_device && user.assigned_device !== 'None') 
                        ? `<code style="background: #f4f4f4; padding: 2px 5px; border-radius: 4px; border: 1px solid #ddd;">${user.assigned_device}</code>`
                        : `<span style="color: #888; font-style: italic;">None</span>`;

                    const row = `
                        <tr>
                            <td>${user.full_name || 'No Name'}</td>
                            <td>${user.email || 'No Email'}</td>
                            <td>${regDate}</td>
                            <td>${deviceDisplay}</td>
                            <td>
                                <button class="edit-btn" data-id="${userId}" style="cursor: pointer;">🖊️ EDIT</button>
                            </td>
                        </tr>
                    `;
                    tbody.append(row);
                });
            },
            error: function (xhr) {
                console.error("Failed to load users", xhr.responseJSON);
                const errorMsg = xhr.responseJSON?.error || 'Endpoint not found or Server Error';
                $(".history-table tbody").html(`<tr><td colspan="5" style="color: red;">Error: ${errorMsg}</td></tr>`);
            }
        });
    }

    // Event Delegation for Edit Button - handles dynamically created buttons
    $(document).on("click", ".edit-btn", function () {
        const userId = $(this).data("id");
        if (userId && userId !== 'N/A') {
            window.location.href = `editUser.html?id=${userId}`;
        } else {
            alert("Cannot edit user: ID is missing.");
        }
    });

    // Navigation handlers
    $(".back, .home").on("click", () => window.location.href = "index.html");

    // Logout handler
    $('.user').on('click', function () {
        if (confirm('Do you want to log out?')) {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = 'login.html';
        }
    });

    // Initial load
    loadUsers();
});