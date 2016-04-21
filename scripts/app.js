// fork getUserMedia for multiple browser versions, for the future
// when more browsers support MediaRecorder

navigator.getUserMedia = ( navigator.getUserMedia ||
                       navigator.webkitGetUserMedia ||
                       navigator.mozGetUserMedia ||
                       navigator.msGetUserMedia);

var uagent = navigator.userAgent.toLowerCase();
if (/edge/.test(uagent)) {
 uagent = 'edge';
} else if (/opr/.test(uagent) || /opera/.test(uagent)) {
 uagent = 'opera';
} else if (/firefox/.test(uagent)) {
 uagent = 'firefox';
} else if (/chrome/.test(uagent) && !/opr/.test(uagent) && !/opera/.test(uagent)) {
 uagent = 'chrome';
} else if (/safari/.test(uagent) && !/chrome/.test(uagent) && !/opr/.test(uagent) && !/opera/.test(uagent)) {
 uagent = 'safari';
} else {
 uagent = 'undefined';
}

// Chrome needs a secure origin
var isSecureOrigin = (location.protocol === 'https:' || /localhost/.test(location.host));
if ((uagent === 'chrome') && (!isSecureOrigin)) {
  alert('Changing to secure origin');
  location.protocol = 'HTTPS';
}

// set up basic variables for app

var record = document.querySelector('.record');
var stop = document.querySelector('.stop');
var soundClips = document.querySelector('.sound-clips');
var canvas = document.querySelector('.visualizer');

// disable stop button while not recording

stop.disabled = true;

// visualiser setup - create web audio api context and canvas

var audioCtx = new (window.AudioContext || webkitAudioContext)();
var canvasCtx = canvas.getContext("2d");

//main block for doing the audio recording

if (navigator.getUserMedia) {
  //console.log('getUserMedia supported.');

  var constraints = { audio: true };
  var chunks = [];
  var mimeType, audioURL;

  var onSuccess = function(stream) {
    var mediaRecorder = new MediaRecorder(stream);

    visualize(stream);

    record.onclick = function() {
      mediaRecorder.start();
      //console.log(mediaRecorder.state);
      //console.log("recorder started");
      record.style.background = "red";

      stop.disabled = false;
      record.disabled = true;
    }

    stop.onclick = function() {
      mediaRecorder.stop();
      //console.log(mediaRecorder.state);
      //console.log("recorder stopped");
      record.style.background = "";
      record.style.color = "";
      // mediaRecorder.requestData();

      stop.disabled = true;
      record.disabled = false;
    }

    mediaRecorder.onstop = function(e) {
      //console.log("data available after MediaRecorder.stop() called.");

      var clipName = prompt('Enter a name for your sound clip?','My unnamed clip');
      //console.log(clipName);
      var clipContainer = document.createElement('article');
      var clipLabel = document.createElement('p');
      var audio = document.createElement('audio');
      var deleteButton = document.createElement('button');
      var downloadButton = document.createElement('button');

      clipContainer.classList.add('clip');
      audio.setAttribute('controls', '');
      deleteButton.textContent = 'Delete';
      deleteButton.className = 'delete';
      downloadButton.textContent = 'Download';
      downloadButton.className = 'download';

      if(clipName === null) {
        clipLabel.textContent = 'My unnamed clip';
      } else {
        clipLabel.textContent = clipName;
      }

      clipContainer.appendChild(audio);
      clipContainer.appendChild(clipLabel);
      clipContainer.appendChild(downloadButton);
      clipContainer.appendChild(deleteButton);
      soundClips.appendChild(clipContainer);

      audio.controls = true;
      if (uagent === 'firefox') {
        // default for firefox
        //'audio/ogg;codecs=opus'
        mimeType = 'audio/ogg;codecs=opus';
      }
      if (uagent === 'chrome') {
        // chrome
        // 'audio/webm;codecs=opus'
        if (MediaRecorder.isTypeSupported) {
          console.log('MediaRecorder.isTypeSupported true');
          if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
            mimeType = 'audio/webm;codecs=opus';
          } else if (MediaRecorder.isTypeSupported('audio/webm')) {
            mimeType = 'audio/webm';
          }
        }
      }
      console.log('mimeType:', mimeType);
      try {
        var blob = new Blob(chunks, {type: mimeType});
        chunks = [];
      } catch(e) {
        console.log('Error making blob');
      }
      try {
        audioURL = window.URL.createObjectURL(blob);
      } catch(e) {
        console.log('Error making objectURL');
      }
      try {
        audio.src = audioURL;
      } catch(e) {
        console.log('<audio> does not like the source');
      }
      //console.log("recorder stopped");

      downloadButton.onclick = function(e) {
        //var blob = new Blob(chunks, {type: mimeType});
        //var url = window.URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.style.display = 'none';
        a.href = audioURL;
        if (/ogg/.test(mimeType)) {
          a.download = 'test.ogg';
        } else if (/webm/.test(mimeType)) {
          a.download = 'test.webm';
        }
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
          document.body.removeChild(a);
          //window.URL.revokeObjectURL(url);
        }, 100);
      }


      deleteButton.onclick = function(e) {
        evtTgt = e.target;
        evtTgt.parentNode.parentNode.removeChild(evtTgt.parentNode);
      }

      clipLabel.onclick = function() {
        var existingName = clipLabel.textContent;
        var newClipName = prompt('Enter a new name for your sound clip?');
        if(newClipName === null) {
          clipLabel.textContent = existingName;
        } else {
          clipLabel.textContent = newClipName;
        }
      }
    }

    mediaRecorder.ondataavailable = function(e) {
      chunks.push(e.data);
    }
  }

  var onError = function(err) {
    console.log('The following error occured: ', err);
  }

  navigator.getUserMedia(constraints, onSuccess, onError);
} else {
   console.log('getUserMedia not supported on your browser!');
}

function visualize(stream) {
  var source = audioCtx.createMediaStreamSource(stream);

  var analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  var bufferLength = analyser.frequencyBinCount;
  var dataArray = new Uint8Array(bufferLength);

  source.connect(analyser);
  //analyser.connect(audioCtx.destination);

  WIDTH = canvas.width
  HEIGHT = canvas.height;

  draw()

  function draw() {

    requestAnimationFrame(draw);

    analyser.getByteTimeDomainData(dataArray);

    canvasCtx.fillStyle = 'rgb(200, 200, 200)';
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

    canvasCtx.beginPath();

    var sliceWidth = WIDTH * 1.0 / bufferLength;
    var x = 0;


    for(var i = 0; i < bufferLength; i++) {

      var v = dataArray[i] / 128.0;
      var y = v * HEIGHT/2;

      if(i === 0) {
        canvasCtx.moveTo(x, y);
      } else {
        canvasCtx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    canvasCtx.lineTo(canvas.width, canvas.height/2);
    canvasCtx.stroke();

  }
}
