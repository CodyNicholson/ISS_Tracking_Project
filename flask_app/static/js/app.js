const initialZoom = 2;
const initialLat = 0.0;
const initialLon = 0.0;
const maxZoom = 9;
const minZoom = 2;

var mymap = L.map('mapid', {
    'worldCopyJump': true, 
    'zoom': initialZoom,
    'maxZoom': maxZoom,
    'minZoom': minZoom,
    'center': [initialLat, initialLon]});

var style_choice_int = 0;
var previousStyle = L.tileLayer(`https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v11/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiY29keW5pY2hvbHNvbiIsImEiOiJjazd2NTF2MmswYm53M2Rtc2s4OXNmamp5In0.xWMG7bI5uAGYvUv2Y2nyAw`, {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    tileSize: 512,
    zoomOffset: -1,
}).addTo(mymap);
function setStyle() {
    const styles = ["satellite-streets-v11", "light-v10", "dark-v10"];    
    var newStyle = L.tileLayer(`https://api.mapbox.com/styles/v1/mapbox/${styles[style_choice_int]}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiY29keW5pY2hvbHNvbiIsImEiOiJjazd2NTF2MmswYm53M2Rtc2s4OXNmamp5In0.xWMG7bI5uAGYvUv2Y2nyAw`, {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        tileSize: 512,
        zoomOffset: -1,
    }).addTo(mymap);

    // Wait for animation of layer change to complete before removing previoud layer
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

var markers = [];
var viewMarkers = true;
function getMarkersAndDrawLines() {
    $.getJSON("/data", function(data) {
        data.forEach(row => {
            var marker = L.marker([row.iss_lat, row.iss_lon]).addTo(mymap);
            if (row.country_name == "") {
                marker.bindPopup(`<b>Lat, Lon:</b> (${row.iss_lat}, ${row.iss_lon})<br>${timeConverter(row.iss_timestamp)}<br><b>Temp:</b> ${row.weather_temp} °F<br><b>Weather:</b> ${row.weather_description}<br><b>Num Fact:</b> ${row.num_description}`).openPopup();
            } else {
                var borderingCountries = row.country_borders.substring(1, row.country_borders.length-1).split(",").join(", ");
                marker.bindPopup(`<img src="${row.country_flag_url}" alt="Country Flag" width="200"/><br><b>Lat, Lon:</b> (${row.iss_lat}, ${row.iss_lon})<br>${timeConverter(row.iss_timestamp)}<br><b>Temp:</b> ${row.weather_temp} °F<br><b>Weather:</b> ${row.weather_description}<br><b>Country:</b> ${row.country_name} (${row.country_alpha_code})<br><b>Capital:</b> ${row.country_capital}<br><b>Borders:</b> ${borderingCountries}<br><b>Random Number Fact:</b> ${row.num_description}`).openPopup();
            }
            markers.push(marker);
        });
    
        // Draw line before crossing lon 180 and then new line after crossing lon 180
        var latlngsBefore180 = [];
        var latlngsAfter180 = [];
        var lineSwitch = false;
        var previous_lon = data[0].iss_lon;
        for (let i = 0; i < data.length; i++) {
            var difference = previous_lon - data[i].iss_lon;
            if (difference < 300 && !lineSwitch) {
                latlngsBefore180.push([data[i].iss_lat, data[i].iss_lon])
                previous_lon = data[i].iss_lon;
            } else {
                lineSwitch = true;
                latlngsAfter180.push([data[i].iss_lat, data[i].iss_lon])
            }
        }
    
        var polylineBefore180 = L.polyline(latlngsBefore180, {color: 'red'}).addTo(mymap);
        var polylineAfter180 = L.polyline(latlngsAfter180, {color: 'red'}).addTo(mymap);
    });
}

function removeMarkers() {
    viewMarkers = false;
    for(var i = 0; i < markers.length; i++){
        mymap.removeLayer(markers[i]);
    }
}

function addMarkers() {
    viewMarkers = true;
    for(var i = 0; i < markers.length; i++){
        markers[i].addTo(mymap);
    }
}

function toggleMarkers() {
    if (viewMarkers) {
        removeMarkers();
        
    } else {
        addMarkers();
    }
}

getMarkersAndDrawLines();

// TASKS:
// Mark starting and ending point as data points
// style webpage and make it mobile friendly
// select how many datapoints you would like to view up to 500
// calculate and graph speed of ISS
// fix onClick display popup with latLong
// create json file with sample data to be used when database connection fails
// get initial view to center on latest point
// Map country alpha code to country name in bordering countries
// Hide sensitive data
// Add data table view
// Add data python module
// Add custom markers

var popup = L.popup();
function onMapClick(e) {
    popup.setLatLng(e.latlng)
        .setContent("You clicked the map at:<br>" + e.latlng.toString())
        .openOn(mymap);
}