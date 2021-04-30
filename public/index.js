var updateFlag = false;
var onlineFlag = false;
var prevTick = 0;
var gpsWatchId = 0;
var posLatitude = [];
var posLongitude = [];
var motionX = [0];
var motionY = [0];
var motionZ = [0];
var motionXAvg = [];
var motionYAvg = [];
var motionZAvg = [];
var motionXStdev = [];
var motionYStdev = [];
var motionZStdev = [];
var motionXMin = [];
var motionYMin = [];
var motionZMin = [];
var motionXMax = [];
var motionYMax = [];
var motionZMax = [];
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

function handleMotionEvent(ev) {
  console.log("here");
  ev.acceleration.x === null
    ? motionX.push(0)
    : motionX.push(ev.acceleration.x);

  ev.acceleration.y === null
    ? motionY.push(0)
    : motionY.push(ev.acceleration.y);

  ev.acceleration.z === null
    ? motionZ.push(0)
    : motionZ.push(ev.acceleration.z);
}

window.fn = {};

window.fn.startAcq = function () {
  if (!updateFlag) {
    console.log("start updating");
    // GPS tracking
    gpsWatchId = navigator.geolocation.watchPosition(
      (pos) => {
        // Motion trackinga
        if (window.DeviceMotionEvent) {
          console.log("yes");
          window.addEventListener("devicemotion", handleMotionEvent, true);
        }

        posLatitude.push(pos.coords.latitude);
        posLongitude.push(pos.coords.longitude);
        maxX = arrMax(motionX);
        maxY = arrMax(motionY);
        maxZ = arrMax(motionZ);

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
          motionX = [0];
          motionY = [0];
          motionZ = [0];
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
          const t = new Date(pos.timestamp);
          submitFirebase(t);
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
    document.getElementById("start-button").innerText = "STOP";
    updateFlag = true;
  } else {
    console.log("Stop updating");
    navigator.geolocation.clearWatch(gpsWatchId);
    window.removeEventListener("devicemotion", handleMotionEvent);
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

//calculate the motion
window.fn.calculateMotion = (t1, lat1, lng1, t2, lat2, lng2) => {
  // From Caspar Kleijne's answer starts
  /** Converts numeric degrees to radians */
  if (typeof Number.prototype.toRad === "undefined") {
    Number.prototype.toRad = function () {
      return (this * Math.PI) / 180;
    };
  }
  // From Caspar Kleijne's answer ends
  // From cletus' answer starts
  var R = 6371; // km
  var dLat = (lat2 - lat1).toRad();
  var dLon = (lon2 - lon1).toRad();
  var lat1 = lat1.toRad();
  var lat2 = lat2.toRad();

  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var distance = R * c;
  // From cletus' answer ends

  return distance / t2 - t1;
};

function firstGeolocationSuccess(position1) {
  var t1 = Date.now();
  navigator.geolocation.getCurrentPosition(function (position2) {
    var speed = calculateMotion(
      t1 / 1000,
      position1.coords.latitude,
      position1.coords.longitude,
      Date.now() / 1000,
      position2.coords.latitude,
      position2.coords.longitude
    );
  });
}
