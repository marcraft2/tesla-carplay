
# Tesla Carplay

This project allows you to have Carplay in the tesla browser with Raspberry Pi.

## Demo

[Youtube Link](https://youtu.be/6aNyr-Qt1Ts)

## How it works ?
In fact, add a Raspberry Pi in the tesla, that allows us to create a wifi network so that the tesla can connect. In this Raspberry Pi we will also create a Web server with a stream for the video output of Carplay with WebSocket. The Carplay video stream is retrieved using a CarlinKit adapter. We then create a small html page on the web server, which allows this to connect to the stream with Websocket/JSMPEG, and send the touch gestures to control with WebSocket.


## About

The project is not finished. You can find a [start of documentation](https://github.com/marcdubois71450/tesla-carplay/blob/master/tesla-doc.md) for the installation, with the necessary material.


## Problem

- The tesla navigator mutes the sound, if the parking mode is removed. (One solution would be to go through Bluetooth, I haven't had time to test yet)
- This solution requires a 4G subscription, however you no longer need to pay the tesla subscription, and you have Wi-Fi in your car.
- The wireless Carplay does not work. (It's possible, I haven't had time to look yet)
- You have to study whether the Tesla's usb port is disabled when you get out of the car, or if not, look at the long-term consumption.
- Wifi stability, if your usb 3G/4G dongle loses its connection, your tesla will disconnect from your Wi-Fi (I haven't yet had the time to see if we can bypass the Tesla's wi-fi security system)
- Full screen in the Tesla browser unavailable. (For the moment I have a css bug on chromium at the canvas margin)

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
