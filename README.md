# International Space Station Tracking Data Collection Project

This project includes a python script that gets called from a shell script that gets called from a crontab file scheduled to execute the shell script every five minutes.

The python script will make a GET request to NASA's ISS tracking API and grab the location of the ISS and the current timestamp. The last three, two, or one character will be taken off of the UNIX Timestamp from the ISS API and sent to the NumbersAPI that will provide an interesting fact about that number. The location of the ISS will be taken and sent to the WeatherAPI which will return the weather description at the location, the country code, the temperature, and some other weather-related data. Lastly, the country code from the WeatherAPI will be sent to the REST_Countries API that will provide us with the country's full name, a link to the flag of that country, and a list of the countries that border that country.

All this data will be saved to a Postgres Database for use by a frontend application that will plot on the map all the points with the data collected every five minutes.

