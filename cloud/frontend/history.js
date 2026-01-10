$(document).ready(function () {
    const API_BASE_URL = window.location.origin + '/api';
    const PAGE_SIZE = 10;
    let currentPage = 1;

    // Load initial data
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
        const $tbody = $('.history-table tbody').empty();

        if (rows.length === 0) {
            $tbody.append('<tr><td colspan="6" style="text-align:center;">No data records found.</td></tr>');
            return;
        }

        rows.forEach(row => {
            let params = [], values = [], statusHtml = [], limits = [];

            const processParam = (val, fullName, unit, type) => {
                if (val !== null && val !== undefined && !isNaN(val)) {
                    params.push(fullName);
                    
                    let statusText = "Normal", isNormal = true, limitText = "";

                    if (type === 'co2') {
                        isNormal = val >= 400 && val <= 1000;
                        statusText = isNormal ? 'Normal' : (val < 400 ? 'Low' : 'High');
                        limitText = "400 - 1000 ppm";
                    } else if (type === 'temp') {
                        isNormal = val >= 20 && val <= 24;
                        statusText = isNormal ? 'Normal' : 'Out of range';
                        limitText = "20 - 24 °C";
                    } else if (type === 'hum') {
                        isNormal = val >= 40 && val <= 60;
                        statusText = isNormal ? 'Normal' : (val < 40 ? 'Low' : 'High');
                        limitText = "40 - 60 %";
                    } else if (type === 'press') {
                        const p = val > 5000 ? val / 100 : val;
                        statusText = p >= 1013 ? 'Higher' : 'Lower';
                        limitText = "1013 hPa";
                    }

                    const alertStyle = isNormal ? "" : "color: red; font-weight: bold;";
                    values.push(`<span style="${alertStyle}">${Number(val).toFixed(1)}${unit}</span>`);
                    statusHtml.push(`<span style="${alertStyle}">${statusText}</span>`);
                    limits.push(limitText);
                }
            };

            processParam(row.co2, "CO2 Concentration", " ppm", 'co2');
            processParam(row.temperature, "Temperature", " °C", 'temp');
            processParam(row.humidity, "Humidity", " %", 'hum');
            processParam(row.pressure, "Barometric Pressure", " hPa", 'press');

            $tbody.append(`
                <tr>
                    <td>${new Date(row.created_at).toLocaleString()}</td>
                    <td><strong>${row.device_name || row.device_id}</strong></td>
                    <td>${params.join('<br>')}</td>
                    <td>${values.join('<br>')}</td>
                    <td>${statusHtml.join('<br>')}</td>
                    <td style="color: #6E6D6D; font-size: 0.85rem;">${limits.join('<br>')}</td>
                </tr>
            `);
        });
    }

    // Event Handlers
    $('.filter-btn.device').on('click', () => $('.device-panel').slideToggle(200));
    $('.filter-btn.time').on('click', () => $('.time-panel').slideToggle(200));
    $('.filter-btn.par').on('click', () => $('.param-panel').slideToggle(200));
    
    $('#update-values').on('click', () => location.reload());
    $('.cur-values, .back').on('click', () => window.location.href = 'index.html');
    
    $('#filter-device, #filter-from, #filter-to, #filter-parameter').on('change', () => {
        currentPage = 1;
        loadMeasurements();
    });

    $('.user').on('click', () => {
        if(confirm("Do you want to log out?")) {
            localStorage.clear();
            window.location.href = 'login.html';
        }
    });

    $('.next').on('click', () => { currentPage++; loadMeasurements(); });
    $('.prev').on('click', () => { if(currentPage > 1) { currentPage--; loadMeasurements(); }});
});