$(document).ready(function () {
    const API_BASE_URL = window.location.origin + '/api';
    const PAGE_SIZE = 10;
    let currentPage = 1;

    setupUserDisplay();
    loadDeviceList();
    loadMeasurements();

    function setupUserDisplay() {
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
        if (!token) return;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            $('.user').text((payload.user_name || "ADMIN").substring(0, 5).toUpperCase());
        } catch (e) {
            $('.user').text("LOGOUT");
        }
    }

    function loadDeviceList() {
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
        $.ajax({
            url: `${API_BASE_URL}/devices`,
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token },
            success: function (data) {
                const deviceSelect = $('#filter-device');
                deviceSelect.find('option:not(:first)').remove();
                data.forEach(dev => {
                    deviceSelect.append(`<option value="${dev.device_id}">${dev.device_name || dev.device_id}</option>`);
                });
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
        if (filters.from) url += `&from=${encodeURIComponent(filters.from)}`;
        if (filters.to) url += `&to=${encodeURIComponent(filters.to)}`;

        $.ajax({
            url: url,
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token },
            success: function (response) {
                // Ensure we have an object with the measurements array
                const rows = response.measurements || [];
                const total = response.totalCount || 0;
                renderTable(rows);
                
                $('.prev').prop('disabled', currentPage === 1);
                $('.next').prop('disabled', (currentPage * PAGE_SIZE) >= total);
                const totalPages = Math.ceil(total / PAGE_SIZE);
                $('.page-info').text(`Page ${currentPage} of ${totalPages || 1}`);
            },
            error: function(xhr) {
                console.error("History fetch failed:", xhr.responseJSON);
                $('.history-table tbody').html(`<tr><td colspan="6" style="color:red">Error loading data: ${xhr.responseJSON?.error || 'Server Error'}</td></tr>`);
            }
        });
    }

    function renderTable(rows) {
        const $tbody = $('.history-table tbody');
        $tbody.empty();

        if (!rows.length) {
            $tbody.append('<tr><td colspan="6">No data found for the selected filters.</td></tr>');
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
            $tbody.append(`
                <tr>
                    <td>${new Date(timestamp).toLocaleString()}</td>
                    <td>${row.device_name}</td>
                    <td>${params.join('<br>')}</td>
                    <td>${values.join('<br>')}</td>
                    <td><span class="status ok">Active</span></td>
                    <td>${statusHtml || '-'}</td>
                </tr>
            `);
        });
    }

    /* Event Handlers */
    $('.filter-btn.device').on('click', () => $('.device-panel').slideToggle(200));
    $('.filter-btn.time').on('click', () => $('.time-panel').slideToggle(200));
    $('.filter-btn.par').on('click', () => $('.param-panel').slideToggle(200));

    $('#filter-device, #filter-parameter, #filter-from, #filter-to').on('change', () => {
        currentPage = 1;
        loadMeasurements();
    });

    $('#clear-filters').on('click', () => {
        $('#filter-device, #filter-parameter, #filter-from, #filter-to').val('');
        currentPage = 1;
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