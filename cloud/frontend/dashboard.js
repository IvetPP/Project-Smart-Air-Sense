$(document).ready(function () {

    const API_URL = '/api';

    function getToken() {
        return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    }

    const token = getToken();
    console.log('DASHBOARD TOKEN:', token);

    if (!token) {
        console.warn('NO TOKEN FOUND — redirecting to login');
        window.location.href = 'login.html';
        return;
    }

    function authHeaders() {
        return { 'Authorization': 'Bearer ' + token };
    }

    const API_MEASUREMENTS = `${API_URL}/measurements/latest`;

    function loadLatestMeasurements() {
        fetch(API_MEASUREMENTS, { headers: authHeaders() })
            .then(res => {
                if (!res.ok) {
                    if (res.status === 401) {
                        alert('Unauthorized — please log in again');
                        localStorage.removeItem('auth_token');
                        sessionStorage.removeItem('auth_token');
                        window.location.href = 'login.html';
                    }
                    throw new Error('Network response was not ok');
                }
                return res.json();
            })
            .then(data => {
                console.log('LATEST MEASUREMENTS:', data);
                if (!data.length) return;

                const m = data[0];

                // update CO2
                $(".co2.value").text(m.co2);
                let co2State = m.co2 < 400 ? 'Low' : m.co2 <= 1000 ? 'Normal' : 'High';
                $(".co2.state").text(co2State);

                // update Temperature
                $(".temp.value").text(m.temperature);
                let tempState = m.temperature < 20 ? 'Low' : m.temperature <= 24 ? 'Normal' : 'High';
                $(".temp.state").text(tempState);

                // update Humidity
                $(".hum.value").text(m.humidity);
                let humState = m.humidity < 40 ? 'Low' : m.humidity <= 60 ? 'Normal' : 'High';
                $(".hum.state").text(humState);

                // update Barometric pressure
                $(".bar.value").text(m.pressure);
                let barState = m.pressure < 1013 ? 'Lower' : 'Higher';
                $(".bar.state").text(barState);

                // update IoT status
                $(".iot-status").html(
                    `Status IoT: <span style="color:${m.iot_status === 'ON' ? '#228B22' : '#FF0606'}">
                        ${m.iot_status === 'ON' ? 'ON' : 'OFF'}
                    </span>`
                );

                // update timestamp
                const dt = new Date(m.timestamp);
                $(".time").text(`Date and time value: ${dt.toLocaleString()}`);
            })
            .catch(err => {
                console.error('Fetch error:', err);
                alert('Failed to load measurements');
            });
    }

    // initial load
    loadLatestMeasurements();
    setInterval(loadLatestMeasurements, 15000); // refresh every 15s

});