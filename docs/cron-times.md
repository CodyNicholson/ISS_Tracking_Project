# Cron Times for ISS Tracker

Every Minute
```
* * * * * ./home/pi/ISS_Tracking_Project/etl_app/src/get-iss-data.sh
```

Every day at 1am
```
0 1 * * * ./home/pi/ISS_Tracking_Project/etl_app/src/delete-iss-data.sh
```
