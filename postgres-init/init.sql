-- Runs once, when the iss_pg_data volume is first created.
-- Columns stay strings to match the original Heroku schema; queries cast them where needed.
CREATE TABLE IF NOT EXISTS iss_data_table (
    iss_timestamp VARCHAR(50) PRIMARY KEY,
    iss_lat VARCHAR(20) NOT NULL,
    iss_lon VARCHAR(20) NOT NULL,
    weather_description VARCHAR(255),
    weather_temp VARCHAR(10),
    country_alpha_code VARCHAR(10),
    country_name VARCHAR(50),
    country_borders VARCHAR(255),
    country_flag_url VARCHAR(255),
    country_capital VARCHAR(50),
    iss_mph VARCHAR(50)
);

-- Cache of the REST Countries API, filled and refreshed by the ETL
CREATE TABLE IF NOT EXISTS country_data (
    alpha_2 VARCHAR(2) PRIMARY KEY,
    alpha_3 VARCHAR(3) NOT NULL,
    name VARCHAR(100) NOT NULL,
    capital VARCHAR(100) NOT NULL,
    borders TEXT NOT NULL,
    flag_url VARCHAR(255) NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);
