const initialLat = 0.0;
const initialLon = 0.0;
const maxZoom = 9;
const minZoom = 2;
const initialZoom = 2;

var mymap = L.map('mapid', {
    'worldCopyJump': true,
    'maxZoom': maxZoom,
    'minZoom': minZoom,
    'zoom': initialZoom,
    'center': [initialLat, initialLon]
});

var style_choice_int = 0;
var previousStyle = L.tileLayer(`https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v11/tiles/{z}/{x}/{y}?access_token=${mbk.substring(0, mbk.length - 2)}`, {
    tileSize: 512,
    zoomOffset: -1,
}).addTo(mymap);

function setStyle() {
    const styles = ["satellite-streets-v11", "light-v10", "dark-v10"];
    var newStyle = L.tileLayer(`https://api.mapbox.com/styles/v1/mapbox/${styles[style_choice_int]}/tiles/{z}/{x}/{y}?access_token=${mbk.substring(0, mbk.length - 2)}`, {
        tileSize: 512,
        zoomOffset: -1,
    }).addTo(mymap);

    // Wait for animation of layer change to complete before removing previous layer
    setTimeout(() => {
        mymap.removeLayer(previousStyle);
        previousStyle = newStyle;
    }, 1000);
}

function toggleStyle() {
    style_choice_int += 1;
    if (style_choice_int > 2 || style_choice_int < 0) {
        style_choice_int = 0;
    }
    setStyle();
}

var popup = L.popup();

function onMapClick(e) {
    popup.setLatLng(e.latlng)
        .setContent(`<div class="popup" onclick="closeAllPopups()">You clicked the map at:<br>${e.latlng.toString()}</div>`)
        .openOn(mymap);
}
mymap.on('click', onMapClick);

function closeAllPopups() {
    mymap.closePopup();
}

var markers = [];
var viewMarkers = true;
var lines = [];
var arrowHeadLines = [];
var viewLines = true;
var lastDataPoint = null;
var avgTemperatureToday = getAverageTemperatureToday();
var issSpeedsBetweenEachPointSum = 0;
var avgIssSpeed = 0;
var numberOfDataPoints = 100;

var iconOptions = {
    iconUrl: '../static/img/bluestar.svg',
    iconSize: [25, 25]
}
var customIcon = L.icon(iconOptions);
var markerOptions = {
    title: "ISS Location",
    clickable: true,
    draggable: false,
    icon: customIcon
}

function getMarkersDrawLines() {
    $.getJSON("/data", function(data) {
        console.log(data);
        const startingIndex = data.length - numberOfDataPoints;

        var startingPointCircle = L.circleMarker([data[startingIndex].iss_lat, data[startingIndex].iss_lon], {
            color: "red",
            fillOpacity: 1.0,
            radius: 7.0
        }).addTo(mymap);

        lines.push(startingPointCircle);

        // Create markers, draw line before crossing lon 180, make new line after crossing lon 180, draw arrow head
        var currentLine = [];
        var uniqueLines = [];
        var previous_point = data[data.length - 1];
        const maxDistanceApart = 90;
        for (let i = startingIndex; i < data.length; i++) {
            createMarker(data[i]);

            const normalizedCurrentLon = data[i].iss_lon + 180;
            const normalizedPreviousLon = previous_point.iss_lon + 180;
            const distanceBetweenPoints = Math.abs(normalizedCurrentLon - normalizedPreviousLon);
            if (distanceBetweenPoints < maxDistanceApart) {
                currentLine.push([data[i].iss_lat, data[i].iss_lon]);
            } else {
                uniqueLines.push(currentLine); // End the current line
                currentLine = []; // start a new line
                currentLine.push([data[i].iss_lat, data[i].iss_lon])
            }
            previous_point = data[i];

            if (i <= startingIndex) {
                lastDataPoint = data[data.length - 1];
            }
        };

        uniqueLines.push(currentLine);

        for (let i = 0; i < uniqueLines.length; i++) {
            lines.push(L.polyline(uniqueLines[i], { color: 'red' }).addTo(mymap));
        }

        const lastPoint = [data[data.length - 1].iss_lat, data[data.length - 1].iss_lon];
        const penultimatePoint = [data[data.length - 2].iss_lat, data[data.length - 2].iss_lon];

        drawArrowHead(lastPoint, penultimatePoint);
    });
}

