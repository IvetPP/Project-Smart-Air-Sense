$(document).ready(function () {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const API_URL = '/api';
    const PAGE_SIZE = 10;
    let currentPage = 1;
    let allUsers = []; // All data from server
    let filteredUsers = []; // Data after search is applied

    if (!token) { window.location.href = 'login.html'; return; }

    // Set Profile Name
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        $('.user').text((payload.user_name || "USER").substring(0, 5).toUpperCase());
    } catch (e) { console.error("Token error"); }

    function loadUsers() {
        $.ajax({
            url: `${API_URL}/users`,
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token },
            success: function (data) {
                allUsers = Array.isArray(data) ? data : [];
                filteredUsers = [...allUsers];
                renderTable();
            },
            error: function (xhr) {
                $(".history-table tbody").html('<tr><td colspan="5" style="color:red">Error loading users</td></tr>');
            }
        });
    }

    function renderTable() {
        const tbody = $(".history-table tbody");
        tbody.empty();

        // Calculate pagination for the CURRENT filtered set
        const start = (currentPage - 1) * PAGE_SIZE;
        const end = start + PAGE_SIZE;
        const pageItems = filteredUsers.slice(start, end);

        if (pageItems.length === 0) {
            tbody.append('<tr><td colspan="5">No matching users found.</td></tr>');
        } else {
            pageItems.forEach(user => {
                const regDate = user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A';
                const userId = user.id || user.user_id;
                const device = user.assigned_device || 'None';

                tbody.append(`
                    <tr>
                        <td>${user.full_name || 'No Name'}</td>
                        <td>${user.email || 'No Email'}</td>
                        <td>${regDate}</td>
                        <td><code style="background:#f0f0f0; padding:2px 5px; border-radius:3px;">${device}</code></td>
                        <td>
                            <button class="edit-btn" data-id="${userId}" style="cursor:pointer; background:white; border:1px solid #9400D3; border-radius:4px; padding:2px 10px;">🖊️ EDIT</button>
                        </td>
                    </tr>
                `);
            });
        }

        updatePagination();
    }

    function updatePagination() {
        const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE) || 1;
        $('.page-info').text(`Page ${currentPage} of ${totalPages}`);
        $('.prev').prop('disabled', currentPage === 1);
        $('.next').prop('disabled', currentPage >= totalPages);
    }

    // --- Events ---

    // Search Logic: Email or Device Name
    $('#user-search').on('keyup', function() {
        const term = $(this).val().toLowerCase();
        filteredUsers = allUsers.filter(u => 
            (u.email?.toLowerCase().includes(term)) || 
            (u.assigned_device?.toLowerCase().includes(term))
        );
        currentPage = 1; 
        renderTable();
    });

    // Edit User Redirect (Corrected)
    $(document).on("click", ".edit-btn", function () {
        const id = $(this).data("id");
        if (id) window.location.href = `editUser.html?id=${id}`;
    });

    // Navigation
    $(".back, .home, .cur-values").on("click", () => window.location.href = "index.html");
    
    $('.next').on('click', () => { currentPage++; renderTable(); });
    $('.prev').on('click', () => { currentPage--; renderTable(); });

    $('.user').on('click', () => {
        if(confirm('Log out?')) { localStorage.clear(); window.location.href = 'login.html'; }
    });

    loadUsers();
});