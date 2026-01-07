$(document).ready(function () {

    /* ============================
       CONFIG
    ============================ */

    const API_URL = '/api';

    function getToken() {
        return (
            localStorage.getItem('auth_token') ||
            sessionStorage.getItem('auth_token')
        );
    }

    const token = getToken();
    console.log('DASHBOARD TOKEN:', token);

    // Update UI if logged in
    if (token) {
        $('.user.pers').text('Log out').css('cursor', 'pointer');
    }

    function authHeaders() {
        return {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        };
    }

    const API_MEASUREMENTS = `${API_URL}/measurements/latest`;

    /* ============================
       LOAD LATEST MEASUREMENTS
    ============================ */

    function loadLatestMeasurements() {
        fetch(API_MEASUREMENTS, { headers: authHeaders() })
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch measurements');
                return res.json();
            })
            .then(data => {
                console.log('1. Backend Data Received:', data);

                if (!Array.isArray(data) || data.length === 0) {
                    console.warn('No measurements available in database');
                    return;
                }

                // Since your logs show each row has separate columns (temperature, co2, humidity),
                // we iterate and grab the first non-null value for each type found in the last 20 rows.
                const values = {};
                let latestTimestamp = null; 

                data.forEach(m => {
                    // Update value only if we haven't found a more recent one in this batch
                    if (m.co2 !== null && values.co2 === undefined) values.co2 = Number(m.co2);
                    if (m.temperature !== null && values.temperature === undefined) values.temperature = Number(m.temperature);
                    if (m.humidity !== null && values.humidity === undefined) values.humidity = Number(m.humidity);
                    if (m.pressure !== null && values.pressure === undefined) values.pressure = Number(m.pressure);
                    
                    // Track the overall latest timestamp
                    const rowDate = m.created_at || m.timestamp;
                    if (rowDate && (!latestTimestamp || new Date(rowDate) > new Date(latestTimestamp))) {
                        latestTimestamp = rowDate;
                    }
                });

                console.log('2. Processed values for UI:', values);

                /* ============================
                   UPDATE UI
                ============================ */

                // CO2
                if (values.co2 !== undefined && !isNaN(values.co2)) {
                    $(".co2.value").text(Math.round(values.co2));
                    $(".co2.state").text(values.co2 <= 1000 ? 'Normal' : 'High');
                }

                // Temperature
                if (values.temperature !== undefined && !isNaN(values.temperature)) {
                    $(".temp.value").text(values.temperature.toFixed(1));
                    $(".temp.state").text(
                        values.temperature >= 20 && values.temperature <= 24 ? 'Normal' : 'Out of range'
                    );
                }

                // Humidity
                if (values.humidity !== undefined && !isNaN(values.humidity)) {
                    $(".hum.value").text(values.humidity.toFixed(1));
                    $(".hum.state").text(
                        values.humidity >= 40 && values.humidity <= 60 ? 'Normal' : 'Out of range'
                    );
                }

                // Pressure
                if (values.pressure !== undefined && !isNaN(values.pressure)) {
                    $(".bar.value").text(Math.round(values.pressure));
                    $(".bar.state").text(values.pressure >= 1013 ? 'Higher' : 'Lower');
                }

                // IoT status
                $(".iot-status").html(`Status IoT: <span style="color:#228B22">ON</span>`);

                // Timestamp
                if (latestTimestamp) {
                    const dt = new Date(latestTimestamp);
                    $(".time").text(`Date and time value: ${dt.toLocaleString()}`);
                }
            })
            .catch(err => {
                console.error('Fetch error:', err);
            });
    }

    /* ============================
       INIT
    ============================ */

    loadLatestMeasurements();
    setInterval(loadLatestMeasurements, 15000); // refresh every 15s

    /* ============================
       NAVIGATION BUTTONS
    ============================ */

    $(".his-values").on("click", () => location.href = "history.html");
    $(".add-device").on("click", () => location.href = "addDevice.html");
    $(".edit").on("click", () => location.href = "editDevice.html");
    $(".man").on("click", () => location.href = "users.html");

    $(".user.pers").on("click", function () {
        if ($(this).text() === 'Log out') {
            if (confirm('Do you want to log out?')) {
                localStorage.removeItem('auth_token');
                sessionStorage.removeItem('auth_token');
                window.location.href = 'login.html';
            }
        }
    });

});