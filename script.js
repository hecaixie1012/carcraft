// ========================
// 取得畫面元件
// ========================

const arrow = document.querySelector(".arrow");
const distanceText = document.querySelector("#distance");
const statusText = document.querySelector("#status");

const latitudeText = document.querySelector("#latitude");
const longitudeText = document.querySelector("#longitude");
const locationButton = document.querySelector("#locationButton");

const parkLatitudeText = document.querySelector("#parkLatitude");
const parkLongitudeText = document.querySelector("#parkLongitude");
const saveButton = document.querySelector("#saveButton");


// ========================
// 儲存程式會使用的資料
// ========================

let angle = 0;

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
// 更新畫面上的距離
// ========================

function updateDistance() {

    if (
        currentLatitude === null ||
        currentLongitude === null ||
        savedLatitude === null ||
        savedLongitude === null
    ) {
        distanceText.textContent = "--";
        return;
    }

    const distanceInMeters = calculateDistance(
        currentLatitude,
        currentLongitude,
        savedLatitude,
        savedLongitude
    );

    const roundedDistance = Math.round(distanceInMeters);

    distanceText.textContent = roundedDistance;

    if (roundedDistance <= 5) {
        statusText.textContent = "已到達車輛附近！";
    } else {
        statusText.textContent = "距離車輛還有 " + roundedDistance + " 公尺";
    }
}


// ========================
// 取得目前位置
// ========================

locationButton.addEventListener("click", function () {

    statusText.textContent = "正在取得位置...";

    navigator.geolocation.getCurrentPosition(

        function (position) {

            currentLatitude = position.coords.latitude;
            currentLongitude = position.coords.longitude;

            latitudeText.textContent =
                currentLatitude.toFixed(6);

            longitudeText.textContent =
                currentLongitude.toFixed(6);

            statusText.textContent = "定位成功";

            updateDistance();
        },

        function (error) {

            statusText.textContent = "定位失敗";

            console.log(error);
        },

        {
            enableHighAccuracy: true,
            timeout: 10000,
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