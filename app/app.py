import os
from flask import Flask, jsonify, render_template, redirect, make_response, json, request
from flask_sqlalchemy import SQLAlchemy
from config import uri
from data import getData

app = Flask(__name__)
app.config['DEBUG'] = True

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/data')
def listData():
    dataList = getData()
    return render_template('data.html', data = dataList)

if __name__ == '__main__':
    app.run(debug=True)
