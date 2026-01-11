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
        const deviceId = $('#filter-device').val();
        const fromDate = $('#filter-from').val();
        const toDate = $('#filter-to').val();

        let url = `${API_BASE_URL}/measurements?limit=${PAGE_SIZE}&offset=${offset}`;
        if (deviceId) url += `&device_id=${encodeURIComponent(deviceId)}`;
        if (fromDate) url += `&from=${encodeURIComponent(fromDate)}`;
        if (toDate) url += `&to=${encodeURIComponent(toDate)}`;

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
                $('.page-info').text(`Page ${currentPage} of ${Math.ceil(total / PAGE_SIZE) || 1}`);
            }
        });
    }

    function renderTable(rows) {
        const $tbody = $('.history-table tbody');
        $tbody.empty();

        if (!rows.length) {
            $tbody.append('<tr><td colspan="6" style="text-align:center;">No data found.</td></tr>');
            return;
        }

        rows.forEach(row => {
            let params = [], values = [], statusHtml = [], limits = [];

            const check = (val, fullLabel, unit, type) => {
                if (val !== null && val !== undefined && !isNaN(val)) {
                    params.push(fullLabel);
                    values.push(`${Number(val).toFixed(1)}${unit}`);

                    // Default values
                    let statText = "Normal";
                    let isNorm = true; 
                    let limText = "";
                    if (type === 'co2') {
                        isNorm = val >= 400 && val <= 1000;
                        statText = isNorm ? 'Normal' : (val < 400 ? 'Low' : 'High');
                        limText = "400 - 1000 ppm";
                    } else if (type === 'temp') {
                        isNorm = val >= 20 && val <= 24;
                        statText = isNorm ? 'Normal' : (val < 20 ? 'Too Low' : 'Too High');
                        limText = "20 - 24 °C";
                    } else if (type === 'hum') {
                        isNorm = val >= 40 && val <= 60;
                        statText = isNorm ? 'Normal' : (val < 40 ? 'Low' : 'High');
                        limText = "40 - 60 %";
                    } else if (type === 'press') {
                        const p = val > 5000 ? val / 100 : val;
                        // Pressure logic: Is it normal? (Assuming 1013 is the target)
                        // If you want it red whenever it isn't exactly 1013:
                        isNorm = Math.round(p) === 1013; 
                        statText = isNorm ? 'Normal' : (p > 1013 ? 'Higher' : 'Lower');
                        limText = "1013 hPa";
                    }
                    // This line uses 'warning' (red) if isNorm is false
                    statusHtml.push(`<span class="${isNorm ? 'normal-text' : 'warning'}">${statText}</span>`);
                    limits.push(limText);
                }
            };

            check(row.co2, "CO2 Concentration", " ppm", 'co2');
            check(row.temperature, "Temperature", " °C", 'temp');
            check(row.humidity, "Humidity", " %", 'hum');
            check(row.pressure, "Barometric Pressure", " hPa", 'press');

            $tbody.append(`
                <tr>
                    <td>${new Date(row.created_at).toLocaleString()}</td>
                    <td><strong>${row.device_name || row.device_id}</strong></td>
                    <td>${params.join('<br>')}</td>
                    <td>${values.join('<br>')}</td>
                    <td>${statusHtml.join('<br>')}</td>
                    <td class="limit-cell">${limits.join('<br>')}</td>
                </tr>
            `);
        });
    }

    /* Events */
    $('.filter-btn.device').on('click', () => $('.device-panel').slideToggle(200));
    $('.filter-btn.time').on('click', () => $('.time-panel').slideToggle(200));
    $('.filter-btn.par').on('click', () => $('.param-panel').slideToggle(200));
    
    $('#filter-device, #filter-from, #filter-to, #filter-parameter').on('change', () => {
        currentPage = 1; loadMeasurements();
    });

    $('#update-values').on('click', () => location.reload());
    $('.cur-values').on('click', () => window.location.href = 'index.html');
    $('.back').on('click', () => window.location.href = 'index.html');

    $('.user').on('click', () => {
        if(confirm("Log out?")) { localStorage.clear(); window.location.href = 'login.html'; }
    });

    $('.next').on('click', () => { currentPage++; loadMeasurements(); });
    $('.prev').on('click', () => { if(currentPage > 1) { currentPage--; loadMeasurements(); }});
});