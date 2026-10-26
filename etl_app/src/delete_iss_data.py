import os
import time
import logging
from sqlalchemy import BigInteger, cast, delete

from db import engine, iss_data_table

log = logging.getLogger(__name__)

def cleanup():
    """Deletes data points older than RETENTION_HOURS, so the home page's records cover about a day."""
    retention_hours = int(os.environ.get("RETENTION_HOURS", "24"))
    cutoff = int(time.time()) - retention_hours * 3600
    with engine.begin() as connection:
        result = connection.execute(
            delete(iss_data_table).where(cast(iss_data_table.c.iss_timestamp, BigInteger) < cutoff)
        )
    log.info("Deleted %d rows older than %d hours", result.rowcount, retention_hours)

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
    cleanup()
