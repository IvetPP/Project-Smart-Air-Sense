# Smart-Air-Sense

A low-power wireless system for monitoring indoor air quality, specifically Carbon Dioxide concentration (CO2) levels, temperature, humidity and barometric pressure using Hardwario TOWER components and Radio Dongle 868/915 MHz band.


## Prerequisites

* **Hardware:**
    * Hardwario CO2 Monitor Kit (Core Module, CO2 Module, Humidity tag, Barometer tag, Temperature tag and Battery Module)
    * Hardwario Radio Dongle (USB sub GHz radio 868/915 MHz band)
    * Host computer and visualization (PC, Mac, or Raspberry Pi)
* **Software:**
    * [Hardwario Playground](https://docs.hardwario.com/tower/desktop-programming/about-playground/) (quick extra local visualization and test IoT)
    * MQTT Broker (e.g., Mosquitto, included in Playground)
    * Node-RED (Included in Playground)
    * Node-RED Dashboard nodes (`node-red-dashboard`)

### Hardware Setup

**Assemble the CO2 Monitor Kit:** 
1. **Connect the CO2 Module and other modules to the Core Module.** Connect to a power source.
2.  **Flash Firmware:** Check whether the Core Module already has the appropriate firmware (e.g., `bcf-radio-co2-monitor`). If not then use Hardwario Playground to flash it.
3.  **Connect Gateway:** Plug the **Radio Dongle** into the USB port of your host computer.
4.  **Pair Device:** Use the **Hardwario Playground** application to pair the CO2 Monitor Kit with the Radio Dongle. It should appear in the 'Devices' tab.

## Backend Setup (Node-RED)

The backend is managed via a **Node-RED** to handle data reception, processing, and storage.

### 1. Data Ingestion (MQTT)

* **Node:** `mqtt in`
* **Topic:** Subscribe to the $\text{MQTT}$ topic where the CO2 data is published by the Radio Dongle.
    * *eg. check Playground for exact alias:* `node/co2-monitor:0/co2-meter/0:0/concentration`
* **Broker:** The local $\text{MQTT}$ broker (e.g., `localhost:1883`).

### 2. Data Processing

* **Node:** `function`
* **Purpose:** Extract the $\text{CO}_2$ value from the $\text{MQTT}$ message payload and format it for the database.

```javascript
// Example Node-RED Function to extract CO2 value
let co2_ppm = msg.payload.value;
let timestamp = new Date().toISOString();

msg.payload = {
    timestamp: timestamp,
    co2: co2_ppm
};

return msg;
```

### 3. Data Storage (Database)

* **Node:** A suitable database node (e.g., node-red-contrib-influxdb or a sqlite node for simplicity).
* **Function:** Store the structured data from the processing step into a time-series database for historical tracking.

## Frontend Setup (Node-RED Dashboard)

The simplest frontend is the Node-RED Dashboard.

1. **Install:** Install the `node-red-dashboard` package via the Node-RED Palette Manager.
2. **Flow:** Add dashboard nodes to the main flow:
* **Gauge Node:** Connect to the mqtt in node to display the real-time $\text{CO}_2$ level (in ppm) and other required quantities.
* **Chart Node:** Connect to the database or a flow that retrieves historical data to show a time-series graph.

## Project structure
```
/
|-- device-node/
|   |-- firmware/
|   |   |-- bcf-radio-co2-monitor/
|   |   |-- (source code for custom firmware)
|   |-- README.md (Instructions for flashing and pairing the device)
|
|-- gateway/
|   |-- node-red-flows/
|   |   |-- co2-monitoring-flow.json (The actual Node-RED flow file)
|   |-- config/
|   |   |-- mqtt-settings.txt (Optional: Settings for broker/topics)
|   |-- README.md (Instructions for setting up Node-RED and required nodes)
|
|-- cloud/
|   |-- backend/
|   |   |-- API_DESIGN.md (Blueprint for API endpoints)
|   |   |-- server.js (Main entry point for API - Express.js)
|   |   |-- package.json (Dependencies for backend)
|   |   |-- **database/** (Optional: Database schema or migration files)
|   |-- frontend/
|   |   |-- package.json (Dependencies for frontend - React)
|   |   |-- src/ (Source files for the web application)
|
|-- docs/
|   |-- business-model.md
|   |-- hardware-setup.md
|   |-- deployment-guide.md
|
|-- .gitignore
|-- README.md
```
