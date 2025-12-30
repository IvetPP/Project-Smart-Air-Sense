$(document).ready(function () {

    const API_URL = '/api';

    function getToken() {
        return localStorage.getItem('auth_token') ||
               sessionStorage.getItem('auth_token');
    }

    const token = getToken();
    console.log('TOKEN ON DASHBOARD:', token);

    if (!token) {
        alert('Missing token');
        window.location.href = 'login.html';
        return;
    }

    function authHeaders() {
        return { Authorization: `Bearer ${token}` };
    }

    const API_BASE = API_URL + '/measurements';

    function loadLatestMeasurements() {
        fetch(`${API_BASE}/latest`, { headers: authHeaders() })
            .then(res => {
                if (!res.ok) throw new Error('Unauthorized');
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

    $('.user.pers').on('click', function () {
        if (confirm('Do you want to log out?')) {
            localStorage.removeItem('auth_token');
            sessionStorage.removeItem('auth_token');
            window.location.href = 'login.html';
        }
    });

    loadLatestMeasurements();
    setInterval(loadLatestMeasurements, 15000);
});