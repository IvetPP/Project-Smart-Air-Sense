$(document).ready(function () {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const API_URL = '/api';
    const PAGE_SIZE = 10;
    
    let currentPage = 1;
    let allUsers = []; 
    let filteredUsers = []; 
    let allDevices = []; // To store the list of all available devices

    // 1. Initial Auth Check
    if (!token) { 
        window.location.href = 'login.html'; 
        return; 
    }

    $('.user').text("LOG OUT");

    /**
     * Fetch all available devices for the dropdown options
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
                console.error("Failed to load devices list", xhr);
            }
        });
    }

    /**
     * Fetch users and their current device assignments
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
                $(".history-table tbody").html('<tr><td colspan="5" style="color:red; text-align:center;">Error loading users.</td></tr>');
            }
        });
    }

    /**
     * Render the table
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
                const userId = user.user_id || user.id;
                
                // Expecting user.device_ids to be an array from your API join: [1, 4, 7]
                const assignedIds = Array.isArray(user.assigned_device_ids) ? user.assigned_device_ids : [];

                // Generate <option> tags
                let optionsHtml = allDevices.map(dev => {
                    const isSelected = assignedIds.includes(dev.device_id) ? 'selected' : '';
                    return `<option value="${dev.device_id}" ${isSelected}>${dev.device_name || dev.name}</option>`;
                }).join('');

                tbody.append(`
                    <tr>
                        <td>${user.full_name || 'No Name'}</td>
                        <td>${user.email || 'No Email'}</td>
                        <td>${regDate}</td>
                        <td style="min-width: 250px;">
                            <select class="device-mapper" data-user-id="${userId}" multiple="multiple">
                                ${optionsHtml}
                            </select>
                        </td>
                        <td>
                            <button type="button" class="edit-btn" data-id="${userId}" style="cursor:pointer; background:white; border:1px solid #9400D3; border-radius:4px; padding:4px 12px;">🖊️ EDIT</button>
                        </td>
                    </tr>
                `);
            });

            // Initialize Select2 for the new dropdowns
            $('.device-mapper').select2({
                placeholder: "Select devices",
                allowClear: true,
                width: '100%'
            });
        }
        updatePaginationUI();
    }

    /**
     * Save Mapping Changes (Updates the device_users table)
     */
    $(document).on('change', '.device-mapper', function () {
        const userId = $(this).data('user-id');
        const selectedIds = $(this).val(); // Array of device IDs

        $.ajax({
            url: `${API_URL}/device-users/sync`,
            method: 'POST',
            headers: { 
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json' 
            },
            data: JSON.stringify({
                user_id: userId,
                device_ids: selectedIds
            }),
            success: function() {
                console.log(`Successfully updated devices for user ${userId}`);
            },
            error: function() {
                alert("Error updating device assignments.");
            }
        });
    });

    /**
     * Search & Pagination Logic
     */
    function updatePaginationUI() {
        const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE) || 1;
        $('.page-info').text(`Page ${currentPage} of ${totalPages}`);
        $('.prev').prop('disabled', currentPage === 1);
        $('.next').prop('disabled', currentPage >= totalPages);
    }

    $('#user-search').on('keyup', function() {
        const term = $(this).val().toLowerCase().trim();
        filteredUsers = allUsers.filter(u => {
            return (u.full_name || "").toLowerCase().includes(term) || 
                   (u.email || "").toLowerCase().includes(term);
        });
        currentPage = 1;
        renderTable();
    });

    $(document).on("click", ".edit-btn", function (e) {
        const id = $(this).attr("data-id");
        if (id) window.location.href = `editUser.html?id=${encodeURIComponent(id)}`;
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

    // STARTUP: Load Devices first, then Users
    loadDevices().then(loadUsers);
});