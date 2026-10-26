import os
from sqlalchemy import Column, DateTime, String, Text, MetaData, Table, create_engine, text

# pool_pre_ping replaces connections that Postgres dropped (e.g. after a database restart)
engine = create_engine(os.environ['DATABASE_URL'], pool_pre_ping=True)

metadata = MetaData()
iss_data_table = Table('iss_data_table', metadata,
              Column('iss_timestamp', String(50), primary_key=True),
              Column('iss_lat', String(20), nullable=False),
              Column('iss_lon', String(20), nullable=False),
              Column('weather_description', String(255), nullable=True),
              Column('weather_temp', String(10), nullable=True),
              Column('country_alpha_code', String(10), nullable=True),
              Column('country_name', String(50), nullable=True),
              Column('country_borders', String(255), nullable=True),
              Column('country_flag_url', String(255), nullable=True),
              Column('country_capital', String(50), nullable=True),
              Column('iss_mph', String(50), nullable=True)
           )

# Cache of the REST Countries API, refreshed weekly (see util.refreshCountriesIfStale)
country_data_table = Table('country_data', metadata,
              Column('alpha_2', String(2), primary_key=True),
              Column('alpha_3', String(3), nullable=False),
              Column('name', String(100), nullable=False),
              Column('capital', String(100), nullable=False),
              Column('borders', Text, nullable=False),
              Column('flag_url', String(255), nullable=False),
              Column('updated_at', DateTime(timezone=True), nullable=False)
           )

def createTables():
    # postgres-init/init.sql creates the tables on a new volume; this covers an existing one
    metadata.create_all(engine)
    # The random number fact was removed; drop its column from databases created before that
    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE iss_data_table DROP COLUMN IF EXISTS num_description"))
