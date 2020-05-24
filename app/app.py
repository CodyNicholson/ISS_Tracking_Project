import os
from flask import Flask, jsonify, render_template, redirect, make_response, json, request
from flask_sqlalchemy import SQLAlchemy
from data import getData

app = Flask(__name__)
app.config['DEBUG'] = True

@app.route('/')
def home():
    dataList = getData()
    return render_template('index.html', data = json.dumps(dataList))

@app.route('/data-table')
def listData():
    dataList = getData()
    if request.args['type'] == 'json':
        return jsonify(data = dataList)
    else:
        return render_template('data.html', data = dataList)

@app.route('/data')
def getDataRoute():
    dataList = getData()
    return jsonify(dataList)

if __name__ == '__main__':
    app.run(debug=True)
