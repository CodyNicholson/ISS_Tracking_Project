# International Space Station Tracking ETL Project

This directory holds the ETL app. It runs in the `iss-etl` container as a long-running Python scheduler (`src/scheduler.py`, using APScheduler cron triggers) instead of a host crontab, and it logs to stdout (`docker logs -f iss-etl`).

The collect job (`src/get_iss_data.py`) makes a GET request to the Open Notify ISS API to get the location of the ISS and the current UNIX timestamp. The location of the ISS is sent to the OpenWeather API, which returns the weather description, temperature and the country code at that location. Lastly, the country code is looked up in the `country_data` table to get the country's name, capital, flag URL, and the countries bordering it. That table caches the [REST Countries v5 API](https://restcountries.com/docs/countries): the free plan only allows 1,000 requests a month, so the whole country list (3 pages) is downloaded at startup when the cache is empty and again once it's older than `COUNTRIES_MAX_AGE_DAYS` (7), instead of calling the API on every run. Without `RESTCOUNTRIES_API_KEY`, or before the cache is filled, the bundled `src/countries.json` (with flags from flagcdn.com) is used. The speed of the ISS is calculated from the distance to the previous data point.

All this data is saved to the Postgres database for the Flask app, which plots every data point on the map. The cleanup job (`src/delete_iss_data.py`) deletes data points older than `RETENTION_HOURS` (24 by default).

The schedules (UTC), set with environment variables in `docker-compose.yml`:

```
# COLLECT_CRON: ISS data collection every minute (also runs once at startup)
* * * * *

# CLEANUP_CRON: delete old ISS data every hour
0 * * * *

# COUNTRIES_CRON: refresh the country cache daily at 03:00 if it's stale (also checked at startup)
0 3 * * *
```

To run a job once by hand: `docker exec iss-etl python get_iss_data.py` or `docker exec iss-etl python delete_iss_data.py`.
