const API_BASE_URL = 'http://localhost:3000/api';

$(document).ready(function () {

    const $select = $('#device-select');
    const $officeName = $('#office-name');
    const $editBtn = $('.office .edit');

    loadDevices();


    function loadDevices() {
        const token =
        localStorage.getItem('auth_token') ||
        sessionStorage.getItem('auth_token');

 

        $.ajax({
        url: API_BASE_URL + '/devices',
        method: 'GET',
        headers: {
            Authorization: 'Bearer ' + token
        },
        success: function (devices) {
            $select.find('option:not(:first)').remove();

            devices.forEach(device => {
            $select.append(`
                <option value="${device.device_id}">
                ${device.name}
                </option>
            `);
            });
        },
        error: function () {
            alert('Failed to load devices');
        }
        });
    }

    $select.on('change', function () {
        const deviceId = $(this).val();
        const deviceName = $(this).find('option:selected').text();

        if (!deviceId) {
            $officeName.text('—');
            $editBtn.prop('disabled', true);
            return;
        }
        $officeName.text(deviceName);
        sessionStorage.setItem('active_device_id', deviceId);
        $editBtn.prop('disabled', false)
        .data('device-id', deviceId);
    });

    $editBtn.on('click', function () {
        const deviceId = $(this).data('device-id');
        if (!deviceId) return;

        window.location.href = `/edit-device.html?device_id=${encodeURIComponent(deviceId)}`;
    });

});
