# use official Golang image
FROM golang:1.16.3-alpine3.13

# Set Working Directory
WORKDIR /backend

# Copy The Source Code
COPY ./ ./

# Download And Install The Dependencies
RUN /usr/local/go/bin/go get -d -v ./...

# Build The Go App
RUN /usr/local/go/bin/go build -o api .

# Give Execute Permission To The Script
RUN chmod u+x ./initialization_script.sh

# EXPOSE The Port
EXPOSE 8000/tcp

# Run The Executable
CMD [ "./initialization_script.sh" ]