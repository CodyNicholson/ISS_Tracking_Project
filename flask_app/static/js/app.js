// ***** GLOBAL VARIABLES *****
var viewMarkers = true;
var viewLines = true;
var markers = [];
var lines = [];
var arrowHeadLines = [];
var lastDataPoint = null;

var avgTemperatureToday;
var avgIssSpeed;
var uniqueWeatherCountsToday;
// *** END GLOBAL VARIABLES ***

// **** SETUP MAP & MARKERS ****
var mymap = L.map('mapid', {
    'worldCopyJump': true,
    'maxZoom': 9,
    'minZoom': 2,
    'zoom': 2,
    'center': [0.0, 0.0]
});

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
// **** END SETUP MAP & MARKERS ****

// ************ MAP STYLING *****************
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
// ************ END MAP STYLING ****************

// ************ CREATE POPUP & POPUP UTILS *********
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
// ************ END CREATE POPUP & POPUP UTILS *********

// ***** MAP FUNCTIONS *****
function getMarkersDrawLines() {
    var numDataPoints = document.getElementById("data-point-quantity").value;
    //Reset relevant global vars
    removeMarkers();
    removeLines();
    lines = [];
    markers = [];
    arrowHeadLines = [];
    lastDataPoint = null;
    viewMarkers = true;
    viewLines = true;

    $.getJSON(`/data?numRows=${numDataPoints}`, function(data) {
        const startingIndex = data.length - numDataPoints;

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
        removeMarkers();
        viewMarkers = false;
    } else {
        for (var i = 0; i < markers.length; i++) {
            markers[i].addTo(mymap);
        }
        viewMarkers = true;
    }
}

function removeMarkers() {
    for (var i = 0; i < markers.length; i++) {
        mymap.removeLayer(markers[i]);
    }
}

function toggleLines() {
    if (viewLines) {
        removeLines();
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

function removeLines() {
    for (var i = 0; i < lines.length; i++) {
        mymap.removeLayer(lines[i]);
    }
    for (var i = 0; i < arrowHeadLines.length; i++) {
        mymap.removeLayer(arrowHeadLines[i]);
    }
}

function getLatestMarker() {
    $.getJSON("/data?numRows=1", function(latestMarkerData) {
        latestMarkerData = latestMarkerData[0];
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
// ***** END MAP FUNCTIONS ******

// ***** GET DATA FUNCTIONS *****
function getAverageTemperature() {
    $.getJSON("/avg-temp", function(avgTemp) {
        avgTemperatureToday = avgTemp.average_temp;
        document.getElementById("avgTemp").innerHTML = `${avgTemperatureToday} °F`
    });
}

function getAverageIssMph() {
    $.getJSON("/avg-speed", function(avgSpeed) {
        avgIssSpeed = avgSpeed.average_speed;
        document.getElementById("avgSpeed").innerHTML = `${avgIssSpeed.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} MPH`
    });
}

function getUniqueCountryNameCounts() {
    $.getJSON("/country-count", function(uniqueCountryNameCounts) {
        var margin = {
            top: 0,
            right: 50,
            bottom: 0,
            left: 250
        };

        var width = 960 - margin.left - margin.right;
        var height = 2600 - margin.top - margin.bottom;

        let table = document.querySelector("table#country-counts-table");
        let svgDiv = document.querySelector("#country-counts-div");
        let data = ["Country", "Count"];

        // Remove existing data
        while (table.hasChildNodes()) {
            table.removeChild(table.firstChild);
        }
        while (svgDiv.hasChildNodes()) {
            svgDiv.removeChild(svgDiv.firstChild);
        }

        generateTableHead(table, data);
        generateTable(table, uniqueCountryNameCounts);

        var svg = d3.select("#country-counts-div").append("svg")
            .attr("class", "country-svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var x = d3.scale.linear()
            .range([0, width])
            .domain([0, d3.max(uniqueCountryNameCounts, function (d) {
                return d.country_name_count;
            })]);

        var y = d3.scale.ordinal()
            .rangeRoundBands([height, 0], .1)
            .domain(uniqueCountryNameCounts.map(function (d) {
                return d.country_name;
            }));

        var yAxis = d3.svg.axis()
            .scale(y)
            .tickSize(0) //no tick marks
            .orient("left");

        // Appends y-axis names
        var gy = svg.append("g")
            .attr("class", "y axis")
            .call(yAxis)

        var bars = svg.selectAll(".bar")
            .data(uniqueCountryNameCounts)
            .enter()
            .append("g")

        bars.append("rect")
            .attr("class", "bar")
            .attr("y", function (d) {
                return y(d.country_name);
            })
            .attr("height", y.rangeBand())
            .attr("x", 0)
            .attr("width", function (d) {
                return x(d.country_name_count);
            });

        //add a value label to the right of each bar
        bars.append("text")
            .attr("class", "label")
            //y position of the label is halfway down the bar
            .attr("y", function (d) {
                return y(d.country_name) + y.rangeBand() / 2 + 4;
            })
            //x position is 3 pixels to the right of the bar
            .attr("x", function (d) {
                return x(d.country_name_count) + 3;
            })
            .text(function (d) {
                return d.country_name_count;
            });
        
        return uniqueCountryNameCounts;
    });
}

function getUniqueWeatherCounts() {
    $.getJSON("/weather-count", function(uniqueWeatherCounts) {
        let table = document.querySelector("table#weather-counts-table");
        let svgDiv = document.querySelector("#weather-counts-div");
        let data = ["Weather Type", "Count"];

        // Remove existing data
        while (table.hasChildNodes()) {
            table.removeChild(table.firstChild);
        }
        while (svgDiv.hasChildNodes()) {
            svgDiv.removeChild(svgDiv.firstChild);
        }

        generateTableHead(table, data);
        generateTable(table, uniqueWeatherCounts);

        var margin = {
            top: 15,
            right: 50,
            bottom: 15,
            left: 250
        };

        var width = 960 - margin.left - margin.right;
        var height = 400 - margin.top - margin.bottom;

        var svg = d3.select("#weather-counts-div").append("svg")
            .attr("class", "weather-svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var x = d3.scale.linear()
            .range([0, width])
            .domain([0, d3.max(uniqueWeatherCounts, function (d) {
                return d.weather_description_count;
            })]);

        var y = d3.scale.ordinal()
            .rangeRoundBands([height, 0], .1)
            .domain(uniqueWeatherCounts.map(function (d) {
                return d.weather_description;
            }));

        var yAxis = d3.svg.axis()
            .scale(y)
            .tickSize(0) //no tick marks
            .orient("left");

        // Appends y-axis names
        var gy = svg.append("g")
            .attr("class", "y axis")
            .call(yAxis)

        var bars = svg.selectAll(".bar")
            .data(uniqueWeatherCounts)
            .enter()
            .append("g")

        bars.append("rect")
            .attr("class", "bar")
            .attr("y", function (d) {
                return y(d.weather_description);
            })
            .attr("height", y.rangeBand())
            .attr("x", 0)
            .attr("width", function (d) {
                return x(d.weather_description_count);
            });

        //add a value label to the right of each bar
        bars.append("text")
            .attr("class", "label")
            //y position of the label is halfway down the bar
            .attr("y", function (d) {
                return y(d.weather_description) + y.rangeBand() / 2 + 4;
            })
            //x position is 3 pixels to the right of the bar
            .attr("x", function (d) {
                return x(d.weather_description_count) + 3;
            })
            .text(function (d) {
                return d.weather_description_count;
            });
        
        uniqueWeatherCountsToday = uniqueWeatherCounts;
    });
}

function getNumAverageTemperature(numRows) {
    $.getJSON(`/num-avg-temp?numRows=${numRows}`, function(avgTemp) {
        console.log(avgTemp);
    });
}

function getNumAverageIssMph(numRows) {
    $.getJSON(`/num-avg-speed?numRows=${numRows}`, function(avgSpeed) {
        console.log(avgSpeed);
    });
}

function getNumUniqueCountryNameCounts(numRows) {
    $.getJSON(`/num-country-count?numRows=${numRows}`, function(uniqueCountryNameCounts) {
        console.log(uniqueCountryNameCounts);
    });
}

function getNumUniqueWeatherCounts(numRows) {
    $.getJSON(`/num-weather-count?numRows=${numRows}`, function(uniqueWeatherCounts) {
        console.log(uniqueWeatherCounts);
    });
}
// *** END GET DATA FUNCTIONS ***

// *** SETUP INITIAL STATE & INTERVAL TO UPDATE ***
getMarkersDrawLines();
getAverageTemperature();
getAverageIssMph();
getUniqueWeatherCounts();
getUniqueCountryNameCounts();

setInterval(function() {
    getLatestMarker();
    getAverageTemperature();
    getAverageIssMph();
    getUniqueWeatherCounts();
    getUniqueCountryNameCounts();
}, 60000);
// *** END SETUP INITIAL STATE & INTERVAL TO UPDATE ***

// TASKS:
// make popup error msg for selecting out of bounds number of initial data points
// create json file with sample data to be used when database connection fails
// upgrade to latest d3 version
// Android polylines bug
