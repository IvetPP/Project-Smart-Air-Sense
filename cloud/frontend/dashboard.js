$(document).ready(function () {

    const API_BASE = 'http://localhost:3000/api/measurements';
    const token = localStorage.getItem('token');

    if (!token) {
        alert('Missing token');
        return;
    }

    function authHeaders() {
        return {
            'Authorization': `Bearer ${token}`
        };
    }

    function loadLatestMeasurements() {
        fetch(`${API_BASE}/latest`, {
            headers: authHeaders()
        })
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

    //update co2
    function updateCO2(co2) {
        $(".co2.value").text(co2);

        let stateElem = $(".co2.state");
        let boxElem = $(".co2 .box");
        let stateText = "";

        if (co2 < 400) {
            stateText = "Low";
            stateElem.css("color", "#FF0606");
            boxElem.css("border","1px solid #FF0606");   
        } else if (co2 <= 1000) {
            stateText = "Normal";
            stateElem.css("color", "black");
            boxElem.css("border", "1px solid #9400D3");
        } else {
            stateText = "High";
            stateElem.css("color", "black");
            boxElem.css("border", "1px solid #9400D3");
        }
        stateElem.text(stateText);
    }

    //update temp
    function updateTemperature(temp) {
        $(".temp.value").text(temp);

        let stateElem = $(".temp.state");
        let boxElem = $(".temp .box");
        let stateText = "";

        if (temp < 20) {
            stateText = "Low";
            stateElem.css("color", "#FF0606");
            boxElem.css("border", "1px solid #FF0606");
        } else if (temp <= 24) {
            stateText = "Normal";
            stateElem.css("color", "black");
            boxElem.css("border", "1px solid #9400D3");
        } else {
            stateText = "High";
            stateElem.css("color", "black");
            boxElem.css("border", "1px solid #9400D3");
        }
        stateElem.text(stateText);
    }

    //update humidity
    function updateHumidity(hum) {
        $(".hum.value").text(hum);

        let stateElem = $(".hum.state");
        let boxElem = $(".hum .box");
        let stateText = "";

        if (hum < 40) {
            stateText = "Low";
            stateElem.css("color", "#FF0606");
            boxElem.css("border", "1px solid #FF0606");
        } else if (hum <= 60) {
            stateText = "Normal";
            stateElem.css("color", "black");
            boxElem.css("border", "1px solid #9400D3");
        } else {
            stateText = "High";
            stateElem.css("color", "black");
            boxElem.css("border", "1px solid #9400D3");
        }
        stateElem.text(stateText);
    }

    //update barometric pressure
    function updateBar(bar) {
        $(".bar.value").text(bar);

        let stateElem = $(".bar.state");
        let boxElem = $(".bar .box");
        let stateText = "";

        if (bar < 1013) {
            stateText = "Lower";
            stateElem.css("color", "#FF0606");
            boxElem.css("border","1px solid #FF0606");   
        } else if (bar > 1013) {
            stateText = "Higher";
            stateElem.css("color", "black");
            boxElem.css("border", "1px solid #9400D3");
        }
        stateElem.text(stateText);
    }

    //update iot status
    function updateIotStatus(status) {
        const isOn = status === 'ON' || status === 1;

        $(".iot-status").html(
        `Status IoT: <span style="color:${isOn ? '#228B22' : '#FF0606'}">
            ${isOn ? 'ON' : 'OFF'}
        </span>`
        );
    }

    //update date and time
    function updateDateTime(timestamp) {
        const d = new Date(timestamp);
        $(".time")
        .text(`Date and time value: ${d.toLocaleString()}`)
        .css("color", "black");
    }

    $(".his-values").on("click", () => location.href = "history.html");
    $(".add-device").on("click", () => location.href = "addDevice.html");
    $(".edit").on("click", () => location.href = "editDevice.html");
    $(".man").on("click", () => location.href = "users.html");

    // initial load
    loadLatestMeasurements();
    setInterval(loadLatestMeasurements, 15000); //update every 15 sec
});
