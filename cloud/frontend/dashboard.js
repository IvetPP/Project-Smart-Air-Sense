$(document).ready(function () {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (!token) { window.location.href = 'login.html'; return; }

    const API_URL = '/api';
    const authHeaders = { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };

    const payload = JSON.parse(atob(token.split('.')[1]));
    $('.user.pers').text(payload.user_name?.substring(0,5).toUpperCase() || 'LOGOUT');

    function clearUI() {
        $(".co2.value, .temp.value, .hum.value, .bar.value").text("--");
        $(".co2.state").text("No Data");
        $(".time").text("Date and time value: No records found");
    }

    function loadDeviceList() {
        fetch(`${API_URL}/devices`, { headers: authHeaders })
            .then(res => res.json())
            .then(devices => {
                if (!Array.isArray(devices)) return;
                const $select = $('#device-select');
                $select.find('option:not(:first)').remove();
                devices.forEach(dev => {
                    // Using 'device_name' which now comes from our fixed backend
                    $select.append(`<option value="${dev.device_id}">${dev.device_name || dev.device_id}</option>`);
                });
            })
            .catch(err => console.error("Fetch error:", err));
    }

    function loadLatestMeasurements(deviceId = null) {
    // 1. Construct URL correctly
    let url = `${API_URL}/measurements/latest`;
    if (deviceId && deviceId !== "") {
        url += `?device_id=${encodeURIComponent(deviceId)}`;
    }

    fetch(url, { headers: authHeaders })
        .then(res => res.json())
        .then(data => {
            // 2. Data Check: Dashboard expects data[0]
            if (!data || !Array.isArray(data) || data.length === 0) {
                console.warn("No measurements found for device:", deviceId);
                clearUI();
                return;
            }

            const m = data[0]; 
            
            // 3. UI Update - Using strict ID selectors
            if (m.co2 !== undefined) {
                $(".co2.value").text(Math.round(m.co2));
                $(".co2.state").text(m.co2 <= 1000 ? 'Normal' : 'High');
            }
            if (m.temperature) $(".temp.value").text(Number(m.temperature).toFixed(1));
            if (m.humidity) $(".hum.value").text(Number(m.humidity).toFixed(1));
            if (m.pressure) $(".bar.value").text(Math.round(m.pressure));

            const dt = new Date(m.created_at || m.timestamp);
            $(".time").text(`Date and time value: ${dt.toLocaleString()}`);
        })
        .catch(err => {
            console.error("Dashboard fetch error:", err);
            clearUI();
        });
}

    $('#device-select').on('change', function() {
        const id = $(this).val();
        $('#current-device-name').text($(this).find('option:selected').text());
        if (id) loadLatestMeasurements(id); else loadLatestMeasurements();
    });

    loadDeviceList();
    loadLatestMeasurements();

    $(".his-values").on("click", () => location.href = "history.html");
    $(".add-device").on("click", () => location.href = "addDevice.html");
    $(".edit").on("click", () => {
        const id = $('#device-select').val();
        if(!id) return alert("Please select a device first");
        location.href = `editDevice.html?id=${encodeURIComponent(id)}`;
    });
    $(".man").on("click", () => location.href = "users.html");
    $(".user.pers").on("click", () => { if(confirm('Logout?')) { localStorage.clear(); sessionStorage.clear(); location.href='login.html'; }});
});