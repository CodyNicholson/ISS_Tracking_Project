var initialZoom = 5
var initialLat = 50.0
var initialLon = 0.0
var mymap = L.map('mapid', {'worldCopyJump': true}).setView([initialLat, initialLon], initialZoom);

//Styles: satellite-streets-v11, dark-v10, light-v10
L.tileLayer(`https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v11/tiles/{z}/{x}/{y}?access_token=${mapbox_api_key}`, {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 20,
    id: 'mapbox/streets-v11',
    tileSize: 512,
    zoomOffset: -1,
}).addTo(mymap);

var popup = L.popup();
function onMapClick(e) {
    popup.setLatLng(e.latlng)
        .setContent("You clicked the map at:<br>" + e.latlng.toString())
        .openOn(mymap);
}

$.getJSON("/data", function(data) {
    data.forEach(row => {
        var marker = L.marker([row.iss_lat, row.iss_lon]).addTo(mymap);
        if (row.country_name == "") {
            marker.bindPopup(`<b>Lat, Lon:</b> (${row.iss_lat}, ${row.iss_lon})<br>${timeConverter(row.iss_timestamp)}<br><b>Temp:</b> ${row.weather_temp} °F<br><b>Weather:</b> ${row.weather_description}<br><b>Num Fact:</b> ${row.num_description}`).openPopup();
        } else {
            marker.bindPopup(`<img src="${row.country_flag_url}" alt="Country Flag" width="200"/><br><b>Lat, Lon:</b> (${row.iss_lat}, ${row.iss_lon})<br>${timeConverter(row.iss_timestamp)}<br><b>Temp:</b> ${row.weather_temp} °F<br><b>Weather:</b> ${row.weather_description}<br><b>Country:</b> ${row.country_name} (${row.country_alpha_code})<br><b>Capital:</b> ${row.country_capital}<br><b>Borders:</b> ${row.country_borders}<br><b>Num Fact:</b> ${row.num_description}`).openPopup();
        }
    });

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

// Mark starting and ending point for data points
// toggle style for map
// style webpage and make it mobile friendly
// deploy to heroku as a dyno
// select how many datapoints you would like to view up until 500
// calculate and graph speed of ISS 
