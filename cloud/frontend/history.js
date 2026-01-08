$(document).ready(function () {
    /* ============================
       CONFIG & STATE
    ============================ */
    const API_BASE_URL = window.location.origin + '/api';
    const PAGE_SIZE = 10;
    let currentPage = 1;

    /* ============================
       INIT
    ============================ */
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

    // Navigation
    $(".back").on("click", () => window.location.href = 'index.html');

    // Logout
    $('.user').on('click', function () {
        if (confirm('Do you want to log out?')) {
            localStorage.removeItem('auth_token');
            sessionStorage.removeItem('auth_token');
            window.location.href = 'login.html';
        }
    });

    /* ============================
       CORE FUNCTIONS
    ============================ */

    function loadMeasurements() {
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
        const offset = (currentPage - 1) * PAGE_SIZE;
        let url = `${API_BASE_URL}/measurements?limit=${PAGE_SIZE}&offset=${offset}`;

        $.ajax({
            url: url,
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token },
            success: function (response) {
                // response now looks like { measurements: [...], totalCount: 100 }
                const rows = response.measurements;
                const total = response.totalCount;

                renderTable(rows);
                $('.page-info').text(currentPage);

                // Disable "Prev" if on the first page
                $('.prev').prop('disabled', currentPage === 1);

                // Disable "Next" if the next page would be empty
                // Logic: (Current Page * Page Size) >= Total Count
                const isLastPage = (currentPage * PAGE_SIZE) >= total;
                $('.next').prop('disabled', isLastPage);
                
                // Optional: Update UI to show "Page X of Y"
                const totalPages = Math.ceil(total / PAGE_SIZE);
                $('.page-info').text(`Page ${currentPage} of ${totalPages || 1}`);
            },
            error: function (xhr) {
                if (xhr.status === 401) {
                    window.location.href = 'login.html';
                } else {
                    console.error("Fetch error:", xhr);
                }
            }
        });
    }

    function renderTable(rows) {
        const $tbody = $('.history-table tbody');
        $tbody.empty();

        if (!rows || !rows.length) {
            $tbody.append('<tr><td colspan="6">No data available</td></tr>');
            return;
        }

        rows.forEach(row => {
            // Since your data is "wide", a single row might have multiple values.
            // We format them into a single display string for the 'Parameter' and 'Value' columns.
            
            let params = [];
            let values = [];

            if (row.co2 !== null && row.co2 !== undefined) {
                params.push("CO2");
                values.push(`${Math.round(row.co2)} ppm`);
            }
            if (row.temperature !== null && row.temperature !== undefined) {
                params.push("Temp");
                values.push(`${row.temperature.toFixed(1)}°C`);
            }
            if (row.humidity !== null && row.humidity !== undefined) {
                params.push("Hum");
                values.push(`${row.humidity.toFixed(1)}%`);
            }
            if (row.pressure !== null && row.pressure !== undefined) {
                params.push("Press");
                values.push(`${row.pressure.toFixed(1)}%`);
            }

            const timestamp = row.created_at || row.timestamp;


            let sensorsHtml = '';

            /* CO2 */
            if (values.co2 !== undefined && !isNaN(values.co2)) {
                sensorsHtml += `
                    <div class="co2">
                        <span class="value">${Math.round(values.co2)} ppm</span>
                        <span class="state">${values.co2 <= 1000 ? 'Normal' : 'High'}</span>
                    </div>
                `;
            }

            /* Temperature */
            if (values.temperature !== undefined && !isNaN(values.temperature)) {
                sensorsHtml += `
                    <div class="temp">
                        <span class="value">${values.temperature.toFixed(1)} °C</span>
                        <span class="state">
                            ${values.temperature >= 20 && values.temperature <= 24 ? 'Normal' : 'Out of range'}
                        </span>
                    </div>
                `;
            }

            /* Humidity */
            if (values.humidity !== undefined && !isNaN(values.humidity)) {
                sensorsHtml += `
                    <div class="hum">
                        <span class="value">${values.humidity.toFixed(1)} %</span>
                        <span class="state">
                            ${values.humidity >= 40 && values.humidity <= 60 ? 'Normal' : 'Out of range'}
                        </span>
                    </div>
                `;
            }

            /* Pressure */
            if (values.pressure !== undefined && !isNaN(values.pressure)) {
                sensorsHtml += `
                    <div class="bar">
                        <span class="value">${Math.round(values.pressure)} hPa</span>
                        <span class="state">${values.pressure >= 1013 ? 'Higher' : 'Lower'}</span>
                    </div>
                `;
            }

            /* Fallback */
            if (!sensorsHtml) {
                sensorsHtml = '-';
            }

            $tbody.append(`
                <tr>
                    <td>${new Date(timestamp).toLocaleString('cs-CZ')}</td>
                    <td>${row.device_id || 'IoT Device'}</td>
                    <td>${params.join(' / ') || '-'}</td>
                    <td>${values.join(' / ') || '-'}</td>
                    <td><span class="status ok">Active</span></td>
                    <td>${sensorsHtml}</td>
                </tr>
            `);
        });
    }
});