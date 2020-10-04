import os
from flask import Flask, jsonify, render_template, json

##### SETUP #####
try:
    # Works on Heroku
    from .data import getData, getLatestDataPoint, getCountOfWeatherDescriptions, getAvgTemperature, getCountsOfCountryNames
    mbk = os.environ['MBK']
    mbk += "x4"
except Exception as e:
    # Works locally
    print(type(e))
    print(e.args)
    print(e)
    from data import getData, getLatestDataPoint, getCountsOfWeatherDescriptions, getAvgTemperature, getCountsOfCountryNames
    from config import mbk
    mbk += "x4"

app = Flask(__name__)
app.config['DEBUG'] = True
dataList = getData()

##### PAGES #####
@app.route('/')
def homePageRoute():
    return render_template('index.html', data = json.dumps(dataList), mbkpy = mbk)

@app.route('/data-table')
def dataTablePageRoute():
    return render_template('data.html', data = dataList)

##### ENDPOINTS #####
@app.route('/data')
def getDataRoute():
    dataList = getData()
    return jsonify(dataList)

@app.route('/latest')
def getLatestRoute():
    latestDataPointDict = getLatestDataPoint()
    return jsonify(latestDataPointDict)

@app.route('/weather-count')
def getCountOfWeatherDescriptionsRoute():
    countsOfWeatherDescriptions = getCountsOfWeatherDescriptions()
    return jsonify(countsOfWeatherDescriptions)

@app.route('/avg-temp')
def getAvgTemperatureRoute():
    getAvgTempDictionary = getAvgTemperature()
    return jsonify(getAvgTempDictionary)

@app.route('/country-count')
def getCountOfCountryNamesRoute():
    countsOfCountryNames = getCountsOfCountryNames()
    return jsonify(countsOfCountryNames)

##### MAIN #####
if __name__ == '__main__':
    app.run(debug=True)
