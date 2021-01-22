# SmartHomeAudioSystem
Project created for the course *Internet of Things* at *AGH University of Science and Technology in Cracow*. The project is an audio system consisting of speakers placed throughout the house and playing music only in the room where the user is located.

## Dream Team
The following project was done by:
- [Konrad Dębiec](https://github.com/kdebiec)
- [Błażej Kustra](https://github.com/blazejkustra)
- [Maria Polak](https://github.com/BlqMary)
- [Piotr Połeć](https://github.com/piotrpolec)

## Overview
Below are the general technical assumptions of the project:
- The speaker(s) in a given room are connected and controlled by a Raspberry Pi, which also acts as a beacon scanner
- The user carries a smartphone that acts as a beacon
- The whole system is managed by a server (computer or Raspberry Pi) that:
  - Based on the information sent by the scanners, decides in which room music should be played
  - Streams music to the right room

## Technologies used
- [Mopidy](https://mopidy.com/) - Mopidy is an extensible music server written in Python. Mopidy plays music from local disk, Spotify, SoundCloud, TuneIn, and more. 
- [Snapcast](https://github.com/badaix/snapcast) - Snapcast is a multiroom client-server audio player, where all clients are time synchronized with the server to play perfectly synced audio. It's not a standalone player, but an extension that turns your existing audio player into a Sonos-like multiroom solution. Audio is captured by the server and routed to the connected clients.
- [Node-beacon-scanner](https://github.com/futomi/node-beacon-scanner) - The node-beacon-scanner is a Node.js module which allows you to scan BLE beacon packets and parse the packet data. This module supports iBeacon, Eddystone, and Estimote.
- [Paho MQTT](https://pypi.org/project/paho-mqtt/) - Python library for handling the MQTT protocol, which is responsible for communication between the server and individual clients
- [Noble](https://github.com/abandonware/noble) - A Node.js BLE (Bluetooth Low Energy) central module.

## Devices used in our demo
We have tested the following design on our hardware environment consisting of:
- 2x Raspberry Pi 4b with Raspberry Pi OS 5.4
- JBL Flip and Tibo Choros Porta connected with AUX cable (any speakers should do tbh)
- Smartphone(either of the following): 
  - Android 10 phone used as a beacon with [Beacon Simulator app](https://play.google.com/store/apps/details?id=net.alea.beaconsimulator)
  - iPhone 12 mini - iOS 14.3 with [Beacon Simulator app](https://apps.apple.com/pl/app/beacon-simulator/id1380778696)
- PC with Ubuntu 20.04 LTS that acts as a server


## Installation
### Server
A device running Ubuntu 20.04 LTS is required to run the server, although it should also work on a Raspberry Pi.

Our server consists of three things:
- Mopidy:

First, install Mopidy using:
```
wget -q -O - https://apt.mopidy.com/mopidy.gpg | sudo apt-key add -
sudo wget -q -O /etc/apt/sources.list.d/mopidy.list https://apt.mopidy.com/buster.list
sudo apt update
sudo apt install mopidy
```
Then add configuration files core.conf, local.conf and snapcast.conf

To play local audio files you need to set the path to the folder with audio files in the local.conf file

If, on the other hand, you would like to use Spotify with limited features, you first need to install [Mopidy-Spotify](https://mopidy.com/ext/spotify/), which is an extension to Mopidy:
```
sudo python3 -m pip install Mopidy-Spotify
```
You should then generate a key for Spotify. To do this, go to the [Mopidy-Spotify](https://mopidy.com/ext/spotify/) website and log in to Spotify. After generating the key, copy it and you should add to the end of the core.conf file:
```
[spotify]
username = <username>
password = <password>
client_id = <client_id>
client_secret = <client_secret>
```

At this point you should be able to run Mopidy:
```
mopidy --config $CONF_DIR/core.conf:$CONF_DIR/local.conf:$CONF_DIR/snapcast.conf
```
- Snapcast:

Install Snapcast using:
```
sudo apt-get install build-essential
sudo apt-get install libasound2-dev libpulse-dev libvorbisidec-dev libvorbis-dev libopus-dev libflac-dev libsoxr-dev alsa-utils libavahi-client-dev avahi-daemon libexpat1-dev
cd <snapcast dir>/server
Make
sudo make install
```

And run snapserver:
```
snapserver
```

- Python script:

To run the script, you should first install the [Paho MQTT library](https://pypi.org/project/paho-mqtt/) and [python-snapcast](https://github.com/happyleavesaoc/python-snapcast):
```
pip install snapcast
pip install paho-mqtt
```

Run **server.py** script using:
```
python server.py
```

### Raspberry Pi Client
Our Raspberry Pi Client (connected with speaker) consists of two modules:
- Beacon Scanner:

You may need to downgrade node.js for the scanner to work properly, it currently runs on version 8.14.0. To do this you need to install a program called "n" and the run it:
```
sudo npm install -g n
sudo n 8.14.0
```
Next, install the two modules Node-beacon-scanner and Noble:
```
cd ~
sudo npm install mqtt
sudo apt-get install bluetooth bluez libbluetooth-dev libudev-dev
sudo npm install @abandonware/noble
sudo npm install node-beacon-scanner
sudo setcap cap_net_raw+eip $(eval readlink -f which node)
```
You should now be able to run the scanner.js script posted in this repository:
```
node scanner.js <room_name> <uuid_beacon_list>
```
For example:
```
node scanner.js LivingRoomTIR AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA 50765CB7-D9EA-4E21-99A4-FA879613A492
```
- Snapcast client:

From https://github.com/badaix/snapcast/releases (in our case version 23) download the "snapclient[...]armhf.deb" and install it.

Run Snapcast client:
```
snapclient --hostID <room_name>
```
For example:
```
snapclient --hostID LivingRoomTIR
```

### Smartphone
Your phone (or other device) should work as a beacon, therefore download and install a beacon simulation app e.g. [Beacon Simulator](https://play.google.com/store/apps/details?id=net.alea.beaconsimulator&hl=pl).

## Possible improvements
This project is just a Proof-of-Concept, therefore the following are just a few possibilities for further development:
- Determine the room the user is in based on more Raspberry Pi's in the room to minimize errors due to signal reflections.
- Adding support for smartwatches and smartbands for user location instead of a smartphone
- Adding smooth volume changes as the user moves between rooms, rather than abruptly muting the sound. 

## Articles worth mention
- https://medium.com/the-monolith/how-to-build-your-open-source-multi-provider-and-multi-room-sound-system-4015e761ce7c
- https://www.home-assistant.io/blog/2016/02/18/multi-room-audio-with-snapcast/
- https://webworxshop.com/multi-room-audio-system-indoor-and-outdoor-audio-with-snapcast-and-mopidy/
