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

    // UI Initializations
    $('.user').text("LOG OUT");

    // --- NAVIGATION CONTROLS ---
    
    // Back button (<)
    $('.back').on('click', () => window.location.href = 'index.html');

    // "Current values" button (returns to dashboard)
    $('.home').on('click', () => window.location.href = 'index.html');

    // --- DATA LOADING ---

    function loadDevices() {
        return $.ajax({
            url: `${API_URL}/devices`, 
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token },
            success: function (data) {
                allDevices = Array.isArray(data) ? data : [];
            }
        });
    }

    function loadUsers() {
        $.ajax({
            url: `${API_URL}/users`,
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token },
            success: function (data) {
                allUsers = Array.isArray(data) ? data : [];
                filteredUsers = [...allUsers];
                renderTable();
            }
        });
    }

    // --- TABLE RENDERING ---

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
                
                // Convert assigned IDs to Strings for accurate matching
                const assignedIds = Array.isArray(user.assigned_device_ids) 
                    ? user.assigned_device_ids.map(id => id.toString()) 
                    : [];

                let optionsHtml = allDevices.map(dev => {
                    const devIdStr = dev.device_id.toString();
                    const isSelected = assignedIds.includes(devIdStr) ? 'selected' : '';
                    return `<option value="${devIdStr}" ${isSelected}>${dev.device_name || dev.device_id}</option>`;
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
                            <button type="button" class="edit-btn" data-id="${userId}" style="cursor:pointer; background:white; border:1px solid #9400D3; border-radius:4px; padding:4px 12px;">🖊️ EDIT</button>
                        </td>
                    </tr>
                `);
            });

            // Re-initialize Select2 for the new rows
            $('.device-mapper').select2({
                placeholder: "No devices assigned",
                allowClear: true,
                width: '100%'
            });
        }
        updatePaginationUI();
    }

    // --- EVENT HANDLERS ---

    // Sync devices when selection changes
    $(document).on('change', '.device-mapper', function () {
        const userId = $(this).data('user-id');
        const selectedIds = $(this).val();

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
            })
        });
    });

    // Pagination logic
    function updatePaginationUI() {
        const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE) || 1;
        $('.page-info').text(`Page ${currentPage} of ${totalPages}`);
        $('.prev').prop('disabled', currentPage === 1);
        $('.next').prop('disabled', currentPage >= totalPages);
    }

    $('.next').on('click', function() { currentPage++; renderTable(); });
    $('.prev').on('click', function() { currentPage--; renderTable(); });

    // Search functionality
    $('#user-search').on('keyup', function() {
        const term = $(this).val().toLowerCase().trim();
        filteredUsers = allUsers.filter(u => {
            const nameMatch = (u.full_name || "").toLowerCase().includes(term);
            const emailMatch = (u.email || "").toLowerCase().includes(term);
            
            // Safety check: ensure assigned_device_ids exists before using .includes
            const userDeviceIds = Array.isArray(u.assigned_device_ids) ? u.assigned_device_ids : [];
            
            const deviceMatch = allDevices.some(dev => 
                userDeviceIds.includes(dev.device_id) && 
                (dev.device_name || "").toLowerCase().includes(term)
            );
            return nameMatch || emailMatch || deviceMatch;
        });
        currentPage = 1;
        renderTable();
    });

    // Edit User redirect
    $(document).on("click", ".edit-btn", function () {
        const id = $(this).attr("data-id");
        window.location.href = `editUser.html?id=${encodeURIComponent(id)}`;
    });

    // Logout logic
    $('.user').on('click', function() {
        if(confirm('Log out?')) {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = 'login.html';
        }
    });

    // --- INITIALIZE ---
    loadDevices().then(loadUsers);
});