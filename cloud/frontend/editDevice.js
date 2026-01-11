$(document).ready(function () {
    const API_URL = window.location.origin + '/api';
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    
    // Get ID from URL (e.g., editDevice.html?id=co2-monitor:0)
    const params = new URLSearchParams(window.location.search);
    const deviceId = params.get('id');

    if (!deviceId) {
        alert('No device selected!');
        window.location.href = 'index.html';
        return;
    }

    // 1. Fetch current device data to fill the form
    $.ajax({
        // Use encodeURIComponent to handle colons like "co2-monitor:0"
        url: `${API_URL}/devices/${encodeURIComponent(deviceId)}`,
        method: 'GET',
        headers: { Authorization: 'Bearer ' + token },
        success: function(dev) {
            $('#device-id').val(dev.device_id);
            $('#device-name').val(dev.device_name);
            $('#device-type').val(dev.device_type);
            $('#device-location').val(dev.location);
        },
        error: function(xhr) {
            console.error("Fetch error:", xhr);
            alert('Could not fetch device details. Status: ' + xhr.status);
        }
    });

    // 2. Handle Update
    $('#edit-device-form').off('submit').on('submit', function (e) {
        e.preventDefault();
    
        const safeId = encodeURIComponent($('#device-id').val().trim());

        const payload = {
            device_name: $('#device-name').val().trim(),
            location: $('#device-location').val().trim(),
            device_type: $('#device-type').val().trim()
        };

        $.ajax({
            url: `${API_URL}/devices/${safeId}`,
            method: 'PUT',
            headers: { Authorization: 'Bearer ' + token },
            contentType: 'application/json',
            data: JSON.stringify(payload),
            success: function () {
                alert('Device updated successfully!');
                window.location.href = 'index.html';
            },
            error: function (xhr) {
                console.error(xhr);
                alert('Error: ' + (xhr.responseJSON?.error || 'Server error'));
            }
        });
    });

    // 3. Handle Delete
    $('.delete-btn').on('click', function() {
        if(confirm('Permanently delete this device?')) {
            $.ajax({
                url: `${API_URL}/devices/${encodeURIComponent(deviceId)}`,
                method: 'DELETE',
                headers: { Authorization: 'Bearer ' + token },
                success: () => { 
                    alert('Deleted successfully'); 
                    window.location.href='index.html'; 
                },
                error: (xhr) => {
                    alert('Delete failed: ' + (xhr.responseJSON?.error || 'Unknown error'));
                }
            });
        }
    });

    $('.back, .cancel-btn').on('click', () => window.location.href = 'index.html');
});