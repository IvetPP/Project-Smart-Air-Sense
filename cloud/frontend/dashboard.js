$(document).ready(function () {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (!token) { window.location.href = 'login.html'; return; }

    const API_URL = '/api';
    const authHeaders = { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };

    // Set Username
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        $('.user.pers').text(payload.user_name?.substring(0,5).toUpperCase() || 'LOG OUT');
    } catch (e) {
        $('.user.pers').text('USER');
    }

    function clearUI() {
        $(".co2.value, .temp.value, .hum.value, .bar.value").text("--").css("color", "black");
        $(".co2.state, .temp.state, .hum.state, .bar.state").text("No Data").css("color", "black");
        $(".box").css("border-color", "#9400D3");
        $(".time").html('Date and time value: <span style="color: black;">No records found</span>');
        $(".iot-status").html('Status IoT: <span style="color: black;">OFF</span>');
    }

    function loadDeviceList() {
        fetch(`${API_URL}/devices`, { headers: authHeaders })
            .then(res => res.json())
            .then(devices => {
                if (!Array.isArray(devices)) return;
                const $select = $('#device-select');
                $select.find('option:not(:first)').remove();
                devices.forEach(dev => {
                    // Using device_id as value to match your Supabase columns
                    $select.append(`<option value="${dev.device_id}">${dev.device_name || dev.device_id}</option>`);
                });
            })
            .catch(err => console.error("Error fetching device list:", err));
    }

    function loadLatestMeasurements(deviceId = null) {
        if (!deviceId || deviceId === "" || deviceId === "null") { 
            clearUI(); 
            $(".edit").prop('disabled', true).css({"opacity": "0.5", "cursor": "not-allowed"});
            return; 
        }

        $(".edit").prop('disabled', false).css({"opacity": "1", "cursor": "pointer"});

        fetch(`${API_URL}/measurements?limit=20&device_id=${encodeURIComponent(deviceId)}`, { headers: authHeaders })
            .then(res => res.json())
            .then(response => {
                const rows = response.measurements || [];
                if (rows.length === 0) { clearUI(); return; }

                let latest = { co2: null, temp: null, hum: null, press: null, time: rows[0].created_at };
                for (const r of rows) {
                    if (latest.co2 === null) latest.co2 = r.co2;
                    if (latest.temp === null) latest.temp = r.temperature;
                    if (latest.hum === null) latest.hum = r.humidity;
                    if (latest.press === null) latest.press = r.pressure;
                }

                const dt = new Date(latest.time);
                $(".time").html(`Date and time value: <span style="color: black;">${dt.toLocaleString()}</span>`);
                $(".iot-status").html('Status IoT: <span style="color: #228B22; font-weight: bold;">ON</span>');

                const updateBox = (selector, val, isNorm, stateText) => {
                    const stateColor = isNorm ? "black" : "red";
                    const borderColor = isNorm ? "#9400D3" : "red";
                    $(`.${selector}.value`).text(val);
                    $(`.${selector}.state`).text(stateText).css("color", stateColor);
                    $(`.${selector}`).closest('.box').css("border-color", borderColor);
                };

                if (latest.co2 !== null) {
                    const v = Math.round(latest.co2);
                    updateBox('co2', v, (v >= 400 && v <= 1000), (v < 400 ? 'Low' : v > 1000 ? 'High' : 'Normal'));
                }

                if (latest.temp !== null) {
                    const v = Number(latest.temp).toFixed(1);
                    updateBox('temp', v, (v >= 20 && v <= 24), (v >= 20 && v <= 24 ? 'Normal' : 'Out of range'));
                }

                if (latest.hum !== null) {
                    const v = Number(latest.hum).toFixed(1);
                    updateBox('hum', v, (v >= 40 && v <= 60), (v < 40 ? 'Low' : v > 60 ? 'High' : 'Normal'));
                }

                if (latest.press !== null) {
                    const p = latest.press > 5000 ? Math.round(latest.press / 100) : Math.round(latest.press);
                    let stateText = p < 1013 ? "Lower" : p > 1013 ? "Higher" : "Normal";
                    updateBox('bar', p, true, stateText); // FIXED: changed True to true
                }
            })
            .catch(err => { console.error(err); clearUI(); });
    }

    // Navigation logic
    $('#device-select').on('change', function() {
        const id = $(this).val();
        $('#current-device-name').text(id ? $(this).find('option:selected').text() : "Select a device");
        loadLatestMeasurements(id);
    });

    $(".edit").on("click", function(e) {
        e.preventDefault();
        const id = $('#device-select').val();
        if(id) {
            window.location.href = `editDevice.html?id=${encodeURIComponent(id)}`;
        }
    });

    $(".add-device").on("click", () => location.href = "addDevice.html");
    loadDeviceList();
    clearUI();
});