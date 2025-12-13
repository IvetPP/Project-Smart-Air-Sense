$(document).ready(function () {

    // back
    $(".back").on("click", function () {
        window.location.href = "users.html";
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

    //user man page
    $(".user").on("click", function () {
        window.location.href = "users.html";
    });

});
