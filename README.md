
## Any contribution/bug report is highly appreciated. I am new to ffmpeg and USB protocol.

# Tesla Carplay

This project allows you to have Carplay in the tesla browser with Raspberry Pi.

## Demo

[Youtube Link](https://youtu.be/6aNyr-Qt1Ts)

## How it works ?
In fact, add a Raspberry Pi into the tesla, this allows us to create a wifi network for the tesla to connect to. In this Raspberry Pi, we will also create a web server with a stream for Carplay video output with WebSocket. The Carplay video stream is retrieved using a CarlinKit adapter. We then create a small html page on the web server, which allows it to connect to the stream with Websocket/JSMPEG for video, and send touch gestures to control with WebSocket. For the sound, our rasberry pi can be connected in bluetooth to the tesla, because the browser does not allow the sound to pass while driving.


## What doesn't work ? (for the time being)

- Wireless Carplay
- Siri
- Sound of calls & Microphone
- Steering wheel control

## About

The project is not finished. You can find a [documentation](https://github.com/marcdubois71450/tesla-carplay/blob/master/tesla-doc.md) for the installation, with the necessary material.

## Problem

- Tesla navigator mutes if parking mode is removed. So the sound must pass in Bluetooth
- This solution requires a 4G subscription, however you no longer need to pay the tesla subscription, and you have Wi-Fi in your car. (The tesla does not connect to your raspberry's Wi-Fi network if there is no internet access, you can however try ethernet at home)
- The
- You have to study whether the Tesla's usb port is disabled when you get out of the car, or if not, look at the long-term consumption.
- Wifi stability, if your usb 3G/4G dongle loses its connection, your tesla will disconnect from your Wi-Fi (I haven't yet had the time to see if we can bypass the Tesla's wi-fi security system)

## Tesla Security

- Tesla's browser blocks access to the website which is located on a private IP address (192.168.X.X, 10.X.X.X, 172.X.X.X). We can bypass this security with IPTABLES

```
iptables -t nat -A PREROUTING -d 1.1.1.1 -i wlan0 -p tcp --dport 80 -j DNAT --to-destination 192.168.0.254
iptables -t nat -A PREROUTING -d 1.1.1.1 -i wlan0 -p udp --dport 80 -j DNAT --to-destination 192.168.0.254
iptables -t nat -A POSTROUTING -s 192.168.0.254 -p tcp --dport 80 -j SNAT --to-source 1.1.1.1
iptables -t nat -A POSTROUTING -s 192.168.0.254 -p udp --dport 80 -j SNAT --to-source 1.1.1.1
```

- Tesla blocks browser audio when you remove parking mode. It is therefore necessary to go through bluetooth to have sound while driving.

- You cannot connect with your tesla to a Wi-Fi network that does not have internet access. We therefore need 3G/4G internet access.
