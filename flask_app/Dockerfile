# Production image: gunicorn serves the Flask app on port 80.
FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
# Docker lets unprivileged users bind ports below 1024 inside the container
RUN useradd --system --no-create-home appuser
USER appuser
EXPOSE 80
CMD ["gunicorn", "--bind", "0.0.0.0:80", "--workers", "2", "--threads", "4", "--access-logfile", "-", "app:app"]
