$(document).ready(function () {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (!token) { window.location.href = 'login.html'; return; }

    const API_URL = '/api';
    const authHeaders = { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };

    const payload = JSON.parse(atob(token.split('.')[1]));
    $('.user.pers').text(payload.user_name?.substring(0,5).toUpperCase() || 'LOGOUT');

    function clearUI() {
        $(".co2.value, .temp.value, .hum.value, .bar.value").text("--");
        $(".co2.state, .temp.state, .hum.state, .bar.state").text("No Data");
        $(".time").text("Date and time value: No records found");
        // Reset border colors to neutral
        $(".box").css("border-color", "#9400D3");
        $(".edit").prop('disabled', true).css("opacity", "0.5");
    }

    function loadDeviceList() {
        fetch(`${API_URL}/devices`, { headers: authHeaders })
            .then(res => res.json())
            .then(devices => {
                if (!Array.isArray(devices)) return;
                const $select = $('#device-select');
                $select.find('option:not(:first)').remove();
                devices.forEach(dev => {
                    $select.append(`<option value="${dev.device_id}">${dev.device_name || dev.device_id}</option>`);
                });
            })
            .catch(err => console.error("Fetch error:", err));
    }

    function loadLatestMeasurements(deviceId) {
        if (!deviceId) {
            clearUI();
            $('#current-device-name').hide(); // Hide the label below if no device
            return;
        }

        $('#current-device-name').show();
        $(".edit").prop('disabled', false).css("opacity", "1");

        fetch(`${API_URL}/measurements?limit=20&device_id=${encodeURIComponent(deviceId)}`, { headers: authHeaders })
            .then(res => res.json())
            .then(response => {
                const rows = response.measurements || [];
                if (rows.length === 0) { clearUI(); return; }

                let latestData = { co2: null, temp: null, hum: null, press: null, time: rows[0].created_at };

                for (const row of rows) {
                    if (latestData.co2 === null && row.co2 !== null) latestData.co2 = row.co2;
                    if (latestData.temp === null && row.temperature !== null) latestData.temp = row.temperature;
                    if (latestData.hum === null && row.humidity !== null) latestData.hum = row.humidity;
                    if (latestData.press === null && row.pressure !== null) latestData.press = row.pressure;
                }

                // Update CO2 & Border Color
                if (latestData.co2 !== null) {
                    const val = Math.round(latestData.co2);
                    $(".co2.value").text(val);
                    const isNormal = val <= 1000 && val >= 400;
                    $(".co2.state").text(isNormal ? 'Normal' : (val < 400 ? 'Low' : 'High'));
                    $(".co2").closest('.column').find('.box').css("border-color", isNormal ? "#9400D3" : "red");
                }

                // Update Temp & Border Color
                if (latestData.temp !== null) {
                    const val = Number(latestData.temp);
                    $(".temp.value").text(val.toFixed(1));
                    const isNormal = val >= 20 && val <= 24;
                    $(".temp.state").text(isNormal ? 'Normal' : 'Out of range');
                    $(".temp").closest('.column').find('.box').css("border-color", isNormal ? "#9400D3" : "red");
                }

                // Update Humidity & Border Color
                if (latestData.hum !== null) {
                    const val = Number(latestData.hum);
                    $(".hum.value").text(val.toFixed(1));
                    const isNormal = val >= 40 && val <= 60;
                    $(".hum.state").text(isNormal ? 'Normal' : (val < 40 ? 'Low' : 'High'));
                    $(".hum").closest('.column').find('.box').css("border-color", isNormal ? "#9400D3" : "red");
                }

                // Update Pressure
                if (latestData.press !== null) {
                    const p = latestData.press > 5000 ? Math.round(latestData.press / 100) : Math.round(latestData.press);
                    $(".bar.value").text(p);
                    $(".bar.state").text(p >= 1013 ? 'Higher' : 'Lower');
                }

                const dt = new Date(latestData.time);
                $(".time").text(`Last Update: ${dt.toLocaleString()}`).css("color", "black");
            });
    }

    $('#device-select').on('change', function() {
        const id = $(this).val();
        const name = $(this).find('option:selected').text();
        if (id) {
            $('#current-device-name').text(name);
            loadLatestMeasurements(id);
        } else {
            clearUI();
            $('#current-device-name').text("Select a device");
        }
    });

    // Initial State
    clearUI();
    loadDeviceList();

    $(".his-values").on("click", () => location.href = "history.html");
    $(".add-device").on("click", () => location.href = "addDevice.html");
    $(".edit").on("click", function() {
        const id = $('#device-select').val();
        if(id) location.href = `editDevice.html?id=${encodeURIComponent(id)}`;
    });
    $(".user.pers").on("click", () => { if(confirm('Logout?')) { localStorage.clear(); location.href='login.html'; }});
});