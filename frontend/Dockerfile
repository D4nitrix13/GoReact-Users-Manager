# use official Node.js image
FROM node:16-alpine3.13

# Set Working Directory
WORKDIR /frontend

# Copy The Source Code
COPY ./ ./

# Download And Install The Dependencies
RUN /usr/local/bin/npm install

# EXPOSE The Port
EXPOSE 3000/tcp

# Run The Executable
CMD [ "/usr/local/bin/npm", "start" ]