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
    // 1. Ask for more rows (limit=20) so we can find all sensor types
    let url = `${API_URL}/measurements?limit=20`; 
    if (deviceId && deviceId !== "") {
        url += `&device_id=${encodeURIComponent(deviceId)}`;
    }

    fetch(url, { headers: authHeaders })
        .then(res => res.json())
        .then(response => {
            // Handle the response structure from our fixed measurements.js
            const rows = response.measurements || [];

            if (rows.length === 0) {
                console.warn("No measurements found for device:", deviceId);
                clearUI();
                return;
            }

            // We will "collect" the latest non-null values
            let latestData = {
                co2: null,
                temp: null,
                hum: null,
                press: null,
                time: rows[0].created_at // Use the time from the absolute newest row
            };

            // Loop through the 20 rows to fill our latestData object
            for (const row of rows) {
                if (latestData.co2 === null && row.co2 !== null) latestData.co2 = row.co2;
                if (latestData.temp === null && row.temperature !== null) latestData.temp = row.temperature;
                if (latestData.hum === null && row.humidity !== null) latestData.hum = row.humidity;
                if (latestData.press === null && row.pressure !== null) latestData.press = row.pressure;
                
                // If we found everything, stop looking
                if (latestData.co2 && latestData.temp && latestData.hum && latestData.press) break;
            }

            // 3. UI Update
            if (latestData.co2 !== null) {
                $(".co2.value").text(Math.round(latestData.co2));
                $(".co2.state").text(latestData.co2 <= 1000 ? 'Normal' : 'High');
            }
            if (latestData.temp !== null) $(".temp.value").text(Number(latestData.temp).toFixed(1));
            if (latestData.hum !== null) $(".hum.value").text(Number(latestData.hum).toFixed(1));
            if (latestData.press !== null) {
                // Convert Pa to hPa if your sensor sends raw Pascals (97800 -> 978)
                const p = latestData.press > 5000 ? Math.round(latestData.press / 100) : Math.round(latestData.press);
                $(".bar.value").text(p);
            }

            const dt = new Date(latestData.time);
            $(".time").text(`Last Update: ${dt.toLocaleString()}`);
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