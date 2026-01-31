# syntax=docker/dockerfile:1
# Use Python 3.11 slim (glibc-based, not Alpine)
# LiveKit Cloud requires glibc-based images
FROM python:3.11-slim AS base

# Keeps Python from buffering stdout and stderr
# This ensures logs are immediately visible in LiveKit Cloud dashboard
ENV PYTHONUNBUFFERED=1

# Create a non-privileged user for security
# LiveKit Cloud best practice: don't run as root
ARG UID=10001
RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/app" \
    --shell "/sbin/nologin" \
    --uid "${UID}" \
    appuser

# Install build dependencies for Python packages with native extensions
# Some LiveKit agent dependencies require compilation
RUN apt-get update && apt-get install -y \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first for better Docker layer caching
# This allows Docker to cache the dependency installation layer
# When deploying with "lk agent deploy agents/", build context is agents/
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy agent code
# Build context is agents/ directory, so copy all files from current directory
COPY . ./

# Change ownership to non-privileged user
RUN chown -R appuser:appuser /app

# Switch to non-privileged user
USER appuser

# Run the agent with "start" command
# LiveKit Cloud automatically injects:
# - LIVEKIT_URL
# - LIVEKIT_API_KEY  
# - LIVEKIT_API_SECRET
# Other secrets should be set via: lk agent secrets set KEY=value
CMD ["python", "hedra_agent.py", "start"]
