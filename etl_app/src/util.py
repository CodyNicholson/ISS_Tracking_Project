import json
import os
import logging
from datetime import datetime, timedelta, timezone
import requests
from sqlalchemy import delete, func, insert, select

from db import engine, country_data_table

log = logging.getLogger(__name__)

# REST Countries v5. The free plan allows 1,000 requests a month, so the whole list (3 pages) is
# cached in the country_data table and refreshed weekly instead of being called on every collect.
COUNTRIES_URL = "https://api.restcountries.com/countries/v5"
COUNTRIES_RESPONSE_FIELDS = "names.common,codes.alpha_2,codes.alpha_3,capitals.name,flag.url_svg,borders"
COUNTRIES_PAGE_SIZE = 100  # Free plan maximum
COUNTRIES_MAX_AGE = timedelta(days=int(os.environ.get("COUNTRIES_MAX_AGE_DAYS", "7")))

# Fallback when the API key is missing or the cache hasn't been filled yet: country data keyed by
# ISO alpha-2 code, trimmed from https://github.com/mledoze/countries (ODbL)
with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'countries.json'), encoding='utf-8') as file:
    alpha2CodeToCountryMap = json.load(file)

alpha3CodeToNameMap = {country['cca3']: country['name'] for country in alpha2CodeToCountryMap.values()}

def fetchCountries(apiKey):
    """Returns every country from the REST Countries API as rows for the country_data table."""
    countries, offset = [], 0
    while True:
        response = requests.get(COUNTRIES_URL, headers={"Authorization": f"Bearer {apiKey}"}, timeout=20, params={
            "limit": COUNTRIES_PAGE_SIZE, "offset": offset, "response_fields": COUNTRIES_RESPONSE_FIELDS})
        response.raise_for_status()
        data = response.json()["data"]
        for country in data["objects"]:
            codes = country.get("codes", {})
            # A few territories (e.g. Abkhazia) have no ISO codes, so OpenWeather can't return them
            if not codes.get("alpha_2") or not codes.get("alpha_3"):
                continue
            capitals = country.get("capitals") or []
            countries.append({
                "alpha_2": codes["alpha_2"].upper(),
                "alpha_3": codes["alpha_3"].upper(),
                "name": country["names"]["common"],
                "capital": capitals[0]["name"] if capitals else "",
                "borders": ",".join(country.get("borders") or []),
                "flag_url": country.get("flag", {}).get("url_svg", ""),
            })
        if not data["meta"].get("more"):
            return countries
        offset += COUNTRIES_PAGE_SIZE

def refreshCountriesIfStale():
    """Refills the country_data cache when it's empty or older than COUNTRIES_MAX_AGE_DAYS."""
    apiKey = os.environ.get("RESTCOUNTRIES_API_KEY", "")
    if not apiKey:
        log.warning("RESTCOUNTRIES_API_KEY is not set, using the bundled countries.json")
        return
    with engine.connect() as connection:
        lastUpdated = connection.execute(select(func.min(country_data_table.c.updated_at))).scalar()
    if lastUpdated is not None and datetime.now(timezone.utc) - lastUpdated < COUNTRIES_MAX_AGE:
        log.info("Country cache is fresh (updated %s)", lastUpdated.isoformat())
        return
    try:
        countries = fetchCountries(apiKey)
    except Exception as e:
        # Keep the existing cache; the error text never contains the key, which is sent in a header
        log.warning("REST Countries refresh failed, keeping the existing cache: %s", e)
        return
    now = datetime.now(timezone.utc)
    with engine.begin() as connection:
        connection.execute(delete(country_data_table))
        connection.execute(insert(country_data_table), [{**country, "updated_at": now} for country in countries])
    log.info("Cached %d countries from REST Countries", len(countries))

def processBorderingCountries(borderingCountryCodesList, codeToNameMap=alpha3CodeToNameMap):
    return ", ".join(codeToNameMap.get(countryCode, countryCode) for countryCode in borderingCountryCodesList)

def getCountryData(alpha2Code):
    """Returns (name, borders, flag URL, capital) for a country code, or empty strings if it's unknown."""
    alpha2Code = alpha2Code.upper()
    with engine.connect() as connection:
        country = connection.execute(
            select(country_data_table).where(country_data_table.c.alpha_2 == alpha2Code)
        ).first()
        if country is not None:
            borderCodes = [code for code in country.borders.split(",") if code]
            borderNames = dict(connection.execute(
                select(country_data_table.c.alpha_3, country_data_table.c.name)
                .where(country_data_table.c.alpha_3.in_(borderCodes))
            ).all()) if borderCodes else {}
            return country.name, processBorderingCountries(borderCodes, borderNames), country.flag_url, country.capital

    country = alpha2CodeToCountryMap.get(alpha2Code)
    if country is None:
        return "", "", "", ""
    flagUrl = f"https://flagcdn.com/{alpha2Code.lower()}.svg"
    return country['name'], processBorderingCountries(country['borders']), flagUrl, country['capital']
