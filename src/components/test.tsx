import React, { useState } from 'react';
import type { NextPage } from 'next';
import { useRequestDevice } from 'react-web-bluetooth';

const BluetoothTest: NextPage = () => {
  // The hook returns an onClick handler to launch the device selector
  // and the chosen device (if any).
  const { onClick: requestDevice, device } = useRequestDevice({
    acceptAllDevices: true,
    // Optionally, add optionalServices here if you want to access specific services.
    // For example: optionalServices: ['battery_service', 'device_information'],
  });

  // Local state to hold log messages
  const [logs, setLogs] = useState<string[]>([]);

  // Helper to both log to the console and update the on-screen logs.
  const log = (message: string) => {
    console.log(message);
    setLogs((prevLogs) => [...prevLogs, message]);
  };

  // This function connects to the device’s GATT server and enumerates available services
  // and characteristics, attempting to read values if possible.
  const handleConnect = async () => {
    if (!device) {
      log('No device connected.');
      return;
    }

    log(`Device Name: ${device.name || 'Unnamed Device'}`);
    log(`Device ID: ${device.id}`);

    if (!device.gatt) {
      log('No GATT server available on device.');
      return;
    }

    try {
      // Connect to the GATT server
      const server = await device.gatt.connect();
      log('Connected to GATT server.');

      // Get all primary services (you must have declared optionalServices for non-standard ones)
      const services = await server.getPrimaryServices();
      log(`Found ${services.length} primary service(s).`);

      // Iterate over all services
      for (const service of services) {
        log(`\nService UUID: ${service.uuid}`);

        // Get all characteristics for this service
        const characteristics = await service.getCharacteristics();
        log(`Service ${service.uuid} has ${characteristics.length} characteristic(s).`);

        // Iterate over characteristics for logging and reading values when possible
        for (const characteristic of characteristics) {
          log(`\n  Characteristic UUID: ${characteristic.uuid}`);

          // Check if the characteristic supports reading
          if (characteristic.properties.read) {
            try {
              const valueDataView = await characteristic.readValue();
              // Convert DataView to a hexadecimal string for display
              let hexString = '';
              for (let i = 0; i < valueDataView.byteLength; i++) {
                const byte = valueDataView.getUint8(i);
                hexString += ('0' + byte.toString(16)).slice(-2) + ' ';
              }
              log(`  Read value: ${hexString}`);
            } catch (readError) {
              log(`  Error reading characteristic ${characteristic.uuid}: ${readError}`);
            }
          } else {
            log(`  Characteristic is not readable.`);
          }
        }
      }
    } catch (error) {
      log(`Error connecting to GATT server: ${error}`);
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h1>Bluetooth Test</h1>

      {/* If no device is connected, show the connect button */}
      {!device ? (
        <button onClick={requestDevice}>Connect Bluetooth Device</button>
      ) : (
        <div>
          <p>Connected to: {device.name ? device.name : device.id}</p>
          <button onClick={handleConnect}>Get All Device Data</button>
        </div>
      )}

      <div style={{ marginTop: '1rem', whiteSpace: 'pre-wrap' }}>
        <h2>Logs:</h2>
        {logs.map((entry, idx) => (
          <div key={idx}>{entry}</div>
        ))}
      </div>
    </div>
  );
};

export default BluetoothTest;
