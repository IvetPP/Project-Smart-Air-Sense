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
                
                // LOAD MEASUREMENTS ONLY AFTER DEVICES ARE READY
                loadMeasurements(); 
            }
        });
    }

    function loadMeasurements() {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const offset = (currentPage - 1) * PAGE_SIZE;
    const deviceId = $('#filter-device').val();
    const fromDate = $('#filter-from').val();
    const toDate = $('#filter-to').val();

    // 1. Check if the URL matches what the dashboard uses
    let url = `${API_BASE_URL}/measurements?limit=${PAGE_SIZE}&offset=${offset}`;
    
    if (deviceId) url += `&device_id=${encodeURIComponent(deviceId)}`;
    if (fromDate) url += `&from=${encodeURIComponent(fromDate)}`;
    if (toDate) url += `&to=${encodeURIComponent(toDate)}`;

    $.ajax({
        url: url,
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json' 
        },
        success: function (response) {
            // DEBUG: See what the server is actually sending back
            console.log("History API Response:", response);

            // This line covers both: response.measurements OR if the response IS the array
            const rows = response.measurements || (Array.isArray(response) ? response : []);
            const total = response.totalCount || rows.length;
            
            renderTable(rows);
            
            $('.prev').prop('disabled', currentPage === 1);
            // If total is just the row length, this button might disable early
            $('.next').prop('disabled', rows.length < PAGE_SIZE); 
            $('.page-info').text(`Page ${currentPage}`);
        },
        error: function(xhr) {
            console.error("History Load Failed:", xhr.status, xhr.responseText);
            $('.history-table tbody').html(`<tr><td colspan="6" style="color:red; text-align:center;">Error loading data: ${xhr.status}</td></tr>`);
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
                    
                    let statText = "Normal", isNorm = true, limText = "";

                    if (type === 'co2') {
                        isNorm = val >= 400 && val <= 1000;
                        statText = isNorm ? 'Normal' : (val < 400 ? 'Low' : 'High');
                        limText = "400 - 1000 ppm";
                    } else if (type === 'temp') {
                        isNorm = val >= 20 && val <= 24;
                        statText = isNorm ? 'Normal' : 'Out of range';
                        limText = "20 - 24 °C";
                    } else if (type === 'hum') {
                        isNorm = val >= 40 && val <= 60;
                        statText = isNorm ? 'Normal' : (val < 40 ? 'Low' : 'High');
                        limText = "40 - 60 %";
                    } else if (type === 'press') {
                        const p = val > 5000 ? val / 100 : val;
                        statText = p >= 1013 ? 'Higher' : 'Lower';
                        limText = "1013 hPa";
                    }

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