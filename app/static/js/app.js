var initialZoom = 5
var initialLat = 50.0
var initialLon = 0.0
var mymap = L.map('mapid').setView([initialLat, initialLon], initialZoom);

//Styles: satellite-streets-v11, dark-v10, light-v10
L.tileLayer(`https://api.mapbox.com/styles/v1/mapbox/light-v10/tiles/{z}/{x}/{y}?access_token=${mapbox_api_key}`, {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox/streets-v11',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'your.mapbox.access.token'
}).addTo(mymap);

var popup = L.popup();
function onMapClick(e) {
    popup.setLatLng(e.latlng)
        .setContent("You clicked the map at: " + e.latlng.toString())
        .openOn(mymap);
}

mymap.on('click', onMapClick);

var latlngs = [
    [45.51, -122.68],
    [37.77, -122.43],
    [34.04, -118.2]
];

var polyline = L.polyline(latlngs, {color: 'red'}).addTo(mymap);

$.getJSON("/data", function(data) {
    console.log(data);
    data.forEach(row => {
        var marker = L.marker([row.iss_lat, row.iss_lon]).addTo(mymap);
        marker.bindPopup(`<b>Latitude, Longitude</b><br><b>(${row.iss_lat}, ${row.iss_lon})</b><br>Country: ${row.country_name}<br>Capital: ${row.country_capital}<br>`).openPopup();
    });
});
