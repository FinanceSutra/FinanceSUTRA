# client/Dockerfile
FROM node:20

WORKDIR /app

# Copy everything from root (so it gets ../server too)
COPY . .

RUN npm install

EXPOSE 5003
CMD ["npm", "run", "dev"]
