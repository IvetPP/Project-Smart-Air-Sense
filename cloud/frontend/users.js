$(document).ready(function () {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const API_URL = '/api';
    const PAGE_SIZE = 10;
    let currentPage = 1;
    let allUsers = []; 
    let filteredUsers = []; 

    if (!token) { 
        window.location.href = 'login.html'; 
        return; 
    }

    $('.user').text("LOG OUT");

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
                const devices = user.assigned_devices || [];
                
                // --- DROPDOWN LOGIC ---
                let deviceHtml = "";
                if (devices.length > 1) {
                    deviceHtml = `<select style="width:100%; padding:4px; border-radius:4px; border:1px solid #ddd; font-family:inherit; background:white;">`;
                    devices.forEach(d => {
                        deviceHtml += `<option value="${d.device_id}">${d.device_name}</option>`;
                    });
                    deviceHtml += `</select>`;
                } else if (devices.length === 1) {
                    deviceHtml = `<code style="background:#f0f0f0; padding:2px 5px; border-radius:3px; border: 1px solid #ddd;">${devices[0].device_name}</code>`;
                } else {
                    deviceHtml = `<span style="color:#999; font-style:italic;">No devices</span>`;
                }

                tbody.append(`
                    <tr>
                        <td>${user.full_name}</td>
                        <td>${user.email}</td>
                        <td>${regDate}</td>
                        <td>${deviceHtml}</td>
                        <td>
                            <button type="button" class="edit-btn" data-id="${user.id}" style="cursor:pointer; background:white; border:1px solid #9400D3; border-radius:4px; padding:4px 12px; font-family:inherit;">🖊️ EDIT</button>
                        </td>
                    </tr>
                `);
            });
        }
        updatePaginationUI();
    }

    // Search logic updated for multiple devices
    $('#user-search').on('keyup', function() {
        const term = $(this).val().toLowerCase().trim();
        
        filteredUsers = allUsers.filter(u => {
            const name = (u.full_name || "").toLowerCase();
            const email = (u.email || "").toLowerCase();
            const matchesDevice = (u.assigned_devices || []).some(d => 
                d.device_name.toLowerCase().includes(term) || d.device_id.toLowerCase().includes(term)
            );
            
            return name.includes(term) || email.includes(term) || matchesDevice;
        });

        currentPage = 1;
        renderTable();
    });

    function updatePaginationUI() {
        const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE) || 1;
        $('.page-info').text(`Page ${currentPage} of ${totalPages}`);
        $('.prev').prop('disabled', currentPage === 1);
        $('.next').prop('disabled', currentPage >= totalPages);
    }

    $(document).on("click", ".edit-btn", function (e) {
        const id = $(this).attr("data-id");
        if (id && id !== "undefined") {
            window.location.href = `editUser.html?id=${encodeURIComponent(id)}`;
        }
    });

    $('.next').on('click', function() { 
        if (currentPage < Math.ceil(filteredUsers.length / PAGE_SIZE)) { currentPage++; renderTable(); }
    });

    $('.prev').on('click', function() { 
        if (currentPage > 1) { currentPage--; renderTable(); }
    });

    $('.user').on('click', function() {
        if(confirm('Do you want to log out?')) {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = 'login.html';
        }
    });

    loadUsers();
});