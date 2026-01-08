$(document).ready(function () {
    const API_BASE_URL = window.location.origin + '/api';
    const PAGE_SIZE = 10;
    let currentPage = 1;

    loadMeasurements();

    /* ============================
       EVENT HANDLERS
    ============================ */

    // Panel Toggles
    $('.filter-btn.device').on('click', function () { togglePanel('.device-panel', this); });
    $('.filter-btn.time').on('click', function () { togglePanel('.time-panel', this); });
    $('.filter-btn.par').on('click', function () { togglePanel('.param-panel', this); });

    function togglePanel(panelSelector, btn) {
        $(panelSelector).slideToggle(200);
        $(btn).toggleClass('active');
    }

    // Trigger reload on filter change
    $('#filter-device, #filter-parameter, #filter-from, #filter-to').on('change', function () {
        currentPage = 1; 
        loadMeasurements();
    });

    // Clear Filters Button
    $('#clear-filters').on('click', function() {
        $('#filter-device, #filter-parameter, #filter-from, #filter-to').val('');
        $('.device-panel, .time-panel, .param-panel').slideUp(200);
        $('.filter-btn').removeClass('active');
        currentPage = 1;
        loadMeasurements();
    });

    // Pagination
    $('.next').on('click', function () {
        currentPage++;
        loadMeasurements();
    });

    $('.prev').on('click', function () {
        if (currentPage > 1) {
            currentPage--;
            loadMeasurements();
        }
    });

    $(".back").on("click", () => window.location.href = 'index.html');

    /* ============================
       CORE FUNCTIONS
    ============================ */

    function getFilterData() {
        return {
            device_id: $('#filter-device').val() || '',
            parameter: $('#filter-parameter').val() || '',
            from: $('#filter-from').val() || '',
            to: $('#filter-to').val() || ''
        };
    }

    function loadMeasurements() {
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
        const offset = (currentPage - 1) * PAGE_SIZE;
        const filters = getFilterData();

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
                
                // Pagination Logic
                $('.prev').prop('disabled', currentPage === 1);
                const isLastPage = (currentPage * PAGE_SIZE) >= total;
                $('.next').prop('disabled', isLastPage);
                
                const totalPages = Math.ceil(total / PAGE_SIZE);
                $('.page-info').text(`Page ${currentPage} of ${totalPages || 1}`);
            },
            error: function (xhr) {
                if (xhr.status === 401) window.location.href = 'login.html';
                else console.error("Fetch error:", xhr);
            }
        });
    }

    function renderTable(rows) {
        const $tbody = $('.history-table tbody');
        $tbody.empty();

        if (!rows.length) {
            $tbody.append('<tr><td colspan="6">No data matching filters found.</td></tr>');
            return;
        }

        rows.forEach(row => {
            let params = [];
            let values = [];
            let statusHtml = ''; // This will now only contain the text status

            // Helper to build column displays
            const checkAndAdd = (val, label, unit, typeClass, min, max) => {
                if (val !== null && val !== undefined && !isNaN(val)) {
                    params.push(label);
                    values.push(`${val}${unit}`);
                    
                    // Determine the status text
                    const isOutOfRange = (min !== undefined && (val < min || val > max));
                    const statusText = isOutOfRange ? 'Out of range' : 'Normal';
                    const statusClass = isOutOfRange ? 'warning' : 'normal-text';

                    // Just add the text labels to the last column
                    statusHtml += `<div class="${typeClass}">
                        <span class="${statusClass}">${statusText}</span>
                    </div>`;
                }
            };

            checkAndAdd(row.co2, "CO2", " ppm", "co2", 400, 1000);
            checkAndAdd(row.temperature, "Temp", " °C", "temp", 20, 24);
            checkAndAdd(row.humidity, "Hum", " %", "hum", 40, 60);
            checkAndAdd(row.pressure, "Press", " hPa", "bar", 1013, 1100);

            const timestamp = row.created_at || row.timestamp;

            $tbody.append(`
                <tr>
                    <td>${new Date(timestamp).toLocaleString('cs-CZ')}</td>
                    <td>${row.device_id || 'IoT Device'}</td>
                    <td>${params.join(' / ') || '-'}</td>
                    <td>${values.join(' / ') || '-'}</td>
                    <td><span class="status ok">Active</span></td>
                    <td>${statusHtml || '-'}</td>
                </tr>
            `);
        });
    }
});