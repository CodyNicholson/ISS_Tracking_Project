import os
from flask import Flask, jsonify, render_template, json, request
from flask_api import status

##### SETUP #####
try:
    # Works on Heroku
    from .data import getData, getWeatherDescriptionCounts, getNumWeatherDescriptionCounts, getAvgTemperature, getNumAvgTemperature, getCountryNameCounts, getNumCountryNameCounts, getAvgSpeed, getNumAvgSpeed
    mbk = os.environ['MBK']
    mbk += "x4"
except Exception as e:
    # Works locally
    print(type(e))
    print(e.args)
    print(e)
    from data import getData, getWeatherDescriptionCounts, getNumWeatherDescriptionCounts, getAvgTemperature, getNumAvgTemperature, getCountryNameCounts, getNumCountryNameCounts, getAvgSpeed, getNumAvgSpeed
    from config import mbk
    mbk += "x4"

app = Flask(__name__)
app.config['DEBUG'] = True
dataList = getData(100)

##### PAGES #####
@app.route('/')
def homePageRoute():
    return render_template('index.html', data = json.dumps(dataList), mbkpy = mbk)

@app.route('/data-table')
def dataTablePageRoute():
    return render_template('data.html', data = dataList)

##### ENDPOINTS #####
@app.route('/data')
def getNumDataRoute():
    try:
        numRows = int(request.args.get('numRows'))
    except:
        return jsonify("getDataRoute Error: numRows query parameter must be a valid integer")
    dataList = getData(numRows)
    return jsonify(dataList), status.HTTP_200_OK

@app.route('/weather-count')
def getWeatherDescriptionCountsRoute():
    countsOfWeatherDescriptions = getWeatherDescriptionCounts()
    return jsonify(countsOfWeatherDescriptions), status.HTTP_200_OK

@app.route('/num-weather-count')
def getNumWeatherDescriptionCountsRoute():
    try:
        numRows = int(request.args.get('numRows'))
    except:
        return jsonify("getNumWeatherDescriptionCountsRoute Error: numRows query parameter must be a valid integer"), status.HTTP_500_INTERNAL_SERVER_ERROR
    countsOfWeatherDescriptions = getNumWeatherDescriptionCounts(numRows)
    return jsonify(countsOfWeatherDescriptions), status.HTTP_200_OK

@app.route('/avg-temp')
def getAvgTemperatureRoute():
    getAvgTempDictionary = getAvgTemperature()
    return jsonify(getAvgTempDictionary), status.HTTP_200_OK

@app.route('/num-avg-temp')
def getNumAvgTemperatureRoute():
    try:
        numRows = int(request.args.get('numRows'))
    except:
        return jsonify("getAvgTemperatureRoute Error: numRows query parameter must be a valid integer"), status.HTTP_500_INTERNAL_SERVER_ERROR
    getAvgTempDictionary = getNumAvgTemperature(numRows)
    return jsonify(getAvgTempDictionary), status.HTTP_200_OK

@app.route('/country-count')
def getCountryNameCountsRoute():
    countsOfCountryNames = getCountryNameCounts()
    return jsonify(countsOfCountryNames), status.HTTP_200_OK

@app.route('/num-country-count')
def getNumCountOfCountryNamesRoute():
    try:
        numRows = int(request.args.get('numRows'))
    except:
        return jsonify("getNumCountOfCountryNamesRoute Error: numRows query parameter must be a valid integer"), status.HTTP_500_INTERNAL_SERVER_ERROR
    countsOfCountryNames = getNumCountryNameCounts(numRows)
    return jsonify(countsOfCountryNames), status.HTTP_200_OK

@app.route('/avg-speed')
def getAverageSpeedRoute():
    avgSpeed = getAvgSpeed()
    return jsonify(avgSpeed), status.HTTP_200_OK

@app.route('/num-avg-speed')
def getNumAverageSpeedRoute():
    try:
        numRows = int(request.args.get('numRows'))
    except:
        return jsonify("getNumAverageSpeedRoute Error: numRows query parameter must be a valid integer"), status.HTTP_500_INTERNAL_SERVER_ERROR
    avgSpeed = getNumAvgSpeed(numRows)
    return jsonify(avgSpeed), status.HTTP_200_OK

##### MAIN #####
if __name__ == '__main__':
    app.run(debug=True)
