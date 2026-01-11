$(document).ready(function () {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (!token) { window.location.href = 'login.html'; return; }

    const API_URL = '/api';
    const authHeaders = { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };

    // Set Username in Profile Circle
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        $('.user.pers').text(payload.user_name?.substring(0, 5).toUpperCase() || 'LOGOUT');
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
     * FIXED: Button state is now managed independently of data presence.
     */
    // Inside dashboard.js -> loadLatestMeasurements(deviceId)

    function loadLatestMeasurements(deviceId = null) {
        // 1. If NO device is selected in the dropdown
        if (!deviceId || deviceId === "" || deviceId === "null") { 
            clearUI(); 
            $(".edit").prop('disabled', true).css({"opacity": "0.5", "cursor": "not-allowed"});
        return; 
        }
        // 2. A device IS selected, so enable the button IMMEDIATELY
        // This allows editing even if the device has 0 measurements
        $(".edit").prop('disabled', false).css({"opacity": "1", "cursor": "pointer"});

        fetch(`${API_URL}/measurements?limit=20&device_id=${encodeURIComponent(deviceId)}`, { headers: authHeaders })
            .then(res => res.json())
            .then(response => {
                const rows = response.measurements || [];
                if (rows.length === 0) { 
                    clearUI(); 
                    // DO NOT disable the button here. Just leave the UI cleared.
                    return; 
                }
                // ... rest of your logic to display data
            })
            .catch(err => {
                console.error("Error loading measurements:", err);
                clearUI();
                // DO NOT disable the button here.
            });
    }

    // --- Event Listeners ---

    $('#device-select').on('change', function() {
        const id = $(this).val();
        $('#current-device-name').text(id ? $(this).find('option:selected').text() : "Select a device");
        loadLatestMeasurements(id);
    });

    // Forced Click Handler: Works even if sensors are empty
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