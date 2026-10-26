import os
import json
import logging
import requests
import geopy.distance
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert

from db import engine, iss_data_table
from util import getCountryData

log = logging.getLogger(__name__)

ISS_URL = "http://api.open-notify.org/iss-now.json"
WEATHER_URL = "https://api.openweathermap.org/data/2.5/weather"
REQUEST_TIMEOUT_SECONDS = 10

def getIssPosition():
    iss_data = requests.get(ISS_URL, timeout=REQUEST_TIMEOUT_SECONDS).json()
    log.debug(json.dumps(iss_data, indent=4, sort_keys=True))
    return iss_data["iss_position"]["latitude"], iss_data["iss_position"]["longitude"], iss_data["timestamp"]

def getWeather(iss_lat, iss_lon):
    """Returns (description, temperature in F, ISO alpha-2 country code); empty strings when unavailable."""
    weather_api_key = os.environ.get("OPENWEATHER_API_KEY", "")
    if not weather_api_key:
        log.warning("OPENWEATHER_API_KEY is not set, skipping weather and country data")
        return "", "", ""
    params = {"lat": iss_lat, "lon": iss_lon, "appid": weather_api_key, "units": "imperial"}
    try:
        response = requests.get(WEATHER_URL, params=params, timeout=REQUEST_TIMEOUT_SECONDS)
        response.raise_for_status()
        weather_data = response.json()
    except Exception as e:
        # The exception text can include the request URL, which contains the API key
        log.warning("Weather request failed: %s", type(e).__name__)
        return "", "", ""
    log.debug(json.dumps(weather_data, indent=4, sort_keys=True))
    weather_description = weather_data["weather"][0]["description"]
    weather_temp = str(weather_data["main"]["temp"])
    country_alpha_code = weather_data.get("sys", {}).get("country", "") or ""
    return weather_description, weather_temp, country_alpha_code

def getIssMph(connection, iss_lat, iss_lon, iss_timestamp):
    """Speed between the latest stored point and this one, or '' when there's no earlier point."""
    latestDatapoint = connection.execute(
        select(iss_data_table).order_by(iss_data_table.c.iss_timestamp.desc()).limit(1)
    ).first()
    if latestDatapoint is None:
        return ""
    minutesBetween = (iss_timestamp - int(latestDatapoint.iss_timestamp)) / 60
    if minutesBetween <= 0:
        return ""
    coords_1 = (latestDatapoint.iss_lat, latestDatapoint.iss_lon)
    coords_2 = (iss_lat, iss_lon)
    distanceBetween = geopy.distance.geodesic(coords_1, coords_2).miles
    return str((distanceBetween / minutesBetween) * 60)

def collect():
    try:
        iss_lat, iss_lon, iss_timestamp = getIssPosition()
    except requests.RequestException as e:
        # open-notify.org often times out; the next scheduled run tries again
        log.warning("ISS position unavailable, skipping this run: %s", type(e).__name__)
        return
    weather_description, weather_temp, country_alpha_code = getWeather(iss_lat, iss_lon)
    country_name, country_borders, country_flag_url, country_capital = getCountryData(country_alpha_code) if country_alpha_code else ("", "", "", "")

    with engine.begin() as connection:
        iss_mph = getIssMph(connection, iss_lat, iss_lon, iss_timestamp)
        # Trim to the column sizes so an unusually long value can't fail the insert
        # The ISS API can return the same timestamp twice (e.g. a manual run during a scheduled one)
        result = connection.execute(insert(iss_data_table).on_conflict_do_nothing().values(
            iss_timestamp=str(iss_timestamp), iss_lat=iss_lat, iss_lon=iss_lon,
            weather_description=weather_description[:255], weather_temp=weather_temp[:10],
            country_alpha_code=country_alpha_code[:10],
            country_name=country_name[:50], country_borders=country_borders[:255],
            country_flag_url=country_flag_url[:255], country_capital=country_capital[:50],
            iss_mph=iss_mph[:50]))
    if result.rowcount == 0:
        log.info("Skipped ISS position at %s, already saved", iss_timestamp)
        return
    log.info("Saved ISS position %s, %s at %s (%s, %s)", iss_lat, iss_lon, iss_timestamp,
             country_name or "no country", weather_description or "no weather")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
    collect()
