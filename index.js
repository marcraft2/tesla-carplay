var fs = require('fs')
var ws = require('ws')
var http = require('http')
const { Readable } = require('stream');
const Carplay = require('node-carplay')
const url = require('url')
const Bluez = require('bluez');


// -----------------------------------------------------------------------------
//                              INIT CARPLAY
// -----------------------------------------------------------------------------


function _INIT_SERVER() {
  const config = {
          dpi: 100,
          nightMode: 0,
          hand: 0,
          boxName: 'nodePlay',
          width: 900,
          height: 702,
          fps: 30
  }
  console.log('Spawning carplay', config)


  const mp4Reader = new Readable({
      read(size) {
      }
  });
  const carplay = new Carplay(config, mp4Reader)

  // -----------------------------------------------------------------------------
  //                             INIT WEB SERVER
  // -----------------------------------------------------------------------------

  var WS_CONTROL_ENDPOINT = '/control'
  var WS_VIDEO_ENDPOINT = '/video'

  var httpServer = http.createServer();
  httpServer.listen(8080, '0.0.0.0');

  const socketVideo = new ws.Server({ noServer: true });
  const socketControl = new ws.Server({ noServer: true });

  httpServer.on('upgrade', (request, socket, head) => {
    const pathname = url.parse(request.url).pathname;
    switch (pathname) {
      case WS_CONTROL_ENDPOINT:
        socketControl.handleUpgrade(request, socket, head, (ws) => {
          socketControl.emit('connection', ws);
        });
        break;
      case WS_VIDEO_ENDPOINT:
        socketVideo.handleUpgrade(request, socket, head, (ws) => {
          socketVideo.emit('connection', ws);
        });
        break;
      default:
        console.log(`Unknown socket path: ${pathname}`);
        socket.destroy();
    }
  });

  // -----------------------------------------------------------------------------
  //                               VIDEO WS
  // -----------------------------------------------------------------------------

  socketVideo.on('connection', (wsVideo) => {
      console.log('New WebSocket VIDEO Connection');
      wsVideo.on('close', (code, msg) => {
          console.log('Disconnected WebSocket VIDEO');
      });
  });

  socketVideo.broadcast = (data) => {
      socketVideo.clients.forEach(client => {
          if (client.readyState === ws.OPEN) {
              client.send(data);
          }
      });
  };

  mp4Reader.on('data', (data) => {
      socketVideo.broadcast(data);
  })


  // -----------------------------------------------------------------------------
  //                               CONTROL WS
  // -----------------------------------------------------------------------------

  socketControl.on('connection', (wsControl) => {
      console.log('New WebSocket CONTROL Connection');
      wsControl.on('message', (msg) => {
        msg = JSON.parse(msg)
        switch (msg.type) {
          case 'click':
            carplay.sendTouch(msg.data.type, msg.data.x, msg.data.y);
            break;
          case 'statusReq':
            wsControl.send(JSON.stringify({
                type: 'statusReq',
                data: carplay.getStatus() ? 'plugged' : 'unplugged'
            }));
            break;
          default:
            console.log(`Unknown message type: ${msg.type}`);
        }
     });
     wsControl.on('close', (code, msg) => {
         console.log('Disconnected WebSocket CONTROL');
     });
  });

  socketControl.broadcast = (data) => {
      socketControl.clients.forEach(client => {
          if (client.readyState === ws.OPEN) {
              client.send(JSON.stringify(data));
          }
      });
  };

  carplay.on('status', (data) => {
      socketControl.broadcast({
          type: 'statusReq',
          data: data.status ? 'plugged' : 'unplugged'
      });
  })
}


var _INIT = false
const bluetooth = new Bluez();

// Register callback for new devices
bluetooth.on('device', async (address, props) => {
    console.log("[NEW] Device:", address, props.Name);
    if (props.Connected) {
      console.log("Bluetooth is already Connected");
      if (!_INIT) {
        _INIT = true
        _INIT_SERVER()
      }
    }
    const dev = await bluetooth.getDevice(address).catch(console.error);
    if (!dev) return;
    dev.on("PropertiesChanged", (props, invalidated) => {
        if (props.Connected) {
          console.log("Bluetooth Connected");
          if (!_INIT) {
            _INIT = true
            _INIT_SERVER()
          }
        } else {
          console.log("Bluetooth Disconnected");
        }
    });
});

bluetooth.init().then(async () => {
    // listen on first bluetooth adapter
    const adapter = await bluetooth.getAdapter();
}).catch(console.error);
