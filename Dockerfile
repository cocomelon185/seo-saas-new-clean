FROM node:22-alpine
WORKDIR /app
COPY services/node-api/package*.json ./
RUN npm ci --omit=dev
COPY services/node-api/ ./
ENV NODE_ENV=production
EXPOSE 8080
CMD ["npm","start"]
