$(document).ready(function () {

    const API_URL = '/api';

    function getToken() {
        return localStorage.getItem('auth_token') ||
               sessionStorage.getItem('auth_token');
    }

    const token = getToken();
    console.log('DASHBOARD TOKEN:', token);

    if (!token) {
        alert('Missing token');
        window.location.href = 'login.html';
        return;
    }

    fetch(API_URL + '/measurements/latest', {
        headers: { Authorization: 'Bearer ' + token }
    })
    .then(res => res.json())
    .then(console.log)
    .catch(console.error);
});