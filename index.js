const express = require("express");
const ws = require('ws')
const { Readable } = require('stream');
const Carplay = require('node-carplay')
const url = require('url')


// -----------------------------------------------------------------------------
//                              INIT MJPEG
// -----------------------------------------------------------------------------

const { spawn } = require("child_process");
const PubSub = require("pubsub-js");
const boundaryID = "BOUNDRY";
var chunks = Buffer.from([])
var connections = 0

// -----------------------------------------------------------------------------
//                              INIT CARPLAY
// -----------------------------------------------------------------------------

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

const port = 8080;
const app = express();
app.use(express.static("./static"));
const httpServer = app.listen(port, () =>
  console.log(`Listening on port: ${port}`)
);

app.get('/vid.jpg', function(req, res) {
  connections++;
  res.writeHead(200, {
      'Content-Type': 'multipart/x-mixed-replace;boundary="' + boundaryID + '"',
      'Connection': 'keep-alive',
      'Expires': 'Fri, 27 May 1977 00:00:00 GMT',
      'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
      'Pragma': 'no-cache'
  });

  var sub = PubSub.subscribe('MJPEG', function(msg, data) {

      console.log(data.length);

      res.write('--' + boundaryID + '\r\n')
      res.write('Content-Type: image/jpeg\r\n');
      res.write('Content-Length: ' + data.length + '\r\n');
      res.write("\r\n");
      res.write(data, 'binary');
      res.write("\r\n");
  });

  res.on('close', function() {
      PubSub.unsubscribe(sub);
      res.end();
      connections--;
  });
});

var WS_CONTROL_ENDPOINT = '/control'
var WS_VIDEO_ENDPOINT = '/video'

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

    if (ffmpeg && !ffmpeg.killed && ffmpeg.stdin.writable) {
      ffmpeg.stdin.write(data);
    }
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

// -----------------------------------------------------------------------------
//                               FFMPEG MJPEG
// -----------------------------------------------------------------------------

var ffmpeg = null;
function ff() {
  ffmpeg = spawn("ffmpeg", [
    "-threads",
    "4",
    "-i",
    "-",
    "-vf",
    "fps=30",
    '-c:v', 'mjpeg',
     '-q:v','3',
     '-an',
    "-f",
    "mjpeg",
    "-"
  ]);

  ffmpeg.stdout.on("data", (chunk) => {
    if (chunk[0] == 0xFF && chunk[1] == 0xD8) {
        PubSub.publish('MJPEG', chunks);
        chunks = chunk;
    } else {
        chunks = Buffer.concat([chunks, chunk]);
    }
  });

  ffmpeg.stderr.on('data', data => {
    console.log(`ffmpeg stderr: ${data}`);
  });

  ffmpeg.on('error', restartFfmpeg);
  ffmpeg.on('end', restartFfmpeg);
  ffmpeg.on('close', restartFfmpeg);

  return ffmpeg;
}

function restartFfmpeg() {
  killFfmpeg();
  chunks = Buffer.from([])
  ffmpeg = ff();
}

function killFfmpeg() {
  if (ffmpeg) ffmpeg.kill('SIGHUP');
  ffmpeg = null;
}

restartFfmpeg();
