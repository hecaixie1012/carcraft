// ========================
// 取得畫面元件
// ========================

const arrow = document.querySelector(".arrow");
const distanceText = document.querySelector("#distance");
const statusText = document.querySelector("#status");
const bearingText = document.querySelector("#bearing");
const rotationText = document.querySelector("#rotation");

const latitudeText = document.querySelector("#latitude");
const longitudeText = document.querySelector("#longitude");
const locationButton = document.querySelector("#locationButton");
const compassButton = document.querySelector("#compassButton");
const parkLatitudeText = document.querySelector("#parkLatitude");
const parkLongitudeText = document.querySelector("#parkLongitude");
const saveButton = document.querySelector("#saveButton");


// ========================
// 儲存程式會使用的資料
// ========================

let angle = 0;
let phoneHeading = 0;

let currentLatitude = null;
let currentLongitude = null;

let savedLatitude = null;
let savedLongitude = null;


// ========================
// 測試用：鍵盤控制箭頭
// ========================

document.addEventListener("keydown", function (event) {

    if (event.key === "ArrowRight") {
        angle = angle + 10;
    }

    if (event.key === "ArrowLeft") {
        angle = angle - 10;
    }

    arrow.style.transform = "rotate(" + angle + "deg)";
});


// ========================
// 將角度轉成弧度
// ========================

function toRadians(degrees) {
    return degrees * Math.PI / 180;
}


// ========================
// 計算兩個 GPS 座標的距離
// 回傳單位：公尺
// ========================

function calculateDistance(lat1, lon1, lat2, lon2) {

    const earthRadius = 6371000;

    const latitudeDifference = toRadians(lat2 - lat1);
    const longitudeDifference = toRadians(lon2 - lon1);

    const firstLatitude = toRadians(lat1);
    const secondLatitude = toRadians(lat2);

    const a =
        Math.sin(latitudeDifference / 2) *
        Math.sin(latitudeDifference / 2) +

        Math.cos(firstLatitude) *
        Math.cos(secondLatitude) *

        Math.sin(longitudeDifference / 2) *
        Math.sin(longitudeDifference / 2);

    const c = 2 * Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
    );

    return earthRadius * c;
}

// ========================
// 計算目前位置到停車位置的方位角
// 0 = 北、90 = 東、180 = 南、270 = 西
// ========================

function calculateBearing(lat1, lon1, lat2, lon2) {

    const firstLatitude = toRadians(lat1);
    const secondLatitude = toRadians(lat2);

    const longitudeDifference =
        toRadians(lon2 - lon1);

    const y =
        Math.sin(longitudeDifference) *
        Math.cos(secondLatitude);

    const x =
        Math.cos(firstLatitude) *
        Math.sin(secondLatitude) -

        Math.sin(firstLatitude) *
        Math.cos(secondLatitude) *
        Math.cos(longitudeDifference);

    const bearingInRadians =
        Math.atan2(y, x);

    const bearingInDegrees =
        bearingInRadians * 180 / Math.PI;

    return (bearingInDegrees + 360) % 360;
}


function getLocationErrorMessage(error) {

    if (error.code === 1) {
        return "未允許定位權限";
    }

    if (error.code === 2) {
        return "目前無法取得位置";
    }

    if (error.code === 3) {
        return "定位逾時";
    }

    return "未知錯誤";
}


// ========================
// 更新畫面上的距離
// ========================

function updateDistance() {

    if (
        currentLatitude === null ||
        currentLongitude === null
    ) {
        distanceText.textContent = "--";
        bearingText.textContent = "--";
        statusText.textContent = "正在等待目前位置...";
        return;
    }

    if (
        savedLatitude === null ||
        savedLongitude === null
    ) {
        distanceText.textContent = "--";
        bearingText.textContent = "--";
        statusText.textContent = "請先記錄停車位置";
        return;
    }

    const distanceInMeters = calculateDistance(
        currentLatitude,
        currentLongitude,
        savedLatitude,
        savedLongitude
    );

    const bearingToCar = calculateBearing(
    currentLatitude,
    currentLongitude,
    savedLatitude,
    savedLongitude
    );

    bearingText.textContent = Math.round(bearingToCar);

    const roundedDistance = Math.round(distanceInMeters);

    const bearing = calculateBearing(
        currentLatitude,
        currentLongitude,
        savedLatitude,
        savedLongitude
    );

    distanceText.textContent = roundedDistance;

    if (roundedDistance <= 5) {
        statusText.textContent =
            "已到達車輛附近！停車方向：" +
            Math.round(bearing) +
            "°";
    } else {
        statusText.textContent =
            "距離車輛還有 " +
            roundedDistance +
            " 公尺，停車方向：" +
            Math.round(bearing) +
            "°";
    }

    updateArrowRotation();
}



