var fs = require('fs')
var ws = require('ws')
var http = require('http')
const Carplay = require('./modules/Carplay')
const url = require('url')

var STREAM_SECRET = 'video'
var CONTROL_SECRET = 'control'
var STREAM_PORT = 8081

var httpServer = http.createServer();
httpServer.listen(8080, '0.0.0.0');

const socketVideo = new ws.Server({ noServer: true });
const socketControl = new ws.Server({ noServer: true });

httpServer.on('upgrade', (request, socket, head) => {
  const pathname = url.parse(request.url).pathname;
  if (pathname === "/" + STREAM_SECRET) {
    socketVideo.handleUpgrade(request, socket, head, (ws) => {
      socketVideo.emit('connection', ws);
    });
  } else if (pathname === "/" + CONTROL_SECRET) {
    socketControl.handleUpgrade(request, socket, head, (ws) => {
      socketControl.emit('connection', ws);
    });
  } else {
    socket.destroy();
  }
});

// -----------------------------------------------------------------------------
//                                VIDEO
// -----------------------------------------------------------------------------

socketVideo.connectionCount = 0;
socketVideo.on('connection', function(sVideo, upgradeReq) {
    socketVideo.connectionCount++;
    console.log(
        'New WebSocket VIDEO Connection: ',
        '('+socketVideo.connectionCount+' total)'
    );
    sVideo.on('close', function(code, message){
        socketVideo.connectionCount--;
        console.log(
          'Disconnected WebSocket VIDEO ('+socketVideo.connectionCount+' total)'
        );
    });
});
socketVideo.broadcast = function(data) {
    socketVideo.clients.forEach(function each(client) {
        if (client.readyState === ws.OPEN) {
            client.send(data);
        }
    });
};

var streamServer = http.createServer( function(request, response) {
    var params = request.url.substr(1).split('/');
    response.connection.setTimeout(0);
    console.log(
        'Stream Connected: ' +
        request.socket.remoteAddress + ':' +
        request.socket.remotePort
    );
    request.on('data', function(data){
        socketVideo.broadcast(data);
    });
    request.on('end',function(){
        console.log('close');
    });

})

streamServer.headersTimeout = 0;
streamServer.listen(STREAM_PORT);

// -----------------------------------------------------------------------------
//                                CONTROL
// -----------------------------------------------------------------------------

const config = {
        dpi: 15,
        nightMode: 0,
        hand: 0,
        boxName: 'nodePlay',
        width: 960,
        height: 600,
        fps: 30,
}

console.log("spawning carplay", config)
const carplay = new Carplay(config)

socketControl.connectionCount = 0;
socketControl.on('connection', function(sControl, upgradeReq) {
    console.log("NEW CONTROL CONNECTION");
    socketControl.connectionCount++;
    console.log(
        'New WebSocket CONTROL Connection: ',
        '('+socketControl.connectionCount+' total)'
    );
    sControl.on('close', function(code, message){
        socketControl.connectionCount--;
        console.log(
          'Disconnected WebSocket CONTROL ('+socketControl.connectionCount+' total)'
        );
    });
    sControl.on('message', function(message) {
      message = JSON.parse(message)
      if (message.type == 'click') {
        carplay.sendTouch(message.data.type, message.data.x, message.data.y)
        console.log(message.data.type, message.data.x, message.data.y)
      } else if (message.type == 'statusReq') {
        if(carplay.getStatus()) {
            data = {
                type: 'statusReq',
                data: 'plugged'
            }
        } else {
          data = {
              type: 'statusReq',
              data: 'unplugged'
          }
        }
        socketControl.broadcast(data);
      }
   });
});
socketControl.broadcast = function(data) {
    socketControl.clients.forEach(function each(client) {
        if (client.readyState === ws.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
};
carplay.on('status', (data) => {
    if(data.status) {
      data = {
          type: 'statusReq',
          data: 'plugged'
      }
    } else {
      data = {
          type: 'statusReq',
          data: 'unplugged'
      }
    }
    socketControl.broadcast(data);
})
