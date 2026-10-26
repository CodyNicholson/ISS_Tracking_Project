import os
from sqlalchemy import create_engine, text

################# QUERIES ###################
# Missing values are stored as '', so NULLIF keeps them out of the casts and averages
getNumDataQuery = "SELECT * FROM (SELECT * FROM public.iss_data_table ORDER BY iss_timestamp DESC LIMIT :numRows) AS x ORDER BY iss_timestamp ASC;"
getWeatherDescriptionCountsQuery = "SELECT weather_description, COUNT(weather_description) AS weather_description_count FROM public.iss_data_table WHERE weather_description <> '' GROUP BY weather_description ORDER BY weather_description_count ASC;"
getAvgTemperatureQuery = "SELECT ROUND(AVG(CAST(NULLIF(weather_temp, '') AS decimal)), 4) AS average_temp FROM public.iss_data_table;"
getCountryNameCountsQuery = "SELECT country_name, COUNT(country_name) AS country_name_count FROM public.iss_data_table WHERE country_name <> '' GROUP BY country_name ORDER BY country_name_count ASC;"
getAvgSpeedQuery = "SELECT ROUND(AVG(CAST(NULLIF(iss_mph, '') AS decimal)), 2) AS average_speed FROM public.iss_data_table;"
getNumWeatherDescriptionCountsQuery = "WITH temp_tbl AS (SELECT weather_description FROM public.iss_data_table ORDER BY iss_timestamp DESC LIMIT :numRows) SELECT weather_description, COUNT(weather_description) AS weather_description_count FROM temp_tbl WHERE weather_description <> '' GROUP BY weather_description ORDER BY weather_description_count DESC;"
getNumAvgTemperatureQuery = "WITH temp_tbl AS (SELECT CAST(NULLIF(weather_temp, '') AS decimal) AS weather_temp FROM public.iss_data_table ORDER BY iss_timestamp DESC LIMIT :numRows) SELECT AVG(weather_temp) FROM temp_tbl;"
getNumCountryNameCountsQuery = "WITH temp_tbl AS (SELECT country_name FROM public.iss_data_table ORDER BY iss_timestamp DESC LIMIT :numRows) SELECT country_name, COUNT(country_name) AS country_name_count FROM temp_tbl WHERE country_name <> '' GROUP BY country_name ORDER BY country_name_count DESC;"
getNumAvgSpeedQuery = "WITH temp_tbl AS (SELECT CAST(NULLIF(iss_mph, '') AS decimal) AS iss_mph FROM public.iss_data_table ORDER BY iss_timestamp DESC LIMIT :numRows) SELECT AVG(iss_mph) FROM temp_tbl;"
#############################################

# pool_pre_ping replaces connections that Postgres dropped (e.g. after a database restart)
engine = create_engine(os.environ['DATABASE_URL'], pool_pre_ping=True)

def runQuery(query, **params):
    with engine.connect() as connection:
        return [dict(row._mapping) for row in connection.execute(text(query), params)]

def runSingleRowQuery(query, **params):
    rows = runQuery(query, **params)
    return {column: str(value) for column, value in rows[0].items()} if rows else {}

def getData(numRows):
    return runQuery(getNumDataQuery, numRows=numRows)

def getWeatherDescriptionCounts():
    return runQuery(getWeatherDescriptionCountsQuery)

def getNumWeatherDescriptionCounts(numRows):
    return runQuery(getNumWeatherDescriptionCountsQuery, numRows=numRows)

def getAvgTemperature():
    return runSingleRowQuery(getAvgTemperatureQuery)

def getNumAvgTemperature(numRows):
    return runSingleRowQuery(getNumAvgTemperatureQuery, numRows=numRows)

def getCountryNameCounts():
    return runQuery(getCountryNameCountsQuery)

def getNumCountryNameCounts(numRows):
    return runQuery(getNumCountryNameCountsQuery, numRows=numRows)

def getAvgSpeed():
    return runSingleRowQuery(getAvgSpeedQuery)

def getNumAvgSpeed(numRows):
    return runSingleRowQuery(getNumAvgSpeedQuery, numRows=numRows)
