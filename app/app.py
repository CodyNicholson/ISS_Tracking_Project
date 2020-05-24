import os
from flask import Flask, jsonify, render_template, redirect, make_response, json, request
from flask_sqlalchemy import SQLAlchemy

# import sqlalchemy.dialects.postgresql
# from sqlalchemy.ext.automap import automap_base
# from sqlalchemy.orm import Session
# from sqlalchemy import create_engine, inspect, func

from config import uri

app = Flask(__name__)
app.config['DEBUG'] = True

# #DATABASE SET UP
# app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
# # app.config['SQLALCHEMY_DATABASE_URI'] = uri
# db = SQLAlchemy(app)
# engine = db.engine

@app.route('/')
def home():
    return render_template('index.html')


from config import host, port, database, user, password
import datetime
from sqlalchemy.orm import Session
from sqlalchemy import *
from sqlalchemy.ext.declarative import declarative_base
Base = declarative_base()

class ISS_Data_Point(Base):
    __tablename__ = 'iss_data_table'
    iss_timestamp = Column(String(50), primary_key=True)
    iss_lat = Column(String(20))
    iss_lon = Column(String(20))
    num_description = Column(String(255))
    weather_description = Column(String(255))
    weather_temp = Column(String(10))
    country_alpha_code = Column(String(10))
    country_name = Column(String(50))
    country_borders = Column(String(255))
    country_flag_url = Column(String(255))
    country_capital = Column(String(50))

engine = create_engine(f"postgresql://{user}:{password}@{host}/{database}")
connection = engine.connect()
metadata = MetaData()
Base.metadata.create_all(connection)
session = Session(bind=engine)

@app.route('/data')
def db_query():
    one_day_of_data = connection.execute('SELECT * FROM public.iss_data_table ORDER BY iss_timestamp ASC FETCH FIRST 100 ROWS ONLY;')
    data = []
    for iss_data_point in one_day_of_data:
        data.append(iss_data_point)
        print(iss_data_point)

    return render_template('data.html', data = data)

if __name__ == '__main__':
    app.run(debug=True)
