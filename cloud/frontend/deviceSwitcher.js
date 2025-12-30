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
            console.log('Devices:', devices);
        },
        error: function () {
            alert('Failed to load devices');
        }
    });
});