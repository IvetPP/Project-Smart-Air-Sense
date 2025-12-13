$(document).ready(function () {
    const usersCount = 5;

    const firstNames = ["KlAra", "Petra", "Jana", "Michaela", "Sarka", "Monika", "Sara", "Zuzana", "Lucie"];
    const lastNames = ["Novakova", "Kadlecova", "Dvorákova", "Smiskova", "Valentova", "Bila", "Novotna"];
    const devices = [
        "Device 1",
        "Device 2",
        "Device 3",
        "Device 4",
        "Device 5"
    ];

    function randomItem(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function randomDate(startYear = 2023, endYear = 2025) {
        const start = new Date(startYear, 0, 1);
        const end = new Date(endYear, 11, 31);
        const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
        return date.toISOString().split("T")[0];
    }

    function createDeviceSelect(selectedDevice) {
        let select = `<select class="device-select">`;

        devices.forEach(device => {
            const selected = device === selectedDevice ? "selected" : "";
            select += `<option value="${device}" ${selected}>${device}</option>`;
        });

        select += `</select>`;
        return select;
    }

    
    function generateUser() {
        const firstName = randomItem(firstNames);
        const lastName = randomItem(lastNames);

        return {
            name: `${firstName} ${lastName}`,
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
            date: randomDate(),
            device: randomItem(devices)
        };
    }

    function renderUsers() {
        const tbody = $(".history-table tbody");
        tbody.empty();

        for (let i = 0; i < usersCount; i++) {
            const user = generateUser();

            const row = `
                <tr>
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td>${user.date}</td>
                    <td>
                        ${createDeviceSelect(user.device)}
                    </td>
                    <td>
                        <button class="edit" data-email="${user.email}">
                            🖊️ EDIT
                        </button>
                    </td>
                </tr>
            `;

            tbody.append(row);
        }
    }

    // Edit button click
    $(document).on("click", ".edit-btn", function () {
        const email = $(this).data("email");
        window.location.href = `editUser.html?email=${email}`;
    });

    renderUsers();

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

    //redirect to dashboard
    $(".back").on("click", function () {
        window.location.href = "index.html";
    });

    //redirect to edit user
    $(".edit").on("click", function () {
        window.location.href = "editUser.html";
    });
});