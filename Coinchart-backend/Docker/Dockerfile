# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

ARG DATA_DIR=/data
ARG CANDLESTICK_DIR=/data/candlestick_data
ENV DATA_DIR=${DATA_DIR}
ENV CANDLESTICK_DIR=${CANDLESTICK_DIR}

# Install required dependencies (Python, make, g++, and other build tools)
RUN apk add --no-cache python3 py3-pip python3-dev \
    && apk add --no-cache make g++ \
    && ln -sf python3 /usr/bin/python

# Copy the current directory contents into the container at /app
COPY . /app

# Install dependencies
RUN npm install

# Make entrypoint script executable
RUN chmod +x /app/entrypoint.sh

# Use entrypoint script for container start
ENTRYPOINT ["/app/entrypoint.sh"]