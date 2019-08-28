const fs = require('fs');
const videoshow = require('videoshow');
const screenshot = require('desktop-screenshot');
const sizeOf = require('image-size');

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

  (async () => {
    try {
      const images = await getImages();

      const video = await makeVideo(images);

      console.log('All images: ', images);
    } catch (err) {
      console.log('Error: ', err);
    }
  })();

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

function getImages() {
  return new Promise((resolve, reject) => {
    return fs.readdir(`./${FOLDER_NAME}/`, (err, files) => {
      if (err) return reject(err);
  
      files = files.filter(file => file.includes('.png'));
      files = files.map(file => `./${FOLDER_NAME}/${file}`);

      resolve(files);
    });
  });
}

function getImageDimensions(img) {
  return new Promise((resolve, reject) => {
    return sizeOf(img, function (err, dimensions) {
      if (err) return reject(err);

      const imageDimensions = {  
          width: dimensions.width, 
          height: dimensions.height
      };
  
      resolve(imageDimensions);
    });
  });
}

async function makeVideo(images) {
  const DATE = new Date();
  const TIME = DATE.toISOString();
  const FILENAME = `SavedTimelapse_${TIME}.png`;
  const imgDimensions = await getImageDimensions(images[0]);

  var videoOptions = {
    fps: 25,
    loop: 1, // seconds
    transition: false,
    transitionDuration: 0, // seconds
    videoBitrate: 1024,
    videoCodec: 'libx264',
    size: `${imgDimensions.width}x${imgDimensions.height}`,
    audioBitrate: '128k',
    audioChannels: 0,
    format: 'mp4',
    pixelFormat: 'yuv420p'
  }
  
  return videoshow(images, videoOptions)
    .audio()
    .save(`${FILENAME}.mp4`)
    .on('start', function (command) {
      console.log('ffmpeg process started:', command)
    })
    .on('error', function (err, stdout, stderr) {
      console.error('Error:', err)
      console.error('ffmpeg stderr:', stderr)
      return Promise.reject(err, stderr); 
    })
    .on('end', function (output) {
      console.log('Video created in:', output);
      return output;
    })
}

