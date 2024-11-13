# Base image
FROM python:3.9

# Install zbar for barcode scanning
RUN apt-get update && apt-get install -y zbar-tools

# Set working directory
WORKDIR /app

# Install Dependencies
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy project files
COPY . .

# Expose port and define default command
EXPOSE 5000
CMD ["python", "app/main.py"]
