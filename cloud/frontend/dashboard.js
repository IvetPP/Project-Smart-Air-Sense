$(document).ready(function () {

    //update co2
    function updateCO2() {
        let co2 = Math.floor(Math.random() * (1500 - 200 + 1)) + 200; //200-1500 ppm
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
    function updateTemperature() {
        let temp = Math.floor(Math.random() * (30 - 15 + 1)) + 15; //15-30 C
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
    function updateHumidity() {
        let hum = Math.floor(Math.random() * (90 - 10 + 1)) + 10; //10-90 %
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
    function updateBar() {
        let bar = Math.floor(Math.random() * (1100 - 900 + 1)) + 900; //900-1100 hpa
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
    function updateIotStatus() {
        let isOn = Math.random() < 0.5;  //on or off

        let statusText = isOn ? "ON" : "OFF";
        let color = isOn ? "#228B22" : "#FF0606";

        $(".iot-status").html(`Status IoT: <span style="color:${color}">${statusText}</span>`);
    }


    //update date and time
    function updateDateTime() {
        let now = new Date();

        let d  = String(now.getDate()).padStart(2, "0");
        let m  = String(now.getMonth() + 1).padStart(2, "0");
        let y  = now.getFullYear();
        let h  = String(now.getHours()).padStart(2, "0");
        let mi = String(now.getMinutes()).padStart(2, "0");

        $(".time").text(`Date and time value: ${d}.${m}.${y} ${h}:${mi}`);
    }


    //button - update all
    $(".update").on("click", function () {
        updateCO2();
        updateTemperature();
        updateHumidity();
        updateBar();
        updateIotStatus();
        updateDateTime();
    });

    //redirect to history values page
    $(".his-values").on("click", function () {
        window.location.href = "history.html";
    });

    //redirect to add device page
    $(".add-device").on("click", function () {
        window.location.href = "addDevice.html";
    });
});
