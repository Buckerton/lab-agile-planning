FROM python:3.12-alpine

WORKDIR /app

# Copy files (optional if using bind mount)
COPY . /app

# Expose port 8080
EXPOSE 8080

# Start a simple HTTP server
CMD ["python", "-m", "http.server", "8080"]
