import paho.mqtt.client as mqtt
import time
import asyncio
import snapcast.control
import sys

loop = asyncio.get_event_loop()
server = loop.run_until_complete(
    snapcast.control.create_server(loop, 'localhost'))
dictionary = {}


def mute(hosi_id):
    loop.run_until_complete(server.client_volume(hosi_id, {'muted': True}))


def unmute(hosi_id):
    loop.run_until_complete(server.client_volume(hosi_id, {'muted': False}))


def play_only_on(hosi_id):
    for client in server.clients:
        if client.identifier == hosi_id:
            unmute(client.identifier)
    else:
        mute(client.identifier)


def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("Connected to broker")
        global Connected
        Connected = True
    else:
        print("Connection failed")


def on_message(client, userdata, message):
    value = int(message.payload.decode("utf-8"))
    dictionary[message.topic] = value


Connected = False
broker_address = "test.mosquitto.org"
port = 1883

client = mqtt.Client("Python")
client.on_connect = on_connect
client.on_message = on_message
client.connect(broker_address, port=port)
client.loop_start()
while Connected != True:  # Wait for connection
    time.sleep(0.1)

for host_id in sys.argv[1:]:
    client.subscribe(host_id)

try:
    while True:
        time.sleep(5)
        if bool(dictionary):
            host_to_play = max(dictionary, key=dictionary.get)
            print(host_to_play)
            play_only_on(host_to_play)
except KeyboardInterrupt:
    print("Exiting")
    client.disconnect()
    client.loop_stop()
