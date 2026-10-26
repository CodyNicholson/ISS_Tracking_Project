import os
from flask import Flask, jsonify, render_template, request

from data import getData, getWeatherDescriptionCounts, getNumWeatherDescriptionCounts, getAvgTemperature, getNumAvgTemperature, getCountryNameCounts, getNumCountryNameCounts, getAvgSpeed, getNumAvgSpeed

##### SETUP #####
# Mapbox public token for the map tiles; the map falls back to OpenStreetMap/CARTO tiles when it's empty
mapboxKey = os.environ.get('MAPBOX_API_KEY', '')
MAX_ROWS = 10000

app = Flask(__name__)

# Scripts come only from this origin, unpkg (Leaflet) and jsDelivr (d3), all pinned with Subresource Integrity;
# map tiles and country flags are images from several https hosts. No inline scripts and no framing.
CONTENT_SECURITY_POLICY = "; ".join([
    "default-src 'self'",
    "script-src 'self' https://unpkg.com https://cdn.jsdelivr.net",
    "style-src 'self' https://unpkg.com",
    "img-src 'self' data: https:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
])

@app.after_request
def securityHeaders(response):
    response.headers['Content-Security-Policy'] = CONTENT_SECURITY_POLICY
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    response.headers['Permissions-Policy'] = 'camera=(), microphone=(), geolocation=()'
    return response

def getNumRows():
    """Returns the numRows query parameter as an int, or None if it's missing or out of range."""
    try:
        numRows = int(request.args.get('numRows'))
    except (TypeError, ValueError):
        return None
    return numRows if 0 <= numRows <= MAX_ROWS else None

def numRowsError(routeName):
    return jsonify(f"{routeName} Error: numRows query parameter must be an integer from 0 to {MAX_ROWS}"), 400

##### PAGES #####
@app.route('/')
def homePageRoute():
    return render_template('index.html', mapboxKey = mapboxKey)

@app.route('/data-table')
def dataTablePageRoute():
    return render_template('data.html', data = getData(100))

##### ENDPOINTS #####
@app.route('/health')
def healthRoute():
    return jsonify("ok"), 200

@app.route('/data')
def getNumDataRoute():
    numRows = getNumRows()
    if numRows is None:
        return numRowsError("getDataRoute")
    return jsonify(getData(numRows)), 200

@app.route('/weather-count')
def getWeatherDescriptionCountsRoute():
    return jsonify(getWeatherDescriptionCounts()), 200

@app.route('/num-weather-count')
def getNumWeatherDescriptionCountsRoute():
    numRows = getNumRows()
    if numRows is None:
        return numRowsError("getNumWeatherDescriptionCountsRoute")
    return jsonify(getNumWeatherDescriptionCounts(numRows)), 200

@app.route('/avg-temp')
def getAvgTemperatureRoute():
    return jsonify(getAvgTemperature()), 200

@app.route('/num-avg-temp')
def getNumAvgTemperatureRoute():
    numRows = getNumRows()
    if numRows is None:
        return numRowsError("getNumAvgTemperatureRoute")
    return jsonify(getNumAvgTemperature(numRows)), 200

@app.route('/country-count')
def getCountryNameCountsRoute():
    return jsonify(getCountryNameCounts()), 200

@app.route('/num-country-count')
def getNumCountOfCountryNamesRoute():
    numRows = getNumRows()
    if numRows is None:
        return numRowsError("getNumCountOfCountryNamesRoute")
    return jsonify(getNumCountryNameCounts(numRows)), 200

@app.route('/avg-speed')
def getAverageSpeedRoute():
    return jsonify(getAvgSpeed()), 200

@app.route('/num-avg-speed')
def getNumAverageSpeedRoute():
    numRows = getNumRows()
    if numRows is None:
        return numRowsError("getNumAverageSpeedRoute")
    return jsonify(getNumAvgSpeed(numRows)), 200

##### MAIN #####
if __name__ == '__main__':
    # Local runs only; the container serves the app with gunicorn. Never enable the debugger publicly.
    app.run(debug=os.environ.get('FLASK_DEBUG') == '1')