function createMarker(row) {
    var popupMsg = `<div class="popup" onclick="closeAllPopups()">`;
    const popupCountryFlag = `<img src="${row.country_flag_url}" alt="Country Flag" width="100%"/><br>`;
    const popupLatLon = `<b>Lat, Lon:</b> (${row.iss_lat}, ${row.iss_lon})`;
    const popupTimestamp = `<br>${timeConverter(row.iss_timestamp)}`;
    const popupTemp = `<br><b>Temp:</b> ${row.weather_temp} °F`;
    const popupWeatherDes = `<br><b>Weather:</b> ${row.weather_description}`;
    const popupCountryName = `<br><b>Country:</b> ${row.country_name} (${row.country_alpha_code})`;
    const popupCountryCapital = `<br><b>Capital:</b> ${row.country_capital}`;
    const popupCountryBorders = `<br><b>Borders:</b> ${row.country_borders}`;
    const popupNumDescription = `<br><b>Random Number Fact:</b> ${row.num_description}`;
    const popupCloseDiv = `</div>`;

    if (row.country_name != "") {
        popupMsg += popupCountryFlag + popupLatLon + popupTimestamp + popupTemp + popupWeatherDes + popupCountryName + popupCountryCapital + popupCountryBorders;
    } else {
        popupMsg += popupLatLon + popupTimestamp + popupTemp + popupWeatherDes;
    }

    if (row.num_description != "") {
        popupMsg += popupNumDescription;
    }

    popupMsg += popupCloseDiv;

    var marker = L.marker([row.iss_lat, row.iss_lon], markerOptions);
    marker.bindPopup(popupMsg);
    markers.push(marker);

    if (viewMarkers) {
        marker.addTo(mymap);
        marker.openPopup();
    }
}

function toggleMarkers() {
    if (viewMarkers) {
        for (var i = 0; i < markers.length; i++) {
            mymap.removeLayer(markers[i]);
        }
        viewMarkers = false;
    } else {
        for (var i = 0; i < markers.length; i++) {
            markers[i].addTo(mymap);
        }
        viewMarkers = true;
    }
}

function toggleLines() {
    if (viewLines) {
        for (var i = 0; i < lines.length; i++) {
            mymap.removeLayer(lines[i]);
        }
        for (var i = 0; i < arrowHeadLines.length; i++) {
            mymap.removeLayer(arrowHeadLines[i]);
        }
        viewLines = false;
    } else {
        for (var i = 0; i < lines.length; i++) {
            lines[i].addTo(mymap);
        }
        for (var i = 0; i < arrowHeadLines.length; i++) {
            arrowHeadLines[i].addTo(mymap);
        }
        viewLines = true;
    }
}

function getLatestMarker() {
    $.getJSON("/latest", function(latestMarkerData) {
        if (latestMarkerData.num_description != lastDataPoint.num_description) {

            createMarker(latestMarkerData);
            const previousLastPoint = [lastDataPoint.iss_lat, lastDataPoint.iss_lon];
            const latestPoint = [latestMarkerData.iss_lat, latestMarkerData.iss_lon];
            drawArrowHead(latestPoint, previousLastPoint);

            const maxDistanceApart = 90;
            const normalizedCurrentLon = latestPoint[1] + 180;
            const normalizedPreviousLon = previousLastPoint[1] + 180;
            const distanceBetweenPoints = Math.abs(normalizedCurrentLon - normalizedPreviousLon);

            if (distanceBetweenPoints < maxDistanceApart) {
                const realtimeUpdateLinePoints = [
                    [latestPoint[0], latestPoint[1]],
                    [previousLastPoint[0], previousLastPoint[1]]
                ];

                const realtimeUpdateLine = L.polyline(realtimeUpdateLinePoints, { color: 'red', dashArray: "10 30" });
                lines.push(realtimeUpdateLine);

                if (viewLines) {
                    realtimeUpdateLine.addTo(mymap);
                }
            }

            lastDataPoint = latestMarkerData;
        }
    });
}

