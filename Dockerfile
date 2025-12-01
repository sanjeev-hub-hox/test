# Base image
FROM node:20-alpine

# Create app directory
WORKDIR /notification-reminders

RUN npm config set registry https://registry.npmmirror.com/ --global

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install app dependencies
RUN npm install

# Bundle app source
COPY . .

# Creates a "dist" folder with the production build
RUN npm run build

# Expose 
EXPOSE 3003

# Start the server using the production build
CMD ["npm", "run", "start"]
