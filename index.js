const fs = require('fs');
var screenshot = require('desktop-screenshot');

const FOLDER_NAME = 'screenshots';

const state = {
  isRecording: false,
  numScreenshotsTaken: 0,
  intervalFn: null
}

const trigger = document.getElementById('screenshot-start-button');
      trigger.addEventListener('click', toggleScreenshotting );

const recordingLight = document.getElementById('recording-light');
const screenshotCount = document.getElementById('screenshot-count');
const screenshotTime = document.getElementById('screenshot-time');



function toggleScreenshotting () {
  if (state.isRecording) {
    return stopScreenshotting();
  } else {
    return startScreenshotting();
  }
}


function startScreenshotting(){
  const SECONDS_BETWEEN = document.getElementById('interval').value || 60;
  const INTERVAL = SECONDS_BETWEEN * 1000;
  const COMPRESSION = document.getElementById('compress').value || 75;
  const FILE_PREFIX = document.getElementById('file-name').value || 'capture';

  checkDirectory();

  state.isRecording = true;

  activateRecordingInterface();

  // Set interval to wider scope so we can cancel outside this function
  const intervalFn = setInterval(() => {
    const DATE = new Date();
    const TIME = DATE.toISOString();
    const FILENAME = `${FILE_PREFIX}_${TIME}.png`;

    const friendlyDateTime = `${DATE.toDateString()} ${DATE.toLocaleTimeString()}`;

    state.numScreenshotsTaken++;
    screenshotCount.innerHTML = state.numScreenshotsTaken;
    screenshotTime.innerHTML = friendlyDateTime;

    screenshot(`./${FOLDER_NAME}/${FILENAME}`, {quality: COMPRESSION}, function(error, isComplete) {
        if (error) return console.log("Screenshot failed", error);
        
        console.log(`Screenshot succeeded: ${FILENAME}`);
    });
  }, INTERVAL);

  state.intervalFn = intervalFn;

  return intervalFn;
}

function stopScreenshotting() {
  state.isRecording = false;

  deactivateRecordingInterface();

  return clearInterval(state.intervalFn);
}

function activateRecordingInterface() {
    trigger.style.backgroundColor = "#D64242";
    trigger.innerHTML = "Stop Screenshotting";
    recordingLight.style.display = 'block';
}

function deactivateRecordingInterface() {
    trigger.style.backgroundColor = "#42D66A";
    trigger.innerHTML = "Start Screenshotting";
    recordingLight.style.display = 'none';
}

function checkDirectory() {
  if (!fs.existsSync(FOLDER_NAME)) {
    fs.mkdir(FOLDER_NAME, (err) => {
      if (err) throw err;
    });
  }
}