function drawArrowHead(lastPoint, penultimatePoint) {
    const slope = Math.ceil((penultimatePoint[1] - lastPoint[1]) / (penultimatePoint[0] - lastPoint[0]) * 2) / 2;

    for (var i = 0; i < arrowHeadLines.length; i++) {
        mymap.removeLayer(arrowHeadLines[i]);
    }

    arrowHeadLines = [];

    if (slope == 2) {
        const arrowHeadPoint1 = [String(parseFloat(lastPoint[0]) - 2.5), lastPoint[1]];
        const arrowHeadPoint2 = [lastPoint[0], String(parseFloat(lastPoint[1]) - 2.5)];
        const arrowHeadLine1 = L.polyline([arrowHeadPoint1, lastPoint], { color: 'red' });
        const arrowHeadLine2 = L.polyline([arrowHeadPoint2, lastPoint], { color: 'red' });
        arrowHeadLines.push(arrowHeadLine1);
        arrowHeadLines.push(arrowHeadLine2);
        if (viewLines) {
            arrowHeadLine1.addTo(mymap);
            arrowHeadLine2.addTo(mymap);
        }
    } else if (slope == 1 || slope == 1.5) {
        const arrowHeadPoint1 = [String(parseFloat(lastPoint[0]) - 2.4), lastPoint[1]];
        const arrowHeadPoint2 = [lastPoint[0], String(parseFloat(lastPoint[1]) - 2.5)];
        const arrowHeadLine1 = L.polyline([arrowHeadPoint1, lastPoint], { color: 'red' });
        const arrowHeadLine2 = L.polyline([arrowHeadPoint2, lastPoint], { color: 'red' });
        arrowHeadLines.push(arrowHeadLine1);
        arrowHeadLines.push(arrowHeadLine2);
        if (viewLines) {
            arrowHeadLine1.addTo(mymap);
            arrowHeadLine2.addTo(mymap);
        }
    } else if (slope == -0.5) {
        const arrowHeadPoint1 = [String(parseFloat(lastPoint[0]) + 2.5), lastPoint[1]];
        const arrowHeadPoint2 = [lastPoint[0], String(parseFloat(lastPoint[1]) - 2.5)];
        const arrowHeadLine1 = L.polyline([arrowHeadPoint1, lastPoint], { color: 'red' });
        const arrowHeadLine2 = L.polyline([arrowHeadPoint2, lastPoint], { color: 'red' });
        arrowHeadLines.push(arrowHeadLine1);
        arrowHeadLines.push(arrowHeadLine2);
        if (viewLines) {
            arrowHeadLine1.addTo(mymap);
            arrowHeadLine2.addTo(mymap);
        }
    } else if (slope == -1.0 || slope == -1.5) {
        const arrowHeadPoint1 = [String(parseFloat(lastPoint[0]) + 2.5), lastPoint[1]];
        const arrowHeadPoint2 = [lastPoint[0], String(parseFloat(lastPoint[1]) - 2.5)];
        const arrowHeadLine1 = L.polyline([arrowHeadPoint1, lastPoint], { color: 'red' });
        const arrowHeadLine2 = L.polyline([arrowHeadPoint2, lastPoint], { color: 'red' });
        arrowHeadLines.push(arrowHeadLine1);
        arrowHeadLines.push(arrowHeadLine2);
        if (viewLines) {
            arrowHeadLine1.addTo(mymap);
            arrowHeadLine2.addTo(mymap);
        }
    } else if (slope == -2) {
        const arrowHeadPoint1 = [String(parseFloat(lastPoint[0]) + 2.5), String(parseFloat(lastPoint[1] - 2.5))];
        const arrowHeadPoint2 = [lastPoint[0], String(parseFloat(lastPoint[1]) - 2.5)];
        const arrowHeadLine1 = L.polyline([arrowHeadPoint1, lastPoint], { color: 'red' });
        const arrowHeadLine2 = L.polyline([arrowHeadPoint2, lastPoint], { color: 'red' });
        arrowHeadLines.push(arrowHeadLine1);
        arrowHeadLines.push(arrowHeadLine2);
        if (viewLines) {
            arrowHeadLine1.addTo(mymap);
            arrowHeadLine2.addTo(mymap);
        }
    } else {
        const arrowHeadPoint1 = [String(parseFloat(lastPoint[0]) + 2.5), String(parseFloat(lastPoint[1] - 2.5))];
        const arrowHeadPoint2 = [String(parseFloat(lastPoint[0]) - 2.5), String(parseFloat(lastPoint[1] - 2.5))];
        const arrowHeadLine1 = L.polyline([arrowHeadPoint1, lastPoint], { color: 'red' });
        const arrowHeadLine2 = L.polyline([arrowHeadPoint2, lastPoint], { color: 'red' });
        arrowHeadLines.push(arrowHeadLine1);
        arrowHeadLines.push(arrowHeadLine2);
        if (viewLines) {
            arrowHeadLine1.addTo(mymap);
            arrowHeadLine2.addTo(mymap);
        }
    }
}

function getAverageTemperatureToday() {
    $.getJSON("/avg-temp", function(avgTemp) {
        avgTemperatureToday = avgTemp.average_temp;
        document.getElementById("avgTemp").innerHTML = `Average Temperature of locations the ISS flies over today: ${avgTemperatureToday} °F`
    });
}

function calculateIssMph() {
    $.getJSON("/avg-speed", function(avgSpeed) {
        avgIssSpeed = avgSpeed.avg_speed;
        document.getElementById("avgSpeed").innerHTML = `Average Speed of the ISS: ${avgIssSpeed} MPH`
    });
}

getMarkersDrawLines();

setInterval(function() {
    getLatestMarker();
    getAverageTemperatureToday();
}, 60000);

// TASKS:
// select how many datapoints you would like to view up to 500
// Graph speed of ISS
// Graph average temperature per country visited by the ISS in bar graph
// create json file with sample data to be used when database connection fails
// response.setHeader("Set-Cookie", "HttpOnly;Secure;SameSite=Strict");
