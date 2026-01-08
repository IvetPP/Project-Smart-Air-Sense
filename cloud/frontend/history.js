$(document).ready(function () {
    const API_BASE_URL = window.location.origin + '/api';
    const PAGE_SIZE = 10;
    let currentPage = 1;

    // Initialization
    setupUserDisplay();
    loadDeviceList();
    loadMeasurements();

    /* ============================
       CORE FUNCTIONS
    ============================ */
    function setupUserDisplay() {
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(window.atob(base64));
            
            // Get username and handle display
            const name = payload.user_name || payload.username || "USER";
            // Show first 5 letters of username centered in the circle
            $('.user.pers').text(name.substring(0, 5).toUpperCase());
        } catch (e) {
            $('.user.pers').text("USER");
        }
    }

    function loadDeviceList() {
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
        $.ajax({
            url: `${API_BASE_URL}/devices`, // Changed to /devices for cleaner list
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token },
            success: function (data) {
                const deviceSelect = $('#filter-device');
                deviceSelect.find('option:not(:first)').remove();
                
                data.forEach(dev => {
                    const id = dev.device_id;
                    const name = dev.device_name || id;
                    deviceSelect.append(`<option value="${id}">${name}</option>`);
                });
            },
            error: function() {
                // Fallback to manual if devices route fails
                console.warn("Using fallback device list");
            }
        });
    }

    function loadMeasurements() {
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
        const offset = (currentPage - 1) * PAGE_SIZE;
        const filters = {
            device_id: $('#filter-device').val(),
            parameter: $('#filter-parameter').val(),
            from: $('#filter-from').val(),
            to: $('#filter-to').val()
        };

        let url = `${API_BASE_URL}/measurements?limit=${PAGE_SIZE}&offset=${offset}`;
        if (filters.device_id) url += `&device_id=${encodeURIComponent(filters.device_id)}`;
        if (filters.parameter) url += `&parameter=${encodeURIComponent(filters.parameter)}`;
        if (filters.from) url += `&from=${encodeURIComponent(filters.from)}`;
        if (filters.to) url += `&to=${encodeURIComponent(filters.to)}`;

        $.ajax({
            url: url,
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token },
            success: function (response) {
                const rows = response.measurements || [];
                const total = response.totalCount || 0;
                renderTable(rows);
                
                $('.prev').prop('disabled', currentPage === 1);
                $('.next').prop('disabled', (currentPage * PAGE_SIZE) >= total);
                const totalPages = Math.ceil(total / PAGE_SIZE);
                $('.page-info').text(`Page ${currentPage} of ${totalPages || 1}`);
            }
        });
    }

    function renderTable(rows) {
        const $tbody = $('.history-table tbody');
        $tbody.empty();

        if (!rows.length) {
            $tbody.append('<tr><td colspan="6">No data found.</td></tr>');
            return;
        }

        rows.forEach(row => {
            let params = [];
            let values = [];
            let statusHtml = '';

            const checkAndAdd = (val, label, unit, typeClass, min, max) => {
                if (val !== null && val !== undefined && !isNaN(val)) {
                    params.push(label);
                    values.push(`${Number(val).toFixed(1)}${unit}`);
                    const isOutOfRange = (val < min || val > max);
                    const statusText = isOutOfRange ? 'Out of range' : 'Normal';
                    const statusClass = isOutOfRange ? 'warning' : 'normal-text';
                    statusHtml += `<div class="${typeClass}"><span class="${statusClass}">${statusText}</span></div>`;
                }
            };

            checkAndAdd(row.co2, "CO2", " ppm", "co2", 400, 1000);
            checkAndAdd(row.temperature, "Temp", " °C", "temp", 20, 24);
            checkAndAdd(row.humidity, "Hum", " %", "hum", 40, 60);
            checkAndAdd(row.pressure, "Press", " hPa", "bar", 1013, 1100);

            const timestamp = row.created_at || row.timestamp;
            const deviceName = row.device_name || row.device_id || 'Unknown';

            $tbody.append(`
                <tr>
                    <td>${new Date(timestamp).toLocaleString()}</td>
                    <td>${deviceName}</td>
                    <td>${params.join('<br>')}</td>
                    <td>${values.join('<br>')}</td>
                    <td><span class="status ok">Active</span></td>
                    <td>${statusHtml || '-'}</td>
                </tr>
            `);
        });
    }

    /* ============================
       EVENT HANDLERS
    ============================ */
    $('.filter-btn.device').on('click', () => $('.device-panel').slideToggle(200));
    $('.filter-btn.time').on('click', () => $('.time-panel').slideToggle(200));
    $('.filter-btn.par').on('click', () => $('.param-panel').slideToggle(200));

    $('#filter-device, #filter-parameter, #filter-from, #filter-to').on('change', () => {
        currentPage = 1;
        loadMeasurements();
    });

    $('#clear-filters').on('click', () => {
        $('#filter-device, #filter-parameter, #filter-from, #filter-to').val('');
        loadMeasurements();
    });

    $('.next').on('click', () => { currentPage++; loadMeasurements(); });
    $('.prev').on('click', () => { if (currentPage > 1) { currentPage--; loadMeasurements(); } });
    $(".back").on("click", () => window.location.href = 'index.html');

    $('.user').on('click', function() {
        if(confirm("Do you want to log out?")) {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = 'login.html';
        }
    });
});