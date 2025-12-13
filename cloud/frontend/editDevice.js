$(document).ready(function () {

    // back
    $(".back").on("click", function () {
        window.location.href = "index.html";
    });

    // cancel
    $(".cancel-btn").on("click", function() {
        window.location.href = "index.html";
    });

    // cancel 
    //TO-DO delete
    $(".delete-btn").on("click", function() {
        alert("Device deleted");
        window.location.href = "index.html";
    });

    // Save button
    $("#add-device-form").on("submit", function(e) {
        e.preventDefault();
        alert("Device saved");
    });

    //user man page
    $(".user").on("click", function () {
        window.location.href = "users.html";
    });

});
