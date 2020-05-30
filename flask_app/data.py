import os
from sqlalchemy.orm import Session
from sqlalchemy import Column, String, MetaData, create_engine
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

try:
    engine = create_engine(os.environ['DATABASE_URL'])
    print("***Connected And Running On Heroku***")
except Exception as e:
    print(e)
    print("***Running Locally***")
    from config import uri, getDbUriFromHeroku
    try:
        heroku_uri = getDbUriFromHeroku()
        engine = create_engine(heroku_uri)
        print("***Connected And Running Locally***")
    except Exception as e:
        print(e)
        engine = create_engine(heroku_uri)
        print("***Connected And Running Locally After getDbUriFromHeroku() Failed***")
    

connection = engine.connect()
metadata = MetaData()
Base.metadata.create_all(connection)
session = Session(bind=engine)

def getData():
    resultProxy = connection.execute('SELECT * FROM (SELECT * FROM public.iss_data_table ORDER BY iss_timestamp DESC LIMIT 100) AS x ORDER BY iss_timestamp ASC;')
    rowDict, dataList = {}, []
    for rowProxy in resultProxy:
        for column, value in rowProxy.items():
            rowDict = {**rowDict, **{column: value}}
        dataList.append(rowDict)
    return dataList
