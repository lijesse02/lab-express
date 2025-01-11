# Use an official Node.js image
FROM node:21 as build

# Set working directory
RUN mkdir -p /app
WORKDIR /app

# Copy package and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the files
COPY . .

# Build Tailwind CSS
RUN npx tailwindcss -i ./src/tailwind.css -o ./src/index.css --minify

# Build app
RUN npm run build

# Use lightweight nginx server
FROM nginx:alpine

# Copy built files to HTML directory of nginx
COPY --from=build /app/build /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Run nginx (default command in nginx image)