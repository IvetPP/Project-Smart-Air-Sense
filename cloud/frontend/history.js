const API_BASE_URL = 'http://localhost:3000/api';
const PAGE_SIZE = 10;

let currentPage = 1;

$(document).ready(function () {

    $('.filter-btn.device').on('click', function () {
        togglePanel('.device-panel', this);
    });

    $('.filter-btn.time').on('click', function () {
        togglePanel('.time-panel', this);
    });

    $('.filter-btn.par').on('click', function () {
        togglePanel('.param-panel', this);
    });

    function togglePanel(panelSelector, btn) {
        $(panelSelector).slideToggle(200);
        $(btn).toggleClass('active');
    }

    $('#filter-device, #filter-parameter, #filter-from, #filter-to').on('change', function () {
        currentPage = 1;
        loadMeasurements(getFilters());
    });

    function getFilters() {
        return {
            device_id: $('#filter-device').val(),
            parameter: $('#filter-parameter').val(),
            from: $('#filter-from').val(),
            to: $('#filter-to').val()
    };
}

    const API_BASE_URL = 'http://localhost:3000/api';
    const PAGE_SIZE = 10;

    let currentPage = 1;

    $(document).ready(function () {

    loadMeasurements();

    $('.next').on('click', function () {
        currentPage++;
        loadMeasurements();
    });

    $('.prev').on('click', function () {
        if (currentPage > 1) {
        currentPage--;
        loadMeasurements();
        }
    });

    });

    function loadMeasurements(filters = {}) {

    const token =
        localStorage.getItem('auth_token') ||
        sessionStorage.getItem('auth_token');

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const offset = (currentPage - 1) * PAGE_SIZE;
    let url = API_BASE_URL + '/measurements?limit=' + PAGE_SIZE;

    if (filters.device_id) {
        url += '&device_id=' + filters.device_id;
    }

    if (filters.parameter) {
        url += '&parameter=' + filters.parameter;
    }

    if (filters.from) {
        url += '&from=' + filters.from;
    }

    if (filters.to) {
        url += '&to=' + filters.to;
    }

    $.ajax({
        url: url,
        method: 'GET',
        headers: {
        Authorization: 'Bearer ' + token
        },
        success: function (data) {
        renderTable(data);
        $('.page-info').text(currentPage);

        $('.next').prop('disabled', data.length < PAGE_SIZE);
        $('.prev').prop('disabled', currentPage === 1);
        },
        error: function (xhr) {
        if (xhr.status === 401) {
            window.location.href = '/login.html';
        } else {
            alert('Failed to load measurements');
        }
        }
    });
    }

    function renderTable(rows) {
    const $tbody = $('.history-table tbody');
    $tbody.empty();

    if (!rows.length) {
        $tbody.append(`
        <tr>
            <td colspan="6">No data available</td>
        </tr>
        `);
        return;
    }

    rows.forEach(row => {
        $tbody.append(`
        <tr>
            <td>${formatDate(row.timestamp)}</td>
            <td>${row.device_name || row.device_id}</td>
            <td>${row.parameter || '-'}</td>
            <td>${row.value} ${row.unit || ''}</td>
            <td>${renderStatus(row.status)}</td>
            <td>${row.limit_min ?? '-'} – ${row.limit_max ?? '-'}</td>
        </tr>
        `);
    });
    }

    function formatDate(ts) {
    const d = new Date(ts);
    return d.toLocaleString('cs-CZ');
    }

    function renderStatus(status) {
    if (!status) return '-';

    switch (status) {
        case 'OK':
        return '<span class="status ok">OK</span>';
        case 'WARNING':
        return '<span class="status warning">Warning</span>';
        case 'CRITICAL':
        return '<span class="status critical">Critical</span>';
        default:
        return status;
    }
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
        window.history.back();
    });

    $('.user').on('click', function () {
        const token =
            localStorage.getItem('auth_token') ||
            sessionStorage.getItem('auth_token');

            // User is NOT logged in
            if (!token) {
                window.location.href = 'login.html';
                return;
            }

            // User IS logged in
            const confirmLogout = confirm('Do you want to log out?');

            if (confirmLogout) {
                localStorage.removeItem('auth_token');
                sessionStorage.removeItem('auth_token');

                alert('You have been logged out.');
                window.location.href = 'login.html';
            }
    });
});
