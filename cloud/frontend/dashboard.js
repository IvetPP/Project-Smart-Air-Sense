$(document).ready(function () {
    /* ============================
       AUTH CHECK (Gatekeeper)
    ============================ */
    function getToken() {
        return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    }

    const token = getToken();

    // If no token exists, force redirect to login
    if (!token) {
        window.location.href = 'login.html';
        return; 
    }

    // Update UI
    $('.user.pers').text('Log out').css('cursor', 'pointer');

    /* ============================
       CONFIG & API
    ============================ */
    const API_URL = '/api';
    const API_MEASUREMENTS = `${API_URL}/measurements/latest`;

    function authHeaders() {
        return {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        };
    }

    function loadLatestMeasurements() {
        fetch(API_MEASUREMENTS, { headers: authHeaders() })
            .then(res => {
                if (res.status === 401) {
                    // Token expired or invalid
                    localStorage.removeItem('auth_token');
                    sessionStorage.removeItem('auth_token');
                    window.location.href = 'login.html';
                    return;
                }
                if (!res.ok) throw new Error('Failed to fetch measurements');
                return res.json();
            })
            .then(data => {
                if (!Array.isArray(data) || data.length === 0) return;

                const values = {};
                let latestTimestamp = null; 

                data.forEach(m => {
                    if (m.co2 !== null && values.co2 === undefined) values.co2 = Number(m.co2);
                    if (m.temperature !== null && values.temperature === undefined) values.temperature = Number(m.temperature);
                    if (m.humidity !== null && values.humidity === undefined) values.humidity = Number(m.humidity);
                    if (m.pressure !== null && values.pressure === undefined) values.pressure = Number(m.pressure);
                    
                    const rowDate = m.created_at || m.timestamp;
                    if (rowDate && (!latestTimestamp || new Date(rowDate) > new Date(latestTimestamp))) {
                        latestTimestamp = rowDate;
                    }
                });

                if (values.co2) {
                    $(".co2.value").text(Math.round(values.co2));
                    $(".co2.state").text(values.co2 <= 1000 ? 'Normal' : 'High');
                }
                if (values.temperature) {
                    $(".temp.value").text(values.temperature.toFixed(1));
                    $(".temp.state").text(values.temperature >= 20 && values.temperature <= 24 ? 'Normal' : 'Out of range');
                }
                if (values.humidity) {
                    $(".hum.value").text(values.humidity.toFixed(1));
                    $(".hum.state").text(values.humidity >= 40 && values.humidity <= 60 ? 'Normal' : 'Out of range');
                }
                if (values.pressure) {
                    $(".bar.value").text(Math.round(values.pressure));
                    $(".bar.state").text(values.pressure >= 1013 ? 'Higher' : 'Lower');
                }

                $(".iot-status").html(`Status IoT: <span style="color:#228B22">ON</span>`);

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
    loadLatestMeasurements();
    setInterval(loadLatestMeasurements, 15000);

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