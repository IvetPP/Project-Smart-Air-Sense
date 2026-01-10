$(document).ready(function () {
    const API_BASE_URL = window.location.origin + '/api';
    const PAGE_SIZE = 10;
    let currentPage = 1;

    // Initial Load
    loadDeviceList();
    loadMeasurements();

    function loadDeviceList() {
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');

        $.ajax({
            url: `${API_BASE_URL}/devices`,
            method: 'GET',
            headers: { Authorization: 'Bearer ' + token },
            success: function (data) {
                const deviceSelect = $('#filter-device');
                deviceSelect.find('option:not(:first)').remove();

                data.forEach(dev => {
                    deviceSelect.append(
                        `<option value="${dev.device_id}">${dev.device_name || dev.device_id}</option>`
                    );
                });
            },
            error: err => console.error('Device list error', err)
        });
    }

    function loadMeasurements() {
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
        const offset = (currentPage - 1) * PAGE_SIZE;

        const deviceId = $('#filter-device').val();
        const fromDate = $('#filter-from').val();
        const toDate = $('#filter-to').val();
        const parameter = $('#filter-parameter').val();

        let url = `${API_BASE_URL}/measurements?limit=${PAGE_SIZE}&offset=${offset}`;

        if (deviceId) url += `&device_id=${encodeURIComponent(deviceId)}`;
        if (fromDate) url += `&from=${encodeURIComponent(fromDate)}`;
        if (toDate) url += `&to=${encodeURIComponent(toDate)}`;
        if (parameter) url += `&parameter=${encodeURIComponent(parameter)}`;

        $.ajax({
            url,
            method: 'GET',
            headers: { Authorization: 'Bearer ' + token },
            success: function (response) {
                const rows = response.measurements || [];
                const total = response.totalCount || rows.length;

                renderTable(rows);

                $('.prev').prop('disabled', currentPage === 1);
                $('.next').prop('disabled', currentPage * PAGE_SIZE >= total);

                const totalPages = Math.ceil(total / PAGE_SIZE) || 1;
                $('.page-info').text(`Page ${currentPage} of ${totalPages}`);
            },
            error: function (xhr) {
                console.error('Measurement error', xhr);
                $('.history-table tbody').html(
                    `<tr><td colspan="6" style="text-align:center;color:red;">
                        Failed to load data
                    </td></tr>`
                );
            }
        });
    }

    function renderTable(rows) {
        const $tbody = $('.history-table tbody');
        $tbody.empty();

        if (!rows.length) {
            $tbody.append(
                '<tr><td colspan="6" style="text-align:center;">No data found.</td></tr>'
            );
            return;
        }

        rows.forEach(row => {
            let params = [];
            let values = [];
            let statuses = [];
            let limits = [];

            const add = (val, label, unit, min, max, limitText) => {
                if (val !== null && val !== undefined && !isNaN(val)) {
                    const out = val < min || val > max;
                    params.push(label);
                    values.push(`${Number(val).toFixed(1)}${unit}`);
                    statuses.push(
                        `<span class="${out ? 'warning' : 'normal-text'}">
                            ${out ? 'Out of range' : 'Normal'}
                        </span>`
                    );
                    limits.push(limitText);
                }
            };

            add(row.co2, 'CO₂', ' ppm', 400, 1000, '400–1000 ppm');
            add(row.temperature, 'Temp', ' °C', 20, 24, '20–24 °C');
            add(row.humidity, 'Hum', ' %', 40, 60, '40–60 %');
            add(row.pressure, 'Press', ' hPa', 980, 1050, '≈1013 hPa');

            $tbody.append(`
                <tr>
                    <td>${new Date(row.created_at).toLocaleString()}</td>
                    <td><strong>${row.device_name || row.device_id}</strong></td>
                    <td>${params.join('<br>')}</td>
                    <td>${values.join('<br>')}</td>
                    <td>${statuses.join('<br>')}</td>
                    <td>${limits.join('<br>')}</td>
                </tr>
            `);
        });
    }

    /* FILTER EVENTS */

    $('.filter-btn.device').on('click', () => $('.device-panel').slideToggle(200));
    $('.filter-btn.time').on('click', () => $('.time-panel').slideToggle(200));
    $('.filter-btn.par').on('click', () => $('.param-panel').slideToggle(200));

    $('#filter-device, #filter-from, #filter-to, #filter-parameter').on('change', () => {
        currentPage = 1;
        loadMeasurements();
    });

    $('#clear-filters').on('click', () => {
        $('#filter-device, #filter-from, #filter-to, #filter-parameter').val('');
        currentPage = 1;
        loadMeasurements();
    });

    $('.next').on('click', () => {
        currentPage++;
        loadMeasurements();
    });

    $('.prev').on('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadMeasurements();
        }
    });
});
