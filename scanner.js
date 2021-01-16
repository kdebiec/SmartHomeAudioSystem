const BeaconScanner = require('node-beacon-scanner');
var mqtt = require('mqtt')

const scanner = new BeaconScanner();
const client = mqtt.connect('mqtt://test.mosquitto.org')

const MAX_AGE = 10 * 1000; // 10 seconds
const ROOM_NAME = process.argv[2];
const devices = {};

for (let i = 3; i < process.argv.length; i++) {
    const device = process.argv[i];
    devices[device] = { rssi: -100, time: Date.now() };
}

const changeDeviceRssi = (uuid, rssi, time) => {
    devices[uuid] = { rssi, time };
}

const sendHighestValue = () => {
    const deviceWithHighestRssi = Object.keys(devices).reduce((a, b) => {
        const timeNow = Date.now();
        const { time: timeA, rssi: rssiA } = devices[a];
        const { time: timeB, rssi: rssiB } = devices[b];

        if (timeA + MAX_AGE < timeNow) {
            return b;
        }

        if (timeB + MAX_AGE < timeNow) {
            return a;
        }

        return rssiA > rssiB ? a : b;
    });
    console.log(devices);
    const highestRssi = devices[deviceWithHighestRssi].rssi.toString();
    client.publish(ROOM_NAME, highestRssi);
}

// Set an Event handler for becons
scanner.onadvertisement = (ad) => {
    const time = Date.now();
    const { iBeacon, rssi } = ad;
    const { uuid } = iBeacon;
    if (uuid && rssi && devices[uuid]) {
        changeDeviceRssi(uuid, rssi, time);
    }
};

// Start scanning
scanner.startScan().then(() => {
    console.log('Started to scan.');
    client.on('connect', () => {
        client.subscribe(ROOM_NAME, (err) => {
            if (!err) {
                console.log('Connected to mqqt.');
            }
        })
    })
    setInterval(sendHighestValue, 1000);
}).catch((error) => {
    console.error(error);
});
