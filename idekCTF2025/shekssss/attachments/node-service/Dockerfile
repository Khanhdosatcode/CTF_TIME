FROM node:20

WORKDIR /usr/src/app

# Copy backend package files and install dependencies
COPY package*.json ./
COPY tsconfig.json ./

RUN npm install

# Copy backend source code
COPY src/ ./src/
COPY uploads/ ./uploads/

# Copy React app source
COPY client/ ./client/

# Build React app
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL
WORKDIR /usr/src/app/client
RUN npm install
RUN npm run build

# After building React app, copy config.js to the build output
WORKDIR /usr/src/app/client
RUN cp public/config.js build/config.js

# Go back to backend root
WORKDIR /usr/src/app

EXPOSE 3000

CMD ["npx", "ts-node", "src/index.ts"]
