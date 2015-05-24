var cv = require('opencv'),
  async = require('async');

// camera properties
var camWidth = 640;
var camHeight = 480;
var camFps = 10;
var camInterval = 1000 / camFps;

// initialize camera
var camera = new cv.VideoCapture(0);
camera.setWidth(camWidth);
camera.setHeight(camHeight);

module.exports = function (socket) {
  setInterval(function () {
    async.auto({
      readFromCamera: readFromCamera,
      face: ['readFromCamera', detect(cv.FACE_CASCADE)],
      eyes: ['readFromCamera', detect('./node_modules/opencv/data/haarcascade_mcs_eyepair_small.xml')]
    }, emitFrame(socket));
  }, camInterval);
};

var readFromCamera = function (callback) {
  camera.read(function (err, im) {
    if (err) callback(err);
    callback(null, im);
  });
}

var detect = function (haarfile) {
  return function (callback, results) {
    var im = results['readFromCamera'];
    im.detectObject(haarfile, {}, function (err, faces) {
      if (err) callback(err);

      for (var i = 0; i < faces.length; i++) {
        face = faces[i];
        im.ellipse(face.x + face.width / 2, face.y + face.height / 2, face.width / 2, face.height / 2);
      }
      callback(null, im);
    });
  }
}

var emitFrame = function (socket) {
  return function (err, results) {
    if (err) {

    } else {
      var im = results['eyes'];
      socket.emit('frame', {
        buffer: im.toBuffer()
      });
    }
  }
}