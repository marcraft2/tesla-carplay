
# Tesla Carplay

This project allows you to have Carplay in the tesla browser with Raspberry Pi. At least a Raspberry Pi zero W seems to be sufficient.

## Demo

- Youtube [link v0.1](https://youtu.be/6aNyr-Qt1Ts)
- Youtube [link v0.2](https://youtu.be/omYd29-GwQ8)
- Twitter [link v0.2](https://twitter.com/Marc20Dubois/status/1505594169959632899)


## How it works ?
In fact, add a Raspberry Pi into the tesla, this allows us to create a wifi network for the tesla to connect to. In this Raspberry Pi, we will also create a web server with a stream for Carplay video output with WebSocket. The Carplay video stream is retrieved using a CarlinKit adapter. We then create a small html page on the web server, which allows it to connect to the stream with Websocket/JMUXER for video, and send touch gestures to control with WebSocket. For the sound, our Raspberry pi can be connected in bluetooth to the tesla, because the browser does not allow the sound to pass while driving.


## What doesn't work ? (for the time being)

- Siri (under test)
- Sound of calls & Microphone (under test)
- Steering wheel control (AVRCP)

## About

- You can find a [documentation](https://github.com/marcdubois71450/tesla-carplay/blob/master/tesla-doc.md) for the installation, with the necessary material.
- If you open Carplay in a browser on a computer, you must simulate a touch screen, otherwise you cannot control Carplay.
- This solution requires a 4G subscription, however you no longer need to pay the tesla subscription, and you have Wi-Fi in your car. (The tesla does not connect to your raspberry's Wi-Fi network if there is no internet access, you can however try ethernet at home)


## Version / Updates

Current version : `v0.4`

### `v0.4`
- Remove jmuxer for rendering by canvas (thanks to [darreal44](https://github.com/darreal44))
- Fix in drive mode
- Fix Audio (Now carplay start once bluetooth is connected)

[from v0.3 to v0.4](https://github.com/marcdubois71450/tesla-carplay/issues/20)

### `v0.3`
-  Wireless CarPlay works 🍾
- The video is no longer encoded on the Raspberry Pi, jmuxer allows you to decode the raw mp4 stream directly in the tesla browser. (The screen resolution limit no longer depends on the Raspberry Pi, but on the tesla browser. Which means that the project should work on a Raspberry Pi 3

[from v0.2 to v0.3](https://github.com/marcdubois71450/tesla-carplay/issues/12)

### `v0.2`
- Sound works with bluetooth
- Screen résolution fix

### `v0.1` (first beta)
- The sound executed by the browser (therefore unavailable while driving)
- The screen does not take up the whole page


## Thanks

This project based on [node-carplay](https://github.com/rhysmorgan134/node-CarPlay).
Many thanks to [rhysmorgan134](https://github.com/rhysmorgan134) for this library!
