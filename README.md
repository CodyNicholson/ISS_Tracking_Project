# ISS Tracking Project

In this project I created an ETL app and a front-end Python Flask app to display the location of the International Space Station in real-time. The ETL app calls APIs every minute to get the location of the International Space Station, the weather at that location, and the country information at that location. The Flask app displays a map using Leaflet.js with a marker for each datapoint. The Flask app, the ETL scheduler and the Postgres database run in Docker containers, and the site is published at https://rixushomelab.com/. No login is required.

## Services

| Service | Container | What |
| --- | --- | --- |
| `db` | `iss-postgres` | Postgres 16. Data lives in the `iss_pg_data` volume; `postgres-init/init.sql` creates `iss_data_table` on a new volume |
| `etl` | `iss-etl` | Python scheduler running the cron jobs in `etl_app/src/scheduler.py` (see [etl_app/README.md](etl_app/README.md)) |
| `web` | – | Flask app served by gunicorn on port 80 |

## Run locally

```bash
cp .env.example .env   # then fill in the API keys
docker compose up --build
```

| URL | What |
| --- | --- |
| http://localhost:5000 | Map and today's records |
| http://localhost:5000/data-table | Latest 100 data points |
| http://localhost:5000/data?numRows=10 | JSON API (see `postman/` for every endpoint) |
| localhost:5435 | Postgres (user `iss`, database `iss`) |

The compose file joins an external network, so create it once if it doesn't exist: `docker network create tunnel-net`.
If a host port is already taken, override it, for example `WEB_HOST_PORT=5100 POSTGRES_HOST_PORT=5436 docker compose up --build`.

### Configuration (`.env`)

| Variable | Default | What |
| --- | --- | --- |
| `OPENWEATHER_API_KEY` | (empty) | OpenWeather key. Without it only the ISS position and speed are saved (the country comes from the weather response) |
| `RESTCOUNTRIES_API_KEY` | (empty) | REST Countries v5 key. The ETL caches every country in the `country_data` table and refreshes it weekly (about 15 of the free plan's 1,000 requests a month). Without it the bundled `etl_app/src/countries.json` is used |
| `MAPBOX_API_KEY` | (empty) | Mapbox public token for the map tiles. Without it the map uses OpenStreetMap/CARTO tiles |
| `POSTGRES_PASSWORD` | (required) | Database password; `docker compose` refuses to start without it (`openssl rand -hex 24`). It only applies when the volume is first created |
| `COLLECT_CRON` | `* * * * *` | When to collect a data point (UTC) |
| `CLEANUP_CRON` | `0 * * * *` | When to delete old data points (UTC) |
| `RETENTION_HOURS` | `24` | Data points older than this are deleted, so "Today's Records" covers the last day |
| `COUNTRIES_CRON` | `0 3 * * *` | When to check whether the country cache needs a refresh (UTC) |
| `COUNTRIES_MAX_AGE_DAYS` | `7` | Refresh the country cache from the API once it's this old |

## Data sources

- ISS position: [Open Notify](http://open-notify.org/Open-Notify-API/ISS-Location-Now/)
- Weather and country code: [OpenWeather](https://openweathermap.org/current)
- Country name, capital, borders and flag: [REST Countries v5](https://restcountries.com/docs/countries), cached in Postgres. Fallback: bundled `etl_app/src/countries.json`, trimmed from [mledoze/countries](https://github.com/mledoze/countries) (ODbL), with flags from [flagcdn.com](https://flagcdn.com)

Reset the database: `docker compose down -v`.

## Security

- Host ports are bound to `127.0.0.1` only. Docker publishes ports through its own iptables rules,
  which bypass host firewalls such as `ufw`, so a bare `5000:80` would be reachable from outside.
- `POSTGRES_PASSWORD` has no fallback: compose refuses to start until it is set in `.env`.
- Postgres is only on `backend-net` with the ETL and web services.
- The app containers run as an unprivileged user with all capabilities dropped, `no-new-privileges`,
  and memory and process limits.
- Every response carries `Content-Security-Policy` (same-origin only, no framing),
  `X-Content-Type-Options`, `Referrer-Policy` and `Permissions-Policy`
  (set in `flask_app/app.py`).