// ========================
// 取得目前位置
// ========================

let watchId = null;

locationButton.addEventListener("click", function () {

    if (!navigator.geolocation) {
        statusText.textContent = "此瀏覽器不支援定位";
        return;
    }

    if (watchId !== null) {
        statusText.textContent = "定位追蹤中";
        return;
    }

    statusText.textContent = "正在開始定位...";

    watchId = navigator.geolocation.watchPosition(

        function (position) {

            currentLatitude = position.coords.latitude;
            currentLongitude = position.coords.longitude;

            latitudeText.textContent =
                currentLatitude.toFixed(6);

            longitudeText.textContent =
                currentLongitude.toFixed(6);

            updateDistance();
        },

        function (error) {

            watchId = null;

            statusText.textContent =
                "定位失敗：" + getLocationErrorMessage(error);

            console.log(error);
        },

        {
            enableHighAccuracy: true,
            timeout: 30000,
            maximumAge: 0
        }
    );
});

// ========================
// 記錄停車位置
// ========================

saveButton.addEventListener("click", function () {

    if (
        currentLatitude === null ||
        currentLongitude === null
    ) {
        alert("請先取得目前位置");
        return;
    }

    savedLatitude = currentLatitude;
    savedLongitude = currentLongitude;

    localStorage.setItem(
        "parkLatitude",
        savedLatitude
    );

    localStorage.setItem(
        "parkLongitude",
        savedLongitude
    );

    parkLatitudeText.textContent =
        savedLatitude.toFixed(6);

    parkLongitudeText.textContent =
        savedLongitude.toFixed(6);

    statusText.textContent = "停車位置已記錄";

    updateDistance();
});


// ========================
// 開啟網頁時載入停車位置
// ========================

const storedLatitude =
    localStorage.getItem("parkLatitude");

const storedLongitude =
    localStorage.getItem("parkLongitude");

if (
    storedLatitude !== null &&
    storedLongitude !== null
) {

    savedLatitude = Number(storedLatitude);
    savedLongitude = Number(storedLongitude);

    parkLatitudeText.textContent =
        savedLatitude.toFixed(6);

    parkLongitudeText.textContent =
        savedLongitude.toFixed(6);

    statusText.textContent = "已載入停車位置";
}

// ========================
// 啟動手機指南針
// ========================

compassButton.addEventListener("click", function () {

    if (
        typeof DeviceOrientationEvent !== "undefined" &&
        typeof DeviceOrientationEvent.requestPermission === "function"
    ) {

        DeviceOrientationEvent.requestPermission()
            .then(function (permissionState) {

                if (permissionState === "granted") {
                    startCompass();
                } else {
                    statusText.textContent =
                        "未允許使用指南針";
                }
            })
            .catch(function (error) {

                statusText.textContent =
                    "指南針權限取得失敗";

                console.error(error);
            });

    } else {

        startCompass();
    }
});


// ========================
// 開始讀取手機方向
// ========================

function startCompass() {

    statusText.textContent = "指南針已啟動";

    window.addEventListener(
        "deviceorientation",
        handleOrientation
    );
}


// ========================
// 處理手機方向
// ========================

function handleOrientation(event) {

    let heading;

    if (event.webkitCompassHeading !== undefined) {

        heading = event.webkitCompassHeading;

    } else if (event.alpha !== null) {

        heading = 360 - event.alpha;

    } else {

        statusText.textContent =
            "無法取得手機方向";

        return;
    }

    phoneHeading = heading;

    statusText.textContent =
        "手機朝向：" + Math.round(heading) + "°";
    
    updateArrowRotation();
}

function updateArrowRotation() {

    if (
        currentLatitude === null ||
        currentLongitude === null ||
        savedLatitude === null ||
        savedLongitude === null
    ) {
        rotationText.textContent = "--";
        return;
    }

    const bearingToCar = calculateBearing(
        currentLatitude,
        currentLongitude,
        savedLatitude,
        savedLongitude
    );

    let arrowRotation =
        bearingToCar - phoneHeading;

    if (arrowRotation < 0) {
        arrowRotation += 360;
    }

    rotationText.textContent =
        Math.round(arrowRotation);

    arrow.style.transform =
        "rotate(" + arrowRotation + "deg)";
}