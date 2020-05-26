# International Space Station Tracking ETL Project

This directory includes a python script that gets called from a shell script that gets called from a crontab file scheduled to execute the shell script every five minutes.

The python script will make a GET request to NASA's ISS tracking API and grab the location of the ISS and the current unix timestamp. The last three, two, or one character will be taken off the UNIX Timestamp and sent to the NumbersAPI that will provide an interesting fact about that number. The location of the ISS will be taken and sent to the WeatherAPI which will return data about that location including: weather description, country code, temperature, and other weather-related data. Lastly, the country code from the WeatherAPI will be sent to the REST_Countries API that will provide us with the country's full name, a link to the flag of that country, the country's capital, and a list of the countries that border that country.

All this data will be saved to a Postgres Database for use by a frontend application that will plot on the map all the points with the data collected every minute. My Postgres database is hosted for free on Heroku, which has a row limit of 10,000. I delete data daily using another cron job to make sure I am always under the limit.

The jobs I scheduled in my crontab file:

```
# ISS Data Collection Every Minute
* * * * * ISS_Tracking_Project/etl_app/jobs/get_iss_data.sh

# ISS Data Deletion Every Day
0 0 * * * ISS_Tracking_Project/etl_app/jobs/delete_iss_data.sh
```
