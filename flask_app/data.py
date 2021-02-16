import os
from sqlalchemy.orm import Session
from sqlalchemy import Column, String, MetaData, create_engine
from sqlalchemy.ext.declarative import declarative_base

################# QUERIES ###################
getNumDataQuery = "SELECT * FROM (SELECT * FROM public.iss_data_table ORDER BY iss_timestamp DESC LIMIT {numRows}) AS x ORDER BY iss_timestamp ASC;"
getWeatherDescriptionCountsQuery = "SELECT weather_description, COUNT(weather_description) AS weather_description_count FROM public.iss_data_table GROUP BY weather_description ORDER BY weather_description_count ASC;"
getAvgTemperatureQuery = "SELECT ROUND(AVG(CAST(weather_temp as decimal)), 4) AS average_temp FROM public.iss_data_table;"
getCountryNameCountsQuery = "SELECT country_name, COUNT(country_name) AS country_name_count FROM public.iss_data_table WHERE country_name <> '' GROUP BY country_name ORDER BY country_name_count ASC;"
getAvgSpeedQuery = "SELECT ROUND(AVG(CAST(iss_mph as decimal)), 2) AS average_speed FROM public.iss_data_table;"
getNumWeatherDescriptionCountsQuery = "WITH temp_tbl AS (SELECT weather_description FROM public.iss_data_table ORDER BY iss_timestamp DESC LIMIT {numRows}) SELECT weather_description, COUNT(weather_description) AS weather_description_count FROM temp_tbl GROUP BY weather_description ORDER BY weather_description_count DESC;"
getNumAvgTemperatureQuery = "WITH temp_tbl AS (SELECT CAST(weather_temp as decimal) FROM public.iss_data_table ORDER BY iss_timestamp DESC LIMIT {numRows}) SELECT AVG(weather_temp) FROM temp_tbl;"
getNumCountryNameCountsQuery = "WITH temp_tbl AS (SELECT country_name FROM public.iss_data_table ORDER BY iss_timestamp DESC LIMIT {numRows}) SELECT country_name, COUNT(country_name) AS country_name_count FROM temp_tbl WHERE country_name <> '' GROUP BY country_name ORDER BY country_name_count DESC;"
getNumAvgSpeedQuery = "WITH temp_tbl AS (SELECT CAST(iss_mph as decimal) FROM public.iss_data_table ORDER BY iss_timestamp DESC LIMIT {numRows}) SELECT AVG(iss_mph) FROM temp_tbl;"
#############################################

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
    iss_mph = Column(String(50))

try:
    engine = create_engine(os.environ['DATABASE_URL'])
    print("***Connected And Running On Heroku***")
except:
    print("***Running Locally***")
    from config import getDbUriFromHeroku, uri
    try:
        heroku_uri = getDbUriFromHeroku()
        engine = create_engine(heroku_uri)
        print("***Connected And Running Locally***")
    except Exception as e:
        print(e)
        engine = create_engine(uri)
        print("***Connected And Running Locally After getDbUriFromHeroku() Failed***")

connection = engine.connect()
metadata = MetaData()
Base.metadata.create_all(connection)
session = Session(bind=engine)

def getData(numRows):
    resultProxy = connection.execute(getNumDataQuery.format(numRows=numRows))
    rowDict, dataList = {}, []
    for rowProxy in resultProxy:
        for column, value in rowProxy.items():
            rowDict = {**rowDict, **{column: value}}
        dataList.append(rowDict)
    return dataList

def getWeatherDescriptionCounts():
    resultProxy = connection.execute(getWeatherDescriptionCountsQuery)
    rowDict, dataList = {}, []
    for rowProxy in resultProxy:
        for column, value in rowProxy.items():
            rowDict = {**rowDict, **{column: value}}
        dataList.append(rowDict)
    return dataList

def getNumWeatherDescriptionCounts(numRows):
    resultProxy = connection.execute(getNumWeatherDescriptionCountsQuery.format(numRows=numRows))
    rowDict, dataList = {}, []
    for rowProxy in resultProxy:
        for column, value in rowProxy.items():
            rowDict = {**rowDict, **{column: value}}
        dataList.append(rowDict)
    return dataList

def getAvgTemperature():
    resultProxy = connection.execute(getAvgTemperatureQuery)
    rowDict = {}
    for rowProxy in resultProxy:
        for column, value in rowProxy.items():
            rowDict = {**rowDict, **{column: str(value)}}
    return rowDict

def getNumAvgTemperature(numRows):
    resultProxy = connection.execute(getNumAvgTemperatureQuery.format(numRows=numRows))
    rowDict = {}
    for rowProxy in resultProxy:
        for column, value in rowProxy.items():
            rowDict = {**rowDict, **{column: str(value)}}
    return rowDict

def getCountryNameCounts():
    resultProxy = connection.execute(getCountryNameCountsQuery)
    rowDict, dataList = {}, []
    for rowProxy in resultProxy:
        for column, value in rowProxy.items():
            rowDict = {**rowDict, **{column: value}}
        dataList.append(rowDict)
    return dataList

def getNumCountryNameCounts(numRows):
    resultProxy = connection.execute(getNumCountryNameCountsQuery.format(numRows=numRows))
    rowDict, dataList = {}, []
    for rowProxy in resultProxy:
        for column, value in rowProxy.items():
            rowDict = {**rowDict, **{column: value}}
        dataList.append(rowDict)
    return dataList

def getAvgSpeed():
    resultProxy = connection.execute(getAvgSpeedQuery)
    rowDict = {}
    for rowProxy in resultProxy:
        for column, value in rowProxy.items():
            rowDict = {**rowDict, **{column: str(value)}}
    return rowDict

def getNumAvgSpeed(numRows):
    resultProxy = connection.execute(getNumAvgSpeedQuery.format(numRows=numRows))
    rowDict = {}
    for rowProxy in resultProxy:
        for column, value in rowProxy.items():
            rowDict = {**rowDict, **{column: str(value)}}
    return rowDict
