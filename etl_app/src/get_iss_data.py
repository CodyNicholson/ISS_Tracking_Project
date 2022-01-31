import requests
import json
import random
import datetime
import glob
from sqlalchemy import Column, String, MetaData, create_engine, Table, insert
import geopy.distance

from config import uri, weather_api_key, getDbUriFromHeroku
from util import processBorderingCountries, processCountryName

try:
    heroku_uri = getDbUriFromHeroku()
    engine = create_engine(heroku_uri)
    connection = engine.connect()
    print("***Connected To Heroku Using getDbUriFromHeroku***")
except Exception as e:
    print(e)
    engine = create_engine(uri)
    connection = engine.connect()
    print("***Connected To Heroku Using Stored URI***")

# Logging
'''
files = [f for f in glob.glob("/home/pi/ISS_Tracking_Project/etl_app/logs/*.txt", recursive=True)]
log_count = str(len(files)+1)
print(f"Log: {log_count}")
now = datetime.datetime.now()
timestamp = str(now.strftime("%Y-%m-%d-%H-%M-%S"))
print(f"timestamp is: {timestamp}")
'''

# Get ISS Position Data & Timestamp
iss_url = "http://api.open-notify.org/iss-now.json"
iss_data = requests.get(iss_url).json()
print(json.dumps(iss_data, indent=4, sort_keys=True))
iss_lat = iss_data["iss_position"]["latitude"]
iss_lon = iss_data["iss_position"]["longitude"]
iss_timestamp = iss_data["timestamp"]

# Get Random Number From Timestamp
rand_num = round(random.random(), 1)
splice_num = -1
if(rand_num < 0.4):
    splice_num = -2
elif(0.4 >= rand_num < 0.8):
    splice_num = -3
lookup_num = str(iss_timestamp)[-4:splice_num]
num_url = "http://numbersapi.com/" + lookup_num + "/math?json"
try:
    num_data = requests.get(num_url).json()
    print(json.dumps(num_data, indent=4, sort_keys=True))
    num_description = num_data["text"]
except:
    num_description = ""

# Weather Data
weather_url = "http://api.openweathermap.org/data/2.5/weather?lat=" + iss_lat + "&lon=" + iss_lon + "&appid=" + weather_api_key + "&units=imperial"
weather_data = requests.get(weather_url).json()
print(json.dumps(weather_data, indent=4, sort_keys=True))
weather_description = weather_data["weather"][0]["description"]
weather_temp = weather_data["main"]["temp"]
try:
    country_alpha_code = weather_data["sys"]["country"]
except:
    country_alpha_code = ""

# Country Data
if (country_alpha_code != ""):
    country_url = "https://restcountries.com/v2/alpha/" + country_alpha_code
    country_data = requests.get(country_url).json()
    country_name = processCountryName(country_data["name"])
    country_borders = processBorderingCountries(country_data["borders"])
    country_flag_url = country_data["flags"]["svg"]
    country_capital = country_data["capital"]
    print(json.dumps(country_data, indent=4, sort_keys=True))
    print(country_flag_url)
else:
    country_name = ""
    country_borders = ""
    country_flag_url = ""
    country_capital = ""

# Write To Postgres
metadata = MetaData()
iss_data_table = Table('iss_data_table', metadata,
              Column('iss_timestamp', String(50), primary_key=True),
              Column('iss_lat', String(20), nullable=False),
              Column('iss_lon', String(20), nullable=False),
              Column('num_description', String(255), nullable=True),
              Column('weather_description', String(255), nullable=True),
              Column('weather_temp', String(10), nullable=True),
              Column('country_alpha_code', String(10), nullable=True),
              Column('country_name', String(50), nullable=True),
              Column('country_borders', String(255), nullable=True),
              Column('country_flag_url', String(255), nullable=True),
              Column('country_capital', String(50), nullable=True),
              Column('iss_mph', String(50), nullable=True)
           )

# Calculate ISS Speed
get_query_str = "SELECT * FROM public.iss_data_table ORDER BY iss_timestamp DESC LIMIT 1;"
latestDatapoint = connection.execute(get_query_str).first()
minutesBetween = (iss_timestamp - int(latestDatapoint[0])) / 60
#print(minutesBetween)

coords_1 = (latestDatapoint[1], latestDatapoint[2])
coords_2 = (iss_lat, iss_lon)
distanceBetween = geopy.distance.geodesic(coords_1, coords_2).miles
print(distanceBetween)
iss_mph = (distanceBetween/minutesBetween) * 60
print(iss_mph)

metadata.create_all(engine)
insert_query = insert(iss_data_table).values(iss_timestamp=iss_timestamp, iss_lat=iss_lat, iss_lon=iss_lon, num_description=num_description, weather_description=weather_description, weather_temp=weather_temp, country_alpha_code=country_alpha_code, country_name=country_name, country_borders=country_borders, country_flag_url=country_flag_url, country_capital=country_capital, iss_mph=iss_mph)
ResultProxy = connection.execute(insert_query)
