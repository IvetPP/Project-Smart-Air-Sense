$(document).ready(function () {
    /* ============================
       AUTH CHECK (Gatekeeper)
    ============================ */
    function getToken() {
        return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    }
    const token = getToken();

    if (!token) {
        window.location.href = 'login.html';
        return; 
    }

    $('.user.pers').text('Log out').css('cursor', 'pointer');

    /* ============================
       CONFIG & API
    ============================ */
    const API_URL = '/api';
    const API_DEVICES = `${API_URL}/devices`;
    const API_MEASUREMENTS = `${API_URL}/measurements/latest`;

    function authHeaders() {
        return {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        };
    }

    /* ============================
       DEVICE LIST LOGIC
    ============================ */
    function loadDeviceList() {
        fetch(API_DEVICES, { headers: authHeaders() })
            .then(res => res.json())
            .then(devices => {
                const $select = $('#device-select');
                // Keep the first default option
                $select.find('option:not(:first)').remove();

                devices.forEach(dev => {
                    // Using the Supabase column names: device_id and device_name
                    const id = dev.device_id;
                    const name = dev.device_name || `Device ${id}`;
                    $select.append(`<option value="${id}">${name}</option>`);
                });
            })
            .catch(err => console.error('Error loading devices:', err));
    }

    // Handle Dropdown Change
    $('#device-select').on('change', function() {
        const selectedId = $(this).val();
        const selectedName = $(this).find('option:selected').text();

        if (selectedId) {
            // Update the "Office 1" text to the real device name
            $('#current-device-name').text(selectedName);
            
            // Load measurements for this specific device
            loadLatestMeasurements(selectedId);
        }
    });

    /* ============================
       LOAD MEASUREMENTS
    ============================ */
    function loadLatestMeasurements(deviceId = null) {
        let url = API_MEASUREMENTS;
        if (deviceId) url += `?device_id=${encodeURIComponent(deviceId)}`;

        fetch(url, { headers: authHeaders() })
            .then(res => {
                if (res.status === 401) {
                    window.location.href = 'login.html';
                    return;
                }
                return res.json();
            })
            .then(data => {
                if (!Array.isArray(data) || data.length === 0) {
                    console.warn("No data for this device");
                    return;
                }

                // Logic to pick latest values from the array
                const values = {};
                let latestTimestamp = null; 

                data.forEach(m => {
                    if (m.co2 !== null && values.co2 === undefined) values.co2 = m.co2;
                    if (m.temperature !== null && values.temperature === undefined) values.temperature = m.temperature;
                    if (m.humidity !== null && values.humidity === undefined) values.humidity = m.humidity;
                    if (m.pressure !== null && values.pressure === undefined) values.pressure = m.pressure;
                    
                    const rowDate = m.created_at || m.timestamp;
                    if (rowDate && (!latestTimestamp || new Date(rowDate) > new Date(latestTimestamp))) {
                        latestTimestamp = rowDate;
                    }
                });

                // Update UI Values
                if (values.co2) {
                    $(".co2.value").text(Math.round(values.co2));
                    $(".co2.state").text(values.co2 <= 1000 ? 'Normal' : 'High');
                }
                if (values.temperature) {
                    $(".temp.value").text(Number(values.temperature).toFixed(1));
                }
                if (values.humidity) {
                    $(".hum.value").text(Number(values.humidity).toFixed(1));
                }
                if (values.pressure) {
                    $(".bar.value").text(Math.round(values.pressure));
                }

                if (latestTimestamp) {
                    const dt = new Date(latestTimestamp);
                    $(".time").text(`Date and time value: ${dt.toLocaleString()}`);
                }
            })
            .catch(err => console.error('Fetch error:', err));
    }

    /* ============================
       INIT & NAVIGATION
    ============================ */
    loadDeviceList();
    loadLatestMeasurements(); // Load global latest on start

    // Auto-refresh every 15s
    setInterval(() => {
        const currentDevice = $('#device-select').val();
        loadLatestMeasurements(currentDevice);
    }, 15000);

    $(".his-values").on("click", () => location.href = "history.html");
    $(".add-device").on("click", () => location.href = "addDevice.html");
    $(".edit").on("click", () => {
        const id = $('#device-select').val();
        location.href = id ? `editDevice.html?id=${id}` : "editDevice.html";
    });
    $(".man").on("click", () => location.href = "users.html");

    $(".user.pers").on("click", function () {
        if (confirm('Do you want to log out?')) {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = 'login.html';
        }
    });
});