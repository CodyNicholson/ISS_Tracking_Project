# Long-running scheduler that runs the ETL cron jobs (see src/scheduler.py). Logs go to stdout.
FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY src/ .
RUN useradd --system --no-create-home appuser
USER appuser
CMD ["python", "scheduler.py"]
