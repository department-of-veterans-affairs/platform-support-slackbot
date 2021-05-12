# Pull base image
from node:14.15.0

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