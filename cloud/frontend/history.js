$(document).ready(function () {
    const API_BASE_URL = window.location.origin + '/api';
    const PAGE_SIZE = 10;
    let currentPage = 1;

    // Initial Load: Load devices first, then measurements
    loadDeviceList();

    function loadDeviceList() {
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
        $.ajax({
            url: `${API_BASE_URL}/devices`,
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            success: function (data) {
                const deviceSelect = $('#filter-device');
                deviceSelect.find('option:not(:first)').remove();
                data.forEach(dev => {
                    deviceSelect.append(`<option value="${dev.device_id}">${dev.device_name || dev.device_id}</option>`);
                });
                // Trigger first data load after devices are populated
                loadMeasurements();
            },
            error: (err) => console.error("Device load error:", err)
        });
    }

    function loadMeasurements() {
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
        const offset = (currentPage - 1) * PAGE_SIZE;
        const deviceId = $('#filter-device').val();
        const fromDate = $('#filter-from').val();
        const toDate = $('#filter-to').val();
        const selectedParam = $('#filter-parameter').val(); // Get the parameter here

        let url = `${API_BASE_URL}/measurements?limit=${PAGE_SIZE}&offset=${offset}`;
        
        if (deviceId) url += `&device_id=${encodeURIComponent(deviceId)}`;
        if (fromDate) url += `&from=${encodeURIComponent(fromDate)}`;
        if (toDate) url += `&to=${encodeURIComponent(toDate)}`;

        // ADD THIS LINE: Pass the parameter to the server
        if (selectedParam) url += `&parameter=${encodeURIComponent(selectedParam)}`;    

        $.ajax({
            url: url,
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            success: function (response) {
                console.log("Data received:", response);
                const rows = response.measurements || (Array.isArray(response) ? response : []);
                const total = response.totalCount || 0;

                renderTable(rows);

                // Update Pagination UI
                $('.prev').prop('disabled', currentPage === 1);
                $('.next').prop('disabled', (currentPage * PAGE_SIZE) >= total);
                $('.page-info').text(`Page ${currentPage} of ${Math.ceil(total / PAGE_SIZE) || 1}`);
            },
            error: function (xhr) {
                console.error("Load failed:", xhr.responseText);
                $('.history-table tbody').html('<tr><td colspan="6" style="text-align:center;color:red;">Failed to load data from server.</td></tr>');
            }
        });
    }

    function renderTable(rows) {
        const $tbody = $('.history-table tbody');
        $tbody.empty();

        // Get the currently selected parameter from the dropdown
        const selectedParam = $('#filter-parameter').val();

        if (!rows || rows.length === 0) {
            $tbody.append('<tr><td colspan="6" style="text-align:center;">No data found.</td></tr>');
            return;
        }

        rows.forEach(row => {
            let params = [], values = [], statusHtml = [], limits = [];

            const check = (val, fullLabel, unit, type) => {
                if (selectedParam && selectedParam !== type) return;

                if (val !== null && val !== undefined && val !== "") {
                    const numVal = parseFloat(val);
                    if (isNaN(numVal)) return;

                    params.push(fullLabel);
                    values.push(`${numVal.toFixed(1)}${unit}`);

                    let statText = "Normal";
                    let isNorm = true;
                    let limText = "";

                    if (type === 'co2') {
                        isNorm = numVal >= 400 && numVal <= 1000;
                        statText = isNorm ? 'Normal' : (numVal < 400 ? 'Low' : 'High');
                        limText = "400 - 1000 ppm";
                    } else if (type === 'temperature') {
                        isNorm = numVal >= 20 && numVal <= 24;
                        statText = isNorm ? 'Normal' : 'Out of range';
                        limText = "20 - 24 °C";
                    } else if (type === 'humidity') {
                        isNorm = numVal >= 40 && numVal <= 60;
                        statText = isNorm ? 'Normal' : (numVal < 40 ? 'Low' : 'High');
                        limText = "40 - 60 %";
                    } else if (type === 'pressure') {
                        const p = numVal > 5000 ? numVal / 100 : numVal;
                        isNorm = Math.round(p) === 1013;
                        statText = isNorm ? 'Normal' : (p > 1013 ? 'Higher' : 'Lower');
                        limText = "1013 hPa";
                    }

                    statusHtml.push(`<span class="${isNorm ? 'normal-text' : 'warning'}" style="color: ${isNorm ? '#248b28' : 'red'}; font-weight: ${isNorm ? 'normal' : 'bold'};">${statText}</span>`);
                    limits.push(limText);
                }
            };

            // Column Mapping
            check(row.co2, "CO2 Concentration", " ppm", 'co2');
            check(row.temperature, "Temperature", " °C", 'temperature');
            check(row.humidity, "Humidity", " %", 'humidity');
            check(row.pressure, "Barometric Pressure", " hPa", 'pressure');

            if (params.length > 0) {
                const timestamp = row.created_at ? new Date(row.created_at).toLocaleString() : '---';
                const deviceName = row.device_name || row.device_id || 'Unknown';

                $tbody.append(`
                    <tr>
                        <td>${timestamp}</td>
                        <td><strong>${deviceName}</strong></td>
                        <td>${params.join('<br>')}</td>
                        <td>${values.join('<br>')}</td>
                        <td>${statusHtml.join('<br>')}</td>
                        <td class="limit-cell">${limits.join('<br>')}</td>
                    </tr>
                `);
            }
        });
    }

    /* Event Listeners */
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

    $(document).on('click', '#update-values', function () {
        console.log("Update button clicked");
        currentPage = 1;
        loadMeasurements();
    });

    $('.back, .cur-values').on('click', () => window.location.href = 'dashboard.html');

    $('.user').on('click', () => {
        if (confirm("Do you want to log out?")) {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = 'login.html';
        }
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