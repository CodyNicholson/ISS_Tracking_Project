import os
from flask import Flask, jsonify, render_template, json

try:
    # Works on Heroku
    from .data import getData
    mbk = os.environ['MBK']
    mbk += "x4"
except Exception as e:
    # Works locally
    print(type(e))
    print(e.args)
    print(e)
    from data import getData
    from config import mbk
    mbk += "x4"

app = Flask(__name__)
app.config['DEBUG'] = True
dataList = getData()

@app.route('/')
def home():
    return render_template('index.html', data = json.dumps(dataList), mbkpy = mbk)

@app.route('/data-table')
def listData():
    return render_template('data.html', data = dataList)

@app.route('/data')
def getDataRoute():
    dataList = getData()
    return jsonify(dataList)

if __name__ == '__main__':
    app.run(debug=True)
