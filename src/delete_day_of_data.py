from config import weather_api_key, host, port, database, user, password
import glob
import datetime
import sqlalchemy as db
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy import Column, Integer, String, Float
from sqlalchemy.ext.declarative import declarative_base
Base = declarative_base()

class ISS_Data_Point(Base):
    __tablename__ = 'iss_data_table'
    iss_timestamp = Column(String(50), primary_key=True)
    iss_lat = Column(String(20))
    iss_lon = Column(String(20))
    num_description = Column(String(255))
    weather_description = Column(String(255))
    weather_temp = Column(String(10))
    country_alpha_code = Column(String(10))
    country_name = Column(String(50))
    country_borders = Column(String(255))
    country_flag_url = Column(String(255))
    country_capital = Column(String(50))

# Delete From Postgres
engine = create_engine(f"postgresql://{user}:{password}@{host}/{database}")
connection = engine.connect()
metadata = db.MetaData()
Base.metadata.create_all(connection)
session = Session(bind=engine)

one_day_of_data = connection.execute('SELECT * FROM public.iss_data_table ORDER BY iss_timestamp ASC FETCH FIRST 1440 ROWS ONLY;')
rows_to_delete = []
for iss_data_point in one_day_of_data:
    rows_to_delete.append(iss_data_point.iss_timestamp)
print("Deleting: " + str(len(rows_to_delete)) + " rows")

for row in rows_to_delete:
    delete_q = ISS_Data_Point.__table__.delete().where(ISS_Data_Point.iss_timestamp == row)
    session.execute(delete_q)
    session.commit()
    print(row + " deleted")

# Logging
files = [f for f in glob.glob("/home/pi/ISS_Tracking_Data_Collection_Project/logs/*.txt", recursive=True)]
log_count = str(len(files)+1)
print(f"Log: {log_count}")
now = datetime.datetime.now()
timestamp = str(now.strftime("%Y-%m-%d-%H-%M-%S"))
print(f"timestamp is: {timestamp}")

with open(f"/home/pi/ISS_Tracking_Data_Collection_Project/logs/delete-log{log_count}-{timestamp}.txt","w+") as file:
    file.write("ISS Tracking Data Collection Project Delete Log\n")
    file.write(f"Deleting: {str(len(rows_to_delete))} rows\n")
    file.write(f"timestamp: {timestamp}\n")
    file.write(f"Delete log number: {log_count}\n")
    file.write("End Log.\n\n")
    file.close()
