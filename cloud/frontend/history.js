$(document).ready(function () {
    const API_BASE_URL = window.location.origin + '/api';
    const PAGE_SIZE = 10;
    let currentPage = 1;

    // Initial Load
    loadDeviceList();
    loadMeasurements();

    /* ============================
       EVENT HANDLERS
    ============================ */

    // Panel Toggles with Active State
    $('.filter-btn.device').on('click', function () { togglePanel('.device-panel', this); });
    $('.filter-btn.time').on('click', function () { togglePanel('.time-panel', this); });
    $('.filter-btn.par').on('click', function () { togglePanel('.param-panel', this); });

    function togglePanel(panelSelector, btn) {
        const isVisible = $(panelSelector).is(':visible');
        $('.device-panel, .time-panel, .param-panel').slideUp(200); // Close others
        $('.filter-btn').removeClass('active');
        
        if (!isVisible) {
            $(panelSelector).slideDown(200);
            $(btn).addClass('active');
        }
    }

    // Trigger reload on filter change
    $('#filter-device, #filter-parameter, #filter-from, #filter-to').on('change', function () {
        currentPage = 1; 
        loadMeasurements();
    });

    // Clear Filters
    $('#clear-filters').on('click', function() {
        $('#filter-device, #filter-parameter, #filter-from, #filter-to').val('');
        $('.filter-btn').removeClass('active');
        $('.device-panel, .time-panel, .param-panel').slideUp(200);
        currentPage = 1;
        loadMeasurements();
    });

    // Pagination
    $('.next').on('click', () => { currentPage++; loadMeasurements(); });
    $('.prev').on('click', () => { if (currentPage > 1) { currentPage--; loadMeasurements(); }});

    /* ============================
       CORE FUNCTIONS
    ============================ */

    function loadDeviceList() {
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
        $.ajax({
            url: `${API_BASE_URL}/devices`,
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token },
            success: function (data) {
                const $select = $('#filter-device');
                $select.find('option:not(:first)').remove();
                data.forEach(dev => {
                    $select.append(`<option value="${dev.device_id}">${dev.device_name || dev.device_id}</option>`);
                });
            }
        });
    }

    function loadMeasurements() {
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
        const offset = (currentPage - 1) * PAGE_SIZE;
        
        // Build URL parameters
        const params = new URLSearchParams({
            limit: PAGE_SIZE,
            offset: offset,
            device_id: $('#filter-device').val() || '',
            parameter: $('#filter-parameter').val() || '',
            from: $('#filter-from').val() || '',
            to: $('#filter-to').val() || ''
        });

        $.ajax({
            url: `${API_BASE_URL}/measurements?${params.toString()}`,
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token },
            success: function (response) {
                const rows = response.measurements || [];
                const total = response.totalCount || 0;

                renderTable(rows);
                updatePagination(total);
            },
            error: function (xhr) {
                if (xhr.status === 401) window.location.href = 'login.html';
                console.error("Fetch error:", xhr);
            }
        });
    }

    function updatePagination(total) {
        const totalPages = Math.ceil(total / PAGE_SIZE) || 1;
        $('.prev').prop('disabled', currentPage === 1);
        $('.next').prop('disabled', currentPage >= totalPages);
        $('.page-info').text(`Page ${currentPage} of ${totalPages}`);
    }

    function renderTable(rows) {
        const $tbody = $('.history-table tbody');
        $tbody.empty();

        if (!rows.length) {
            $tbody.append('<tr><td colspan="6" class="no-data">No data matching filters found.</td></tr>');
            return;
        }

        rows.forEach(row => {
            let details = [];

            const check = (val, label, unit, min, max) => {
                if (val === null || val === undefined) return;
                const isWarning = (min !== undefined && (val < min || val > max));
                details.push({
                    label: label,
                    value: `${Number(val).toFixed(1)} ${unit}`,
                    status: isWarning ? 'Out of range' : 'Normal',
                    class: isWarning ? 'warning' : 'normal-text'
                });
            };

            check(row.co2, "CO2", "ppm", 400, 1000);
            check(row.temperature, "Temp", "°C", 20, 24);
            check(row.humidity, "Hum", "%", 40, 60);
            check(row.pressure, "Press", "hPa", 1012, 1014); // Example tight range

            const timestamp = new Date(row.created_at || row.timestamp).toLocaleString('cs-CZ');
            
            // Build multi-line content for columns
            const labelsHtml = details.map(d => `<div>${d.label}</div>`).join('');
            const valuesHtml = details.map(d => `<div><strong>${d.value}</strong></div>`).join('');
            const statusHtml = details.map(d => `<div class="${d.class}">${d.status}</div>`).join('');

            $tbody.append(`
                <tr>
                    <td>${timestamp}</td>
                    <td><span class="device-tag">${row.device_name || row.device_id}</span></td>
                    <td>${labelsHtml}</td>
                    <td>${valuesHtml}</td>
                    <td>${statusHtml}</td>
                    <td><span class="status-pill status-active">Active</span></td>
                </tr>
            `);
        });
    }

    // Basic Navigation
    $(".back, .cur-values").on("click", () => window.location.href = 'index.html');
    $('.user').on('click', () => {
        if(confirm("Log out?")) { localStorage.clear(); window.location.href = 'login.html'; }
    });
});