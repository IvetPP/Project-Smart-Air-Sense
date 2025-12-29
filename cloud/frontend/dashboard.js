const API_URL = import.meta.env.VITE_API_URL;

$(document).ready(function () {

    function getToken() {
        return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    }

    const token = getToken();

    console.log('TOKEN AFTER LOGIN:', token); // <-- move it here

    if (!token) {
        alert('Missing token');
        window.location.href = 'login.html';
        return;
    }

    function authHeaders() {
        return { 'Authorization': `Bearer ${token}` };
    }

    const API_BASE = API_URL + '/measurements';

    function loadLatestMeasurements() {
        fetch(`${API_BASE}/latest`, { headers: authHeaders() })
            .then(res => {
                if (!res.ok) throw new Error('Unauthorized or server error');
                return res.json();
            })
            .then(data => {
                if (!data.length) return;
                const m = data[0];
                updateCO2(m.co2);
                updateTemperature(m.temperature);
                updateHumidity(m.humidity);
                updateBar(m.pressure);
                updateIotStatus(m.iot_status);
                updateDateTime(m.timestamp);
            })
            .catch(err => {
                console.error(err);
                alert('Failed to load data');
            });
    }

    // your measurement update functions (co2, temp, hum, bar, iot, datetime) go here

    $(".his-values").on("click", () => location.href = "history.html");
    $(".add-device").on("click", () => location.href = "addDevice.html");
    $(".edit").on("click", () => location.href = "editDevice.html");
    $(".man").on("click", () => location.href = "users.html");

    $('.user.pers').on('click', function () {
        const token = getToken();
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        if (confirm('Do you want to log out?')) {
            localStorage.removeItem('auth_token');
            sessionStorage.removeItem('auth_token');
            alert('You have been logged out.');
            window.location.href = 'login.html';
        }
    });

    loadLatestMeasurements();
    setInterval(loadLatestMeasurements, 15000); // every 15s
});