# Pull base image
FROM node:14-buster-slim

# Install VA Certificates
RUN apt-get update && apt-get install -y curl
ENV ADDITIONAL_CA_CERTS=/ca-certificates
ADD certs/install_certs.sh /tmp/install_certs.sh
RUN chmod a+x /tmp/install_certs.sh && /tmp/install_certs.sh

# Set Working Directory
WORKDIR /src/src/app

# Copy package.json
COPY package*.json ./

# Install Dependencies
RUN npm install

# Copy Source
COPY . .

# Start SlackBot
# CMD ["node", "src/app.js", "|", "./node_modules/.bin/pino-pretty -t"]
CMD ["node", "src/app.js"]
