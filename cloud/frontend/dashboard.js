$(document).ready(function () {

    const API_URL = '/api';

    function getToken() {
        return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    }

    const token = getToken();
    console.log('DASHBOARD TOKEN:', token);

    if (!token) {
        console.warn('NO TOKEN FOUND — stopping dashboard JS');
        window.location.href = 'login.html'; // redirect if missing
        return;
    }

    fetch(`${API_URL}/measurements/latest`, {
        headers: { Authorization: 'Bearer ' + token }
    })
    .then(res => {
        if (!res.ok) {
            if (res.status === 401) {
                alert('Unauthorized — please log in again');
                localStorage.removeItem('auth_token');
                sessionStorage.removeItem('auth_token');
                window.location.href = 'login.html';
            }
            throw new Error('Network response was not ok');
        }
        return res.json();
    })
    .then(data => {
        console.log('LATEST MEASUREMENTS:', data);
        // TODO: update your dashboard DOM here
    })
    .catch(err => {
        console.error('Fetch error:', err);
        alert('Failed to load measurements');
    });
});