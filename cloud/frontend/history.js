$(document).ready(function () {
    const devices = ["Device 1", "Device 2"];
    const parameters = [
        { name: "CO₂", unit: "ppm", min: 400, max: 1000 },
        { name: "Temperature", unit: "°C", min: 20, max: 24 },
        { name: "Humidity", unit: "%", min: 40, max: 60 },
        { 
            name: "Barometric pressure", 
            unit: "hPa", 
            min: 1013, 
            max: 1013, 
            limitText: "higher > 1013 hPa\nlower < 1013 hPa" 
        }
    ];

    const rowsPerPage = 10;
    let currentPage = 1;
    let allRows = [];

    // random gen mock data
    function generateData() {
        allRows = [];
        const now = new Date();
        devices.forEach(device => {
            parameters.forEach(param => {
                const value = Math.floor(Math.random() * (param.max * 1.5 - param.min * 0.5 + 1)) + param.min * 0.5;
                let status = "Normal";
                if (value < param.min) status = "Low";
                if (value > param.max) status = "High";

                const row = {
                    date: now.toLocaleString(),
                    device: device,
                    parameter: param.name,
                    value: `${value.toFixed(1)} ${param.unit}`,
                    status: status,
                    limit: param.limitText ? param.limitText : `${param.min} - ${param.max} ${param.unit}`
                };
                allRows.push(row);
            });
        });
    }

    //render table
    function renderTable(page = 1) {
        const tbody = $(".history-table tbody");
        tbody.empty();

        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        const pageRows = allRows.slice(start, end);

        pageRows.forEach(row => {

            const statusCell = row.status === "Low"  //if low then color red
                ? `<td style="color: #FF0606">${row.status}</td>` 
                : `<td>${row.status}</td>`;
            const tr = `<tr>
                <td>${row.date}</td>
                <td>${row.device}</td>
                <td>${row.parameter}</td>
                <td>${row.value}</td>
                ${statusCell}
                <td>${row.limit}</td>
            </tr>`;
            tbody.append(tr);
        });

        $(".pagination .page-info").text(`Page ${page}`);
    }

    // Pagination buttons
    $(".pagination .prev").on("click", function () {
        if (currentPage > 1) {
            currentPage--;
            renderTable(currentPage);
        }
    });

    $(".pagination .next").on("click", function () {
        if (currentPage * rowsPerPage < allRows.length) {
            currentPage++;
            renderTable(currentPage);
        }
    });

    generateData();
    renderTable(currentPage);


    //redirect to history values page
    $(".back").on("click", function () {
        window.location.href = "index.html";
    });

    //user man page
    $(".user").on("click", function () {
        window.location.href = "users.html";
    });
});
