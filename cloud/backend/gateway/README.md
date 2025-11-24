## Data Ingestion Flow Logic (co2-monitoring-flow)

The Node-RED flow is responsible for bridging the radio/MQTT traffic from the devices to the Cloud Backend via HTTPS.

| Step | Action | Detail |
| :--- | :--- | :--- |
| 1 | **Receive Telemetry** | Input node receives raw sensor data (CO2, Temp, Hum) from the Device Layer. |
| 2 | **Data Validation** | Filters out malformed or incomplete messages before processing. |
| 3 | **Transform Payload** | Maps the raw data into the structured JSON required by the BE: `{"device_id": "...", "metrics": { ... }}` |
| 4 | **Set Authentication** | Attaches the M2M API Key to the request header: `X-API-Key: [SECRET_KEY]` |
| 5 | **Post to Backend** | Sends the payload via HTTP POST to the ingestion endpoint: `/api/measurements` |
| 6 | **Handle Response** | Logs the BE status code (expect 201 Created) and handles any network errors. |