# Get ISS Data
curl http://api.open-notify.org/iss-now.json > issdata.json
timestamp=$(jshon -e "timestamp" < issdata.json)
latitude=$(jshon -e "iss_position" -e "latitude" < issdata.json | tr -d '"')
longitude=$(jshon -e "iss_position" -e "longitude" < issdata.json | tr -d '"')
echo $timestamp
echo $latitude
echo $longitude

# Get Random Number Data
curl http://numbersapi.com/random/math?json > randnum.json
randnumfact=$(jshon -e "text" < randnum.json | tr -d \'\")
echo $randnumfact

# Get Weather Data
curl "http://api.openweathermap.org/data/2.5/weather?lat=$latitude&lon=$longitude&appid=18f28cad6f824cfbbaa5da267d936149&units=imperial" > weatherdata.json
#curl "http://api.openweathermap.org/data/2.5/weather?lat=-8.0142857&lon=-34.8453757&appid=18f28cad6f824cfbbaa5da267d936149&units=imperial" > weatherdata.json
weatherdescription=$(jshon -e "weather" -e 0 -e "description" < weatherdata.json | tr -d '"')
temp=$(printf "%.2f \n" $(jshon -e "main" -e "temp" < weatherdata.json))
countrycode=$(jshon -e "sys" -e "country" < weatherdata.json | tr -d '"')
echo $weatherdescription
echo $temp
echo $countrycode

# Get Country Date
if [ -z "$countrycode" ]
then
	echo "No Country at this location"
else
	curl https://restcountries.com/v2/alpha/${countrycode} > countrydata.json
	countryname=$(jshon -e "name" < countrydata.json | tr -d '"')
	countryborders=$(jshon -e "borders" < countrydata.json | tr -d '[' | tr -d '\n' | tr -d '"' | tr -d ']' | xargs)
	countryflag=$(jshon -e "flags" -e "svg" < countrydata.json | tr -d '"')
	countrycapital=$(jshon -e "capital" < countrydata.json | tr -d '"')
	echo $countryname
	echo $countryborders
	echo $countryflag
	echo $countrycapital
fi

# Insert Into Database
if [ -z "countrycode" ]
then
	PGPASSWORD=08d9dca91c773c5f0c129696378d546bcb501c4686ee6696a3106ed685f74b5d psql -h ec2-3-224-23-0.compute-1.amazonaws.com -d drut1ogg4206h -U dcgyftmeejtile -c "INSERT INTO iss_data_table(iss_timestamp, iss_lat, iss_lon, num_description, weather_description, weather_temp) VALUES ('$timestamp', '$latitude', '$longitude', '$randnumfact', '$weatherdescription', '$temp')"
else
	PGPASSWORD=08d9dca91c773c5f0c129696378d546bcb501c4686ee6696a3106ed685f74b5d psql -h ec2-3-224-23-0.compute-1.amazonaws.com -d drut1ogg4206h -U dcgyftmeejtile -c "INSERT INTO iss_data_table(iss_timestamp, iss_lat, iss_lon, num_description, weather_description, weather_temp, country_alpha_code, country_name, country_borders, country_flag_url, country_capital) VALUES ('$timestamp', '$latitude', '$longitude', '$randnumfact', '$weatherdescription', '$temp', '$countrycode', '$countryname', '$countryborders', '$countryflag', '$countrycapital')"
fi
