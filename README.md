
# Tesla Carplay

This project allows you to have Carplay in the tesla browser with Raspberry Pi.

## Demo

Youtube [link #1](https://youtu.be/6aNyr-Qt1Ts) old
Youtube [link #2](https://youtu.be/6aNyr-Qt1Ts)
Twitter [link](https://twitter.com/Marc20Dubois/status/1505594169959632899)

## How it works ?
In fact, add a Raspberry Pi into the tesla, this allows us to create a wifi network for the tesla to connect to. In this Raspberry Pi, we will also create a web server with a stream for Carplay video output with WebSocket. The Carplay video stream is retrieved using a CarlinKit adapter. We then create a small html page on the web server, which allows it to connect to the stream with Websocket/JSMPEG for video, and send touch gestures to control with WebSocket. For the sound, our rasberry pi can be connected in bluetooth to the tesla, because the browser does not allow the sound to pass while driving.


## What doesn't work ? (for the time being)

- Wireless Carplay
- Siri
- Sound of calls & Microphone
- Steering wheel control

## About

- You can find a [documentation](https://github.com/marcdubois71450/tesla-carplay/blob/master/tesla-doc.md) for the installation, with the necessary material.
- If you open Carplay in a browser on a computer, you must simulate a touch screen, otherwise you cannot control Carplay.
- This solution requires a 4G subscription, however you no longer need to pay the tesla subscription, and you have Wi-Fi in your car. (The tesla does not connect to your raspberry's Wi-Fi network if there is no internet access, you can however try ethernet at home)
