$(document).ready(function () {
    const API_BASE_URL = window.location.origin + '/api';
    const PAGE_SIZE = 10;
    let currentPage = 1;

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
                renderTable(response.measurements || []);
                const total = response.totalCount || 0;
                $('.prev').prop('disabled', currentPage === 1);
                $('.next').prop('disabled', (currentPage * PAGE_SIZE) >= total);
                $('.page-info').text(`Page ${currentPage} of ${Math.ceil(total / PAGE_SIZE) || 1}`);
            }
        });
    }

    function renderTable(rows) {
        const $tbody = $('.history-table tbody').empty();
        if (!rows.length) { $tbody.append('<tr><td colspan="6">No data.</td></tr>'); return; }

        rows.forEach(row => {
            let params = [], values = [], stats = [], limits = [];
            const add = (val, label, unit, type) => {
                if (val !== null && val !== undefined) {
                    params.push(label);
                    let norm = true, txt = "Normal", lim = "";
                    if (type === 'co2') { norm = val >= 400 && val <= 1000; txt = norm ? "Normal" : (val < 400 ? "Low" : "High"); lim = "400-1000 ppm"; }
                    if (type === 'temp') { norm = val >= 20 && val <= 24; txt = norm ? "Normal" : "Out of range"; lim = "20-24 °C"; }
                    if (type === 'hum') { norm = val >= 40 && val <= 60; txt = norm ? "Normal" : (val < 40 ? "Low" : "High"); lim = "40-60 %"; }
                    if (type === 'press') { const p = val > 5000 ? val/100 : val; txt = p >= 1013 ? "Higher" : "Lower"; lim = "1013 hPa"; }

                    const style = norm ? "" : "color: red; font-weight: bold;";
                    values.push(`<span style="${style}">${Number(val).toFixed(1)}${unit}</span>`);
                    stats.push(`<span style="${style}">${txt}</span>`);
                    limits.push(lim);
                }
            };

            add(row.co2, "CO2 Concentration", " ppm", 'co2');
            add(row.temperature, "Temperature", " °C", 'temp');
            add(row.humidity, "Humidity", " %", 'hum');
            add(row.pressure, "Barometric Pressure", " hPa", 'press');

            $tbody.append(`<tr>
                <td>${new Date(row.created_at).toLocaleString()}</td>
                <td><strong>${row.device_name || row.device_id}</strong></td>
                <td>${params.join('<br>')}</td>
                <td>${values.join('<br>')}</td>
                <td>${stats.join('<br>')}</td>
                <td style="color: #6E6D6D;">${limits.join('<br>')}</td>
            </tr>`);
        });
    }

    /* Events */
    $('#update-values').on('click', () => location.reload());
    $('.cur-values, .back').on('click', () => location.href = 'index.html');
    $('.filter-btn.device').on('click', () => $('.device-panel').slideToggle());
    $('.filter-btn.time').on('click', () => $('.time-panel').slideToggle());
    $('.filter-btn.par').on('click', () => $('.param-panel').slideToggle());
    $('.user').on('click', () => { if(confirm('Logout?')) { localStorage.clear(); location.href='login.html'; }});
    $('.next').on('click', () => { currentPage++; loadMeasurements(); });
    $('.prev').on('click', () => { if(currentPage > 1) { currentPage--; loadMeasurements(); }});
    
    // Initial Load
    loadMeasurements();
});