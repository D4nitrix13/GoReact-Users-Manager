# Use an official Node.js base image
FROM node:16-alpine3.13

# Set the working directory inside the container
WORKDIR /frontend

# Copy the entire project into the container
COPY ./ ./

# Install all project dependencies
RUN /usr/local/bin/npm install

# Set the internal port React should listen on
ENV PORT=4000
ENV HOST=0.0.0.0

# Expose the port used by the app inside the container
EXPOSE 4000/tcp

# Start the React development server
CMD [ "/usr/local/bin/npm", "start" ]
