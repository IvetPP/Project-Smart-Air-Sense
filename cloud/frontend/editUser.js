$(document).ready(function () {

    // back
    $(".back").on("click", function () {
        window.history.back();
    });

    // cancel
    $(".cancel-btn").on("click", function() {
        window.location.href = "users.html";
    });

    //TO-DO delete
    $(".delete-btn").on("click", function() {
        alert("User deleted");
        window.location.href = "users.html";
    });

    // Save button
    $("#add-device-form").on("submit", function(e) {
        e.preventDefault();
        alert("User saved");
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
