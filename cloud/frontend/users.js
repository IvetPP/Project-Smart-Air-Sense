$(document).ready(function () {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const API_URL = '/api';
    const PAGE_SIZE = 10;
    let currentPage = 1;
    let allUsers = []; // Store users for local search/filtering

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

    /**
     * Loads users from the API and handles rendering
     */
    function loadUsers() {
        $.ajax({
            url: `${API_URL}/users`, 
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token },
            success: function (users) {
                allUsers = users; // Save data for search filtering
                renderUserTable(allUsers);
            },
            error: function (xhr) {
                console.error("Failed to load users", xhr.responseJSON);
                const errorMsg = xhr.responseJSON?.error || 'Server Error';
                $(".history-table tbody").html(`<tr><td colspan="5" style="color: red;">Error: ${errorMsg}</td></tr>`);
            }
        });
    }

    /**
     * Renders the table and updates pagination text
     */
    function renderUserTable(data) {
        const tbody = $(".history-table tbody");
        tbody.empty();

        if (!Array.isArray(data) || data.length === 0) {
            tbody.append('<tr><td colspan="5">No users found.</td></tr>');
            updatePagination(0);
            return;
        }

        // Apply Pagination slicing
        const start = (currentPage - 1) * PAGE_SIZE;
        const end = start + PAGE_SIZE;
        const paginatedItems = data.slice(start, end);

        paginatedItems.forEach(user => {
            const regDate = user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A';
            const userId = user.user_id || user.id || 'N/A';
            
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
                        <button class="edit-btn" data-id="${userId}" style="cursor: pointer; background: none; border: 1px solid #9400D3; border-radius: 4px; padding: 2px 10px;">🖊️ EDIT</button>
                    </td>
                </tr>
            `;
            tbody.append(row);
        });

        updatePagination(data.length);
    }

    /**
     * Updates pagination buttons and "Page X of Y" text
     */
    function updatePagination(totalItems) {
        const totalPages = Math.ceil(totalItems / PAGE_SIZE) || 1;
        $('.page-info').text(`Page ${currentPage} of ${totalPages}`);
        
        $('.prev').prop('disabled', currentPage === 1);
        $('.next').prop('disabled', currentPage >= totalPages);
    }

    /* --- Event Handlers --- */

    // Search Bar Filter
    $(document).on('keyup', '#user-search', function() {
        const searchTerm = $(this).val().toLowerCase();
        const filteredUsers = allUsers.filter(user => {
            return (user.full_name?.toLowerCase().includes(searchTerm) || 
                    user.email?.toLowerCase().includes(searchTerm));
        });
        currentPage = 1; // Reset to page 1 on search
        renderUserTable(filteredUsers);
    });

    // Edit User - Fixed Redirect
    $(document).on("click", ".edit-btn", function () {
        const userId = $(this).data("id");
        if (userId && userId !== 'N/A') {
            window.location.href = `editUser.html?id=${encodeURIComponent(userId)}`;
        } else {
            alert("Cannot edit user: ID is missing.");
        }
    });

    // Navigation redirects
    $(".back, .home, .cur-values").on("click", () => window.location.href = "index.html");

    // Pagination Click Events
    $('.next').on('click', () => { 
        const totalPages = Math.ceil(allUsers.length / PAGE_SIZE);
        if (currentPage < totalPages) { currentPage++; renderUserTable(allUsers); }
    });

    $('.prev').on('click', () => { 
        if (currentPage > 1) { currentPage--; renderUserTable(allUsers); }
    });

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