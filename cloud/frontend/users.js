$(document).ready(function () {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const API_URL = '/api';
    const PAGE_SIZE = 10;
    let currentPage = 1;
    let allUsers = []; 
    let filteredUsers = []; 

    // 1. Initial Auth Check
    if (!token) { 
        window.location.href = 'login.html'; 
        return; 
    }

    // 2. Set Circle Text to Log Out (Requested Change)
    $('.user').text("LOG OUT");

    /**
     * Fetch users from API
     */
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
                console.error("API Error:", xhr);
                $(".history-table tbody").html('<tr><td colspan="5" style="color:red; text-align:center;">Error loading users from database.</td></tr>');
            }
        });
    }

    /**
     * Render the table based on search and pagination
     */
    function renderTable() {
        const tbody = $(".history-table tbody");
        tbody.empty();

        const start = (currentPage - 1) * PAGE_SIZE;
        const end = start + PAGE_SIZE;
        const pageItems = filteredUsers.slice(start, end);

        if (pageItems.length === 0) {
            tbody.append('<tr><td colspan="5" style="text-align:center;">No matching users found.</td></tr>');
        } else {
            pageItems.forEach(user => {
                const regDate = user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A';
                
                // Ensuring we capture user_id from Supabase
                const userId = user.user_id || user.id; 
                const device = user.assigned_device || 'None';

                tbody.append(`
                    <tr>
                        <td>${user.full_name || 'No Name'}</td>
                        <td>${user.email || 'No Email'}</td>
                        <td>${regDate}</td>
                        <td><code style="background:#f0f0f0; padding:2px 5px; border-radius:3px; border: 1px solid #ddd;">${device}</code></td>
                        <td>
                            <button type="button" class="edit-btn" data-id="${userId}" style="cursor:pointer; background:white; border:1px solid #9400D3; border-radius:4px; padding:4px 12px; font-family:inherit;">🖊️ EDIT</button>
                        </td>
                    </tr>
                `);
            });
        }

        updatePaginationUI();
    }

    /**
     * Update Pagination UI
     */
    function updatePaginationUI() {
        const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE) || 1;
        $('.page-info').text(`Page ${currentPage} of ${totalPages}`);
        $('.prev').prop('disabled', currentPage === 1);
        $('.next').prop('disabled', currentPage >= totalPages);
    }

    /* --- Event Handlers --- */

    // Search logic
    $('#user-search').on('keyup', function() {
        const term = $(this).val().toLowerCase().trim();
        
        filteredUsers = allUsers.filter(u => {
            const name = (u.full_name || "").toLowerCase();
            const email = (u.email || "").toLowerCase();
            const device = (u.assigned_device || "").toLowerCase();
            
            // Returns true if the term matches any of the three fields
            return name.includes(term) || 
                   email.includes(term) || 
                   device.includes(term);
        });

        currentPage = 1; // Reset to first page after searching
        renderTable();
    });

    /**
     * FIXED: Edit Button Redirect logic
     */
    $(document).on("click", ".edit-btn", function (e) {
        e.preventDefault();
        e.stopPropagation(); 

        const id = $(this).attr("data-id");
        console.log("Edit requested for ID:", id);
        
        if (id && id !== "undefined" && id !== "null") {
            window.location.href = `editUser.html?id=${encodeURIComponent(id)}`;
        } else {
            console.error("Missing User ID in button data-id attribute");
            alert("Error: User ID not found. Ensure 'user_id' is returned by your API.");
        }
    });

    // Navigation
    $(".back, .home, .cur-values").on("click", function() {
        window.location.href = "index.html";
    });

    // Pagination
    $('.next').on('click', function() { 
        const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE);
        if (currentPage < totalPages) { currentPage++; renderTable(); }
    });

    $('.prev').on('click', function() { 
        if (currentPage > 1) { currentPage--; renderTable(); }
    });

    // Logout via the "Log out" circle
    $('.user').on('click', function() {
        if(confirm('Do you want to log out?')) {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = 'login.html';
        }
    });

    // Init
    loadUsers();
});