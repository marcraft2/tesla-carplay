importScripts("renderer_2d.js", "renderer_webgl.js", "renderer_webgpu.js");

// Rendering. Drawing is limited to once per animation frame.
let renderer = null;
let pendingFrame = null;
let startTime = null;
let frameCount = 0;
const rendererName = "webgl2";
const fps = 30;
const frameDuration = (1000 / fps) | 1;
// Set up a VideoDecoer.
  const decoder = new VideoDecoder({
    output(frame) {
      // Schedule the frame to be rendered.
      renderFrame(frame);
    },
    error(e) {
      setlog("decode", e);
    }
  });

function renderFrame(frame) {
  if (!pendingFrame) {
    // Schedule rendering in the next animation frame.
    requestAnimationFrame(renderAnimationFrame);
  } else {
    // Close the current pending frame before replacing it.
    pendingFrame.close();
  }
  // Set or replace the pending frame.
  pendingFrame = frame;
}

function setlog(message) {
  self.postMessage(message);
}

function renderAnimationFrame() {
  renderer.draw(pendingFrame);
  pendingFrame = null;
}

  // Startup.
function start({canvas, data}) {
  if (renderer === null) {
  // Pick a renderer to use.
  switch (rendererName) {
    case "2d":
      renderer = new Canvas2DRenderer(canvas);
      break;
    case "webgl":
      renderer = new WebGLRenderer(rendererName, canvas);
      break;
    case "webgl2":
      renderer = new WebGLRenderer(rendererName, canvas);
      break;
    case "webgpu":
      renderer = new WebGPURenderer(canvas);
      break;
  }
  const config = {
        codec: "avc1.64001f"
    };
    decoder.configure(config);
    setlog("decoder configured");
  }
  let init = {
      type: 'key',
      data: data,
      timestamp: frameCount*frameDuration
    }
  let chunk = new EncodedVideoChunk(init);
  decoder.decode(chunk);
  frameCount++;
}
// Listen for the start request.
self.addEventListener("message", message => start(message.data), {once: false});
