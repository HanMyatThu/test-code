let updateFlag = false;
let onlineFlag = false;
let prevTick = 0;
let gpsWatchId = 0;
let posLatitude = [];
let posLongitude = [];
let motionX = [];
let motionY = [];
let motionZ = [];
let motionXAvg = [];
let motionYAvg = [];
let motionZAvg = [];
let motionXStdev = [];
let motionYStdev = [];
let motionZStdev = [];
let motionXMin = [];
let motionYMin = [];
let motionZMin = [];
let motionXMax = [];
let motionYMax = [];
let motionZMax = [];
let timestamp = 0;

//velocity
let initVelocity = 0; //u
let finalvelocity = 0;
let previousTime = null; //t0
let latitude = 0;
let longitude = 0;

const arrAvg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
const arrStdev = (arr) => {
  const avg = arrAvg(arr);
  let total = 0;
  for (let i = 0; i < arr.length; i++) {
    total += Math.pow(arr[i] - avg, 2);
  }
  return Math.sqrt(total / arr.length);
};
const arrMin = (arr) => {
  return Math.min(...arr);
};
const arrMax = (arr) => {
  return Math.max(...arr);
};

function submitFirebase(t) {
  const projName = document.getElementById("project-name").value;
  const pathName = document.getElementById("path-name").value;
  let Url = "https://" + projName + ".firebaseio.com/" + pathName + ".json";
  let Data = {
    timestamp: t,
    latitude: posLatitude,
    longitude: posLongitude,
    motionXAvg: motionXAvg,
    motionYAvg: motionYAvg,
    motionZAvg: motionZAvg,
    motionXStdev: motionXStdev,
    motionYStdev: motionYStdev,
    motionZStdev: motionZStdev,
    motionXMin: motionXMin,
    motionYMin: motionYMin,
    motionZMin: motionZMin,
    motionXMax: motionXMax,
    motionYMax: motionYMax,
    motionZMax: motionZMax,
  };
  const Params = {
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(Data),
    method: "POST",
  };
  console.log(JSON.stringify(Data));
  if (onlineFlag) {
    console.log("Adding to " + Url);
    document.getElementById("online-flag").innerHTML = "sending";
    fetch(Url, Params)
      .then((data) => {
        document.getElementById("online-flag").innerHTML = "OFFLINE";
        return data.json();
      })
      .then((res) => {
        console.log(res);
      });
  }
}

function motionHandler(ev) {
  motionX.push(ev.acceleration.x);
  motionY.push(ev.acceleration.y);
  motionZ.push(ev.acceleration.z);
}

window.fn = {};

window.fn.startAcq = function () {
  if (!updateFlag) {
    // GPS tracking
    gpsWatchId = navigator.geolocation.watchPosition(
      (pos) => {
        timestamp = new Date(pos.timestamp);

        posLatitude.push(pos.coords.latitude);
        posLongitude.push(pos.coords.longitude);

        maxX = arrMax(motionX);
        maxY = arrMax(motionY);
        maxZ = arrMax(motionZ);

        //calculating velocity
        initVelocity = finalvelocity;
        finalvelocity = calculateVelocity(
          initVelocity,
          motionX.length > 0 ? motionX[0] : 0,
          previousTime,
          timestamp
        );

        if (maxX != NaN) {
          motionXAvg.push(arrAvg(motionX));
          motionYAvg.push(arrAvg(motionY));
          motionZAvg.push(arrAvg(motionZ));
          motionXStdev.push(arrStdev(motionX));
          motionYStdev.push(arrStdev(motionY));
          motionZStdev.push(arrStdev(motionZ));
          motionXMin.push(arrMin(motionX));
          motionYMin.push(arrMin(motionY));
          motionZMin.push(arrMin(motionZ));
          motionXMax.push(arrMax(motionX));
          motionYMax.push(arrMax(motionY));
          motionZMax.push(arrMax(motionZ));
          motionX = [];
          motionY = [];
          motionZ = [];
        }
        document.getElementById("gps-status").innerHTML =
          pos.coords.latitude.toString() +
          "," +
          pos.coords.longitude.toString();
        if (maxX != NaN) {
          document.getElementById("motion-status").innerHTML =
            maxX.toFixed(2) + "," + maxY.toFixed(2) + "," + maxZ.toFixed(2);
        }
        // Sending data
        if (Date.now() > prevTick + 10000) {
          previousTime = timestamp;
          submitFirebase(timestamp);
          posLatitude = [];
          posLongitude = [];
          motionXAvg = [];
          motionYAvg = [];
          motionZAvg = [];
          motionXStdev = [];
          motionYStdev = [];
          motionZStdev = [];
          motionXMin = [];
          motionYMin = [];
          motionZMin = [];
          motionXMax = [];
          motionYMax = [];
          motionZMax = [];
          prevTick = Date.now();
        }
      },
      (err) => {
        console.log(err);
      },
      (options = {
        enableHighAccuracy: true,
        timeout: 10000,
      })
    );

    // Motion tracking
    try {
      DeviceMotionEvent.requestPermission().then((response) => {
        if (response == "granted") {
          window.addEventListener("devicemotion", motionHandler);
        }
      });
    } catch {
      window.addEventListener("devicemotion", motionHandler);
    }
    document.getElementById("start-button").innerText = "STOP";
    updateFlag = true;
  } else {
    console.log("Stop updating");
    navigator.geolocation.clearWatch(gpsWatchId);
    window.removeEventListener("devicemotion", motionHandler);
    gpsWatchId = 0;
    document.getElementById("start-button").innerText = "START";
    updateFlag = false;
  }
};

window.fn.toggleOnline = function () {
  if (!onlineFlag) {
    console.log("Start syncing");
    onlineFlag = true;
    document.getElementById("online-flag").innerHTML = "OFFLINE";
  } else {
    console.log("Stop syncing");
    onlineFlag = false;
    document.getElementById("online-flag").innerHTML = "ONLINE";
  }
};

//calculate the velocity vf = v0 + at;
const calculateVelocity = (v0, accelation, initialtime, finaltime) => {
  time =
    new Date(finaltime).getTime() / 1000 -
    new Date(initialtime).getTime() / 1000;

  if (time < 0) {
    return 0;
  }
  if (time > 1000) {
    return 0;
  }
  const vf = v0 + accelation * time;
  return vf;
};
