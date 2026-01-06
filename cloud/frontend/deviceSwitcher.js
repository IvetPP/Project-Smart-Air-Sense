$(document).ready(function () {

    const API_URL = '/api';

    function getToken() {
        return localStorage.getItem('auth_token') ||
               sessionStorage.getItem('auth_token');
    }

    const token = getToken();
    if (!token) return;

    $.ajax({
        url: API_URL + '/devices',
        method: 'GET',
        headers: { Authorization: 'Bearer ' + token },
        success: function (devices) {
            const $select = $('.custom-select select');
            $select.empty();
            $select.append('<option value="">Select device...</option>');
            
            devices.forEach(device => {
                $select.append(`<option value="${device.id}">${device.name}</option>`);
            });
            console.log('Devices loaded into dropdown');
        },
    });
});