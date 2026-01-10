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

    // 2. Set Profile Name in Circle
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        $('.user').text((payload.user_name || "USER").substring(0, 5).toUpperCase());
    } catch (e) { 
        console.error("Token parsing error"); 
    }

    /**
     * Fetch users from API
     */
    function loadUsers() {
        $.ajax({
            url: `${API_URL}/users`,
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token },
            success: function (data) {
                // Ensure we have an array
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
                
                // FIX: prioritize user_id for Supabase, fallback to id
                const userId = user.user_id || user.id; 
                const device = user.assigned_device || 'None';

                tbody.append(`
                    <tr>
                        <td>${user.full_name || 'No Name'}</td>
                        <td>${user.email || 'No Email'}</td>
                        <td>${regDate}</td>
                        <td><code style="background:#f0f0f0; padding:2px 5px; border-radius:3px; border: 1px solid #ddd;">${device}</code></td>
                        <td>
                            <button class="edit-btn" data-id="${userId}" style="cursor:pointer; background:white; border:1px solid #9400D3; border-radius:4px; padding:4px 12px; font-family:inherit;">🖊️ EDIT</button>
                        </td>
                    </tr>
                `);
            });
        }

        updatePaginationUI();
    }

    /**
     * Update Pagination Text and Button States
     */
    function updatePaginationUI() {
        const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE) || 1;
        
        // Match wireframe requirement: "Page X of Y"
        $('.page-info').text(`Page ${currentPage} of ${totalPages}`);
        
        $('.prev').prop('disabled', currentPage === 1);
        $('.next').prop('disabled', currentPage >= totalPages);
    }

    /* --- Event Handlers --- */

    // Search: by email or device name
    $('#user-search').on('keyup', function() {
        const term = $(this).val().toLowerCase().trim();
        
        filteredUsers = allUsers.filter(u => {
            const email = (u.email || "").toLowerCase();
            const device = (u.assigned_device || "").toLowerCase();
            return email.includes(term) || device.includes(term);
        });

        currentPage = 1; 
        renderTable();
    });

    // FIX: Redirect to editUser.html using the captured ID
    $(document).on("click", ".edit-btn", function (e) {
        e.preventDefault();
        const id = $(this).attr("data-id");
        
        if (id && id !== "undefined" && id !== "null") {
            window.location.href = `editUser.html?id=${encodeURIComponent(id)}`;
        } else {
            alert("Error: Missing User ID. Check if 'user_id' is returned from the database.");
        }
    });

    // Navigation Redirects
    $(".back, .home, .cur-values").on("click", function() {
        window.location.href = "index.html";
    });

    // Pagination Controls
    $('.next').on('click', function() { 
        const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE);
        if (currentPage < totalPages) {
            currentPage++; 
            renderTable(); 
        }
    });

    $('.prev').on('click', function() { 
        if (currentPage > 1) { 
            currentPage--; 
            renderTable(); 
        }
    });

    // Logout
    $('.user').on('click', function() {
        if(confirm('Do you want to log out?')) {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = 'login.html';
        }
    });

    // Run on Load
    loadUsers();
});