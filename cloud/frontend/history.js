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
                    deviceSelect.append(`<option value="${dev.device_id}">${dev.device_name || dev.device_id}</option>`);
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

    // 1. Check if the URL matches what the dashboard uses
    let url = `${API_BASE_URL}/measurements?limit=${PAGE_SIZE}&offset=${offset}`;
    
    if (deviceId) url += `&device_id=${encodeURIComponent(deviceId)}`;
    if (fromDate) url += `&from=${encodeURIComponent(fromDate)}`;
    if (toDate) url += `&to=${encodeURIComponent(toDate)}`;

    $.ajax({
        url: url,
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token },
        success: function (response) {
            // DEBUG: See what the server is actually sending back
            console.log("History API Response:", response);

            // Handle both object-wrapped and direct array responses
            const rows = response.measurements || (Array.isArray(response) ? response : []);
            
            // If totalCount is missing, use the length of the returned rows
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

            // CO2 Logic
            if (row.co2 !== null && row.co2 !== undefined) {
                const v = Math.round(row.co2);
                const status = (v < 400 ? 'Low' : v > 1000 ? 'High' : 'Normal');
                params.push('CO₂ concentration');
                values.push(`${v} ppm`);
                statuses.push(getStatusHtml(status));
                limits.push('400–1000 ppm');
            }

            // Temp Logic
            if (row.temperature !== null && row.temperature !== undefined) {
                const v = Number(row.temperature).toFixed(1);
                const status = (v >= 20 && v <= 24 ? 'Normal' : 'Out of range');
                params.push('Temperature');
                values.push(`${v} °C`);
                statuses.push(getStatusHtml(status));
                limits.push('20–24 °C');
            }

            // Humidity Logic
            if (row.humidity !== null && row.humidity !== undefined) {
                const v = Number(row.humidity).toFixed(1);
                const status = (v < 40 ? 'Low' : v > 60 ? 'High' : 'Normal');
                params.push('Humidity');
                values.push(`${v} %`);
                statuses.push(getStatusHtml(status));
                limits.push('40–60 %');
            }

            // Pressure Logic
            if (row.pressure !== null && row.pressure !== undefined) {
                const p = row.pressure > 5000 ? Math.round(row.pressure / 100) : Math.round(row.pressure);
                const isStandard = (p === 1013);
                const status = isStandard ? 'Normal' : (p >= 1013 ? 'Higher' : 'Lower');
                params.push('Barometric pressure');
                values.push(`${p} hPa`);
                statuses.push(getStatusHtml(status));
                limits.push('≈1013 hPa');
            }

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

    /* NAVIGATION & BUTTON LOGIC */

    // Arrow back returns to dashboard
    $('.back').on('click', function() {
        window.location.href = 'dashboard.html';
    });

    // Log out button
    $('.user').on('click', function() {
        localStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_token');
        window.location.href = 'login.html'; // Adjust to your login page filename
    });

    // Current values button
    $('.cur-values').on('click', function() {
        window.location.href = 'dashboard.html';
    });

    // History of values button (remains on this page or reloads)
    $('.his-values').on('click', function() {
        window.location.href = 'history.html';
    });

    // Update values button
    $('#update-values').on('click', function() {
        currentPage = 1;
        loadMeasurements();
    });

    /* FILTER EVENTS */
    $('.filter-btn.device').on('click', () => $('.device-panel').slideToggle(200));
    $('.filter-btn.time').on('click', () => $('.time-panel').slideToggle(200));
    $('.filter-btn.par').on('click', () => $('.param-panel').slideToggle(200));

    // Triggers load on every change (Device, Date, or Parameter)
    $('#filter-device, #filter-from, #filter-to, #filter-parameter').on('change', () => {
        currentPage = 1;
        loadMeasurements();
    });

    $('#clear-filters').on('click', () => {
        $('#filter-device, #filter-from, #filter-to, #filter-parameter').val('');
        currentPage = 1;
        loadMeasurements();
    });

    $('.next').on('click', () => { currentPage++; loadMeasurements(); });
    $('.prev').on('click', () => { if (currentPage > 1) { currentPage--; loadMeasurements(); } });
});