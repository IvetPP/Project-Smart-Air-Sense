$(document).ready(function () {

    // back
    $(".back").on("click", function () {
        window.location.href = "index.html";
    });

    // Delete
    $(".delete-btn").on("click", function() {
        window.location.href = "index.html";
    });

    // Save button
    $("#add-device-form").on("submit", function(e) {
        e.preventDefault();
        alert("Device saved");
    });

});
