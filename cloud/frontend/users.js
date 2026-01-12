$(document).ready(function () {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const API_URL = '/api';
    const PAGE_SIZE = 10;
    
    let currentPage = 1;
    let allUsers = []; 
    let filteredUsers = []; 
    let allDevices = []; 

    if (!token) { 
        window.location.href = 'login.html'; 
        return; 
    }

    // Update UI for Logout
    $('.user').text("LOG OUT");

    /**
     * Fetch all available devices for dropdown options
     */
    function loadDevices() {
        return $.ajax({
            url: `${API_URL}/devices`, 
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token },
            success: function (data) {
                allDevices = Array.isArray(data) ? data : [];
            },
            error: function (xhr) {
                console.error("Failed to load devices list:", xhr);
            }
        });
    }

    /**
     * Fetch users from updated API
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
     * Render the table with Select2 Dropdowns
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
                const userId = user.id || user.user_id;
                
                // Get current assigned IDs from the backend array
                const assignedIds = Array.isArray(user.assigned_device_ids) ? user.assigned_device_ids : [];

                // Build <option> elements
                let optionsHtml = allDevices.map(dev => {
                    const isSelected = assignedIds.includes(dev.device_id) ? 'selected' : '';
                    return `<option value="${dev.device_id}" ${isSelected}>${dev.device_name || dev.device_id}</option>`;
                }).join('');

                tbody.append(`
                    <tr>
                        <td>${user.full_name}</td>
                        <td>${user.email}</td>
                        <td>${regDate}</td>
                        <td style="min-width: 250px;">
                            <select class="device-mapper" data-user-id="${userId}" multiple="multiple">
                                ${optionsHtml}
                            </select>
                        </td>
                        <td>
                            <button type="button" class="edit-btn" data-id="${userId}" style="cursor:pointer; background:white; border:1px solid #9400D3; border-radius:4px; padding:4px 12px; font-family:inherit;">🖊️ EDIT</button>
                        </td>
                    </tr>
                `);
            });

            // Initialize/Re-initialize Select2 on the new elements
            $('.device-mapper').select2({
                placeholder: "Assign devices...",
                allowClear: true,
                width: '100%'
            });
        }
        updatePaginationUI();
    }

    /**
     * Save Mapping Changes to device_users table
     */
    $(document).on('change', '.device-mapper', function () {
        const userId = $(this).data('user-id');
        const selectedIds = $(this).val(); // This is an array: ["id1", "id2"]

        $.ajax({
            url: `${API_URL}/device-users/sync`,
            method: 'POST',
            headers: { 
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json' 
            },
            data: JSON.stringify({
                user_id: userId,
                device_ids: selectedIds || []
            }),
            success: function() {
                console.log(`Sync successful for User: ${userId}`);
            },
            error: function(xhr) {
                console.error("Sync Error:", xhr);
                alert("Failed to update device assignments.");
            }
        });
    });

    /**
     * Update Pagination UI
     */
    function updatePaginationUI() {
        const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE) || 1;
        $('.page-info').text(`Page ${currentPage} of ${totalPages}`);
        $('.prev').prop('disabled', currentPage === 1);
        $('.next').prop('disabled', currentPage >= totalPages);
    }

    /**
     * Search logic (Handles Name, Email, and Assigned Devices)
     */
    $('#user-search').on('keyup', function() {
        const term = $(this).val().toLowerCase().trim();
        
        filteredUsers = allUsers.filter(u => {
            const name = (u.full_name || "").toLowerCase();
            const email = (u.email || "").toLowerCase();
            
            // Check if any of the user's assigned devices match the search term name
            const deviceMatch = allDevices.some(dev => 
                u.assigned_device_ids.includes(dev.device_id) && 
                (dev.device_name || "").toLowerCase().includes(term)
            );

            return name.includes(term) || email.includes(term) || deviceMatch;
        });

        currentPage = 1;
        renderTable();
    });

    // Navigation and Buttons
    $(document).on("click", ".edit-btn", function (e) {
        const id = $(this).attr("data-id");
        if (id) {
            window.location.href = `editUser.html?id=${encodeURIComponent(id)}`;
        }
    });

    $(".back, .home").on("click", function() {
        window.location.href = "index.html";
    });

    $('.next').on('click', function() { currentPage++; renderTable(); });
    $('.prev').on('click', function() { currentPage--; renderTable(); });

    $('.user').on('click', function() {
        if(confirm('Do you want to log out?')) {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = 'login.html';
        }
    });

    // STARTUP: Load Devices first, then Load Users
    loadDevices().then(loadUsers);
});