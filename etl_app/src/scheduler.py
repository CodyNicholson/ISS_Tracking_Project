import os
import logging
from datetime import datetime, timezone
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger

from db import createTables
from get_iss_data import collect
from delete_iss_data import cleanup
from util import refreshCountriesIfStale

# Cron expressions in UTC (minute hour day month weekday)
COLLECT_CRON = os.environ.get("COLLECT_CRON", "* * * * *")
CLEANUP_CRON = os.environ.get("CLEANUP_CRON", "0 * * * *")
# Daily check; the API is only called when the cache is older than COUNTRIES_MAX_AGE_DAYS
COUNTRIES_CRON = os.environ.get("COUNTRIES_CRON", "0 3 * * *")

def main():
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
    createTables()
    # Fill the country cache before the first collect; restarts don't call the API while the cache is fresh
    refreshCountriesIfStale()

    scheduler = BlockingScheduler(timezone=timezone.utc)
    # Collect once at startup so the map has a point right away; skip runs instead of stacking them if an API is slow
    scheduler.add_job(collect, CronTrigger.from_crontab(COLLECT_CRON, timezone=timezone.utc), id="collect",
                      next_run_time=datetime.now(timezone.utc), max_instances=1, coalesce=True, misfire_grace_time=30)
    scheduler.add_job(cleanup, CronTrigger.from_crontab(CLEANUP_CRON, timezone=timezone.utc), id="cleanup",
                      max_instances=1, coalesce=True, misfire_grace_time=300)
    scheduler.add_job(refreshCountriesIfStale, CronTrigger.from_crontab(COUNTRIES_CRON, timezone=timezone.utc), id="countries",
                      max_instances=1, coalesce=True, misfire_grace_time=3600)
    logging.getLogger(__name__).info("Scheduling collect (%s), cleanup (%s) and country refresh (%s)",
                                     COLLECT_CRON, CLEANUP_CRON, COUNTRIES_CRON)
    scheduler.start()

if __name__ == "__main__":
    main()
