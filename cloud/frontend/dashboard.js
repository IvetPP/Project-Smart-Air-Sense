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

    if (token) {
        $('.user').text('Log out').css('cursor', 'pointer');
    }

    if (!token) {
        console.warn('NO TOKEN FOUND — redirecting to login');
        window.location.href = 'login.html';
        return;
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
                if (!res.ok) {
                    if (res.status === 401) {
                        alert('Session expired — please log in again');
                        localStorage.removeItem('auth_token');
                        sessionStorage.removeItem('auth_token');
                        window.location.href = 'login.html';
                    }
                    throw new Error('Failed to fetch measurements');
                }
                return res.json();
            })
            .then(data => {
                console.log('LATEST MEASUREMENTS RAW:', data);

                if (!Array.isArray(data) || data.length === 0) {
                    console.warn('No measurements available');
                    return;
                }

                /*
                  Backend returns:
                  [
                    { device_id, type: "co2", value, timestamp },
                    { device_id, type: "temperature", value, timestamp },
                    ...
                  ]
                */

                // Convert array -> object keyed by "type"
                const values = {};
                data.forEach(m => {
                    values[m.type] = Number(m.value);
                    created_at = m.timestamp;
                });

                /* ============================
                   UPDATE UI
                ============================ */

                // CO2
                if (values.co2 !== undefined) {
                    $(".co2.value").text(values.co2);
                    $(".co2.state").text(
                        values.co2 <= 1000 ? 'Normal' : 'High'
                    );
                }

                // Temperature
                if (values.temperature !== undefined) {
                    $(".temp.value").text(values.temperature.toFixed(1));
                    $(".temp.state").text(
                        values.temperature >= 20 && values.temperature <= 24
                            ? 'Normal'
                            : 'Out of range'
                    );
                }

                // Humidity
                if (values.humidity !== undefined) {
                    $(".hum.value").text(values.humidity.toFixed(1));
                    $(".hum.state").text(
                        values.humidity >= 40 && values.humidity <= 60
                            ? 'Normal'
                            : 'Out of range'
                    );
                }

                // Pressure
                if (values.pressure !== undefined) {
                    $(".bar.value").text(values.pressure);
                    $(".bar.state").text(
                        values.pressure >= 1013 ? 'Higher' : 'Lower'
                    );
                }

                // IoT status (data exists = ON)
                $(".iot-status").html(
                    `Status IoT: <span style="color:#228B22">ON</span>`
                );

                // Timestamp
                if (created_at) {
                    const dt = new Date(created_at);
                    $(".time").text(
                        `Date and time value: ${dt.toLocaleString()}`
                    );
                }
            })
            .catch(err => {
                console.error('Fetch error:', err);
                alert('Failed to load measurements');
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
        if (confirm('Do you want to log out?')) {
            localStorage.removeItem('auth_token');
            sessionStorage.removeItem('auth_token');
            window.location.href = 'login.html';
        }
    });

});