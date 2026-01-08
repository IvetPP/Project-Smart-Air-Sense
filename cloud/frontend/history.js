$(document).ready(function () {
    const API_BASE_URL = window.location.origin + '/api';
    const PAGE_SIZE = 10;
    let currentPage = 1;

    // Initial Load
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
                // Keep the first "Select Device" option
                deviceSelect.find('option:not(:first)').remove();
                data.forEach(dev => {
                    deviceSelect.append(`<option value="${dev.device_id}">${dev.device_name || dev.device_id}</option>`);
                });
            },
            error: function(err) {
                console.error("Failed to load devices list", err);
            }
        });
    }

    function loadMeasurements() {
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
        const offset = (currentPage - 1) * PAGE_SIZE;
        
        // Grab current values from the DOM
        const deviceId = $('#filter-device').val();
        const fromDate = $('#filter-from').val();
        const toDate = $('#filter-to').val();

        console.log(`Fetching history: Device=${deviceId}, Page=${currentPage}`);

        // Construct URL with pagination
        let url = `${API_BASE_URL}/measurements?limit=${PAGE_SIZE}&offset=${offset}`;
        
        // Only append filters if they have a value
        if (deviceId && deviceId !== "") {
            url += `&device_id=${encodeURIComponent(deviceId)}`;
        }
        if (fromDate) {
            url += `&from=${encodeURIComponent(fromDate)}`;
        }
        if (toDate) {
            url += `&to=${encodeURIComponent(toDate)}`;
        }

        $.ajax({
            url: url,
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token },
            success: function (response) {
                console.log("History Response:", response);
                
                // Handle both array response or object response {measurements, totalCount}
                const rows = response.measurements || (Array.isArray(response) ? response : []);
                const total = response.totalCount || rows.length;
                
                renderTable(rows);
                
                // Update Pagination UI
                $('.prev').prop('disabled', currentPage === 1);
                $('.next').prop('disabled', (currentPage * PAGE_SIZE) >= total);
                
                const totalPages = Math.ceil(total / PAGE_SIZE) || 1;
                $('.page-info').text(`Page ${currentPage} of ${totalPages}`);
            },
            error: function(xhr) {
                console.error("History fetch failed:", xhr.responseText);
                $('.history-table tbody').html(`<tr><td colspan="6" style="color:red; text-align:center;">Error loading data: ${xhr.responseJSON?.error || 'Server Error'}</td></tr>`);
            }
        });
    }

    function renderTable(rows) {
        const $tbody = $('.history-table tbody');
        $tbody.empty();

        if (!rows || rows.length === 0) {
            $tbody.append('<tr><td colspan="6" style="text-align:center;">No data found for the selected filters.</td></tr>');
            return;
        }

        rows.forEach(row => {
            let params = [];
            let values = [];
            let statusHtml = '';

            const checkAndAdd = (val, label, unit, typeClass, min, max) => {
                // Check if val is a number and not null/undefined
                if (val !== null && val !== undefined && val !== "" && !isNaN(val)) {
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

            const timestamp = row.created_at || row.timestamp || new Date();
            const deviceName = row.device_name || row.device_id || 'Unknown';

            $tbody.append(`
                <tr>
                    <td>${new Date(timestamp).toLocaleString()}</td>
                    <td><strong>${deviceName}</strong></td>
                    <td>${params.join('<br>')}</td>
                    <td>${values.join('<br>')}</td>
                    <td><span class="status ok">Active</span></td>
                    <td>${statusHtml || '-'}</td>
                </tr>
            `);
        });
    }

    /* Event Handlers */
    
    // UI Panel Toggles
    $('.filter-btn.device').on('click', () => $('.device-panel').slideToggle(200));
    $('.filter-btn.time').on('click', () => $('.time-panel').slideToggle(200));
    $('.filter-btn.par').on('click', () => $('.param-panel').slideToggle(200));

    // Listen for changes on ALL filter inputs
    $('#filter-device, #filter-parameter, #filter-from, #filter-to').on('change', function() {
        currentPage = 1; // Reset to first page when filtering
        loadMeasurements();
    });

    // Clear Filters
    $('#clear-filters').on('click', function() {
        $('#filter-device, #filter-parameter, #filter-from, #filter-to').val('');
        currentPage = 1;
        loadMeasurements();
    });

    // Pagination
    $('.next').on('click', function() { 
        currentPage++; 
        loadMeasurements(); 
    });
    
    $('.prev').on('click', function() { 
        if (currentPage > 1) { 
            currentPage--; 
            loadMeasurements(); 
        } 
    });

    $(".back").on("click", () => window.location.href = 'index.html');

    $('.user').on('click', function() {
        if(confirm("Do you want to log out?")) {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = 'login.html';
        }
    });
});