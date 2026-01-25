$(document).ready(function () {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (!token) { window.location.href = 'login.html'; return; }

    const API_URL = '/api';
    const authHeaders = { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };

    // Set Username in Profile Circle
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        $('.user.pers').text(payload.user_name?.substring(0,5).toUpperCase() || 'LOG OUT');
    } catch (e) {
        $('.user.pers').text('USER');
    }

    /**
     * Resets sensor text only.
     */
    function clearUI() {
        $(".co2.value, .temp.value, .hum.value, .bar.value").text("--").css("color", "black");
        $(".co2.state, .temp.state, .hum.state, .bar.state").text("No Data").css("color", "black");
        $(".box").css("border-color", "#9400D3");
        $(".time").css({"border": "1px solid #6e6d6d", "color": "#6e6d6d", "padding": "5px", "border-radius": "5px"})
                  .html('Date and time value: <span style="color: black;">No records found</span>');
        $(".iot-status").css({"border": "1px solid #6e6d6d", "color": "#6e6d6d", "padding": "5px", "border-radius": "5px"})
                  .html('Status IoT: <span style="color: black;">OFF</span>');
    }

    /**
     * Populates the device dropdown
     */
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
            .catch(err => console.error("Error fetching device list:", err));
    }

    /**
     * Main UI Update Logic
     */
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

                // Status IoT & Time
                $(".iot-status").css({"border": "1px solid #6e6d6d", "color": "#6e6d6d", "padding": "5px 10px", "border-radius": "5px"})
                               .html('Status IoT: <span style="color: #228B22; font-weight: bold;">ON</span>');

                const dt = new Date(latest.time);
                $(".time").css({"border": "1px solid #6e6d6d", "color": "#6e6d6d", "padding": "5px 10px", "border-radius": "5px"})
                          .html(`Date and time value: <span style="color: black;">${dt.toLocaleString()}</span>`);

                /**
                 * Helper to update UI boxes
                 */
                const updateBox = (selector, val, isNorm, stateText) => {
                    const stateColor = isNorm ? "black" : "red";
                    const borderColor = isNorm ? "#9400D3" : "red";
                    const valueTextColor = "black";

                    $(`.${selector}.value`).text(val).css("color", valueTextColor);
                    $(`.${selector}.state`).text(stateText).css("color", stateColor);
                    $(`.${selector}`).closest('.box').css("border-color", borderColor);
                    $(`.${selector}.state`).css("border-color", borderColor);
                };

                // CO2 Logic
                if (latest.co2 !== null) {
                    const v = Math.round(latest.co2);
                    updateBox('co2', v, (v >= 400 && v <= 1000), (v < 400 ? 'Low' : v > 1000 ? 'High' : 'Normal'));
                }

                // Temp Logic
                if (latest.temp !== null) {
                    const v = Number(latest.temp).toFixed(1);
                    updateBox('temp', v, (v >= 20 && v <= 24), (v >= 20 && v <= 24 ? 'Normal' : 'Out of range'));
                }

                // Humidity Logic
                if (latest.hum !== null) {
                    const v = Number(latest.hum).toFixed(1);
                    updateBox('hum', v, (v >= 40 && v <= 60), (v < 40 ? 'Low' : v > 60 ? 'High' : 'Normal'));
                }

                // Pressure Logic (UPDATED RANGE: 950 - 1050 hPa)
                if (latest.press !== null) {

                    const p = latest.press > 5000 ? Math.round(latest.press / 100) : Math.round(latest.press);

                    let stateText = "Normal";

                    if (p <1013) stateText  ="Lower";
                    else if (p> 1013) stateText = "Higher"

                    updateBox('bar', p, True, stateText)

                    /*
                    // old code for when pressure had a warning
                    const isStandard = (p === 1013);
                    const pressText = p >= 1013 ? 'Higher' : 'Lower';
                    updateBox('bar', p, isStandard, (isStandard ? 'Normal' : pressText));
                    */

                    /*
                    const p = latest.press > 5000 ? Math.round(latest.press / 100) : Math.round(latest.press);
                    const isNormal = (p >= 950 && p <= 1050);
                    let pressLabel = isNormal ? 'Normal' : (p < 950 ? 'Low' : 'High');
                    
                    updateBox('bar', p, isNormal, pressLabel);
                    */
                }
            })
            .catch(err => {
                console.error("Error loading measurements:", err);
                clearUI();
            });
    }

    // --- Event Listeners ---

    $('#device-select').on('change', function() {
        const id = $(this).val();
        $('#current-device-name').text(id ? $(this).find('option:selected').text() : "Select a device");
        loadLatestMeasurements(id);
    });

    $(".edit").on("click", function(e) {
        e.preventDefault();
        const id = $('#device-select').val();
        if(id && id !== "" && id !== "null") {
            window.location.href = `editDevice.html?id=${encodeURIComponent(id)}`;
        } else {
            alert("Please select a device first");
        }
    });

    $(".his-values").on("click", () => location.href = "history.html");
    $(".add-device").on("click", () => location.href = "addDevice.html");
    $(".man").on("click", () => location.href = "users.html");

    $(".user.pers").on("click", () => {
        if (confirm('Do you want to log out?')) {
            localStorage.clear();
            sessionStorage.clear();
            location.href = 'login.html';
        }
    });

    // Initialize
    loadDeviceList();
    clearUI();
    $(".edit").prop('disabled', true).css("opacity", "0.5");
});