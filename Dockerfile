# Building stage
FROM denoland/deno:latest AS builder
WORKDIR /app
COPY . .
RUN deno install
RUN deno cache main.ts

# Production stage
FROM denoland/deno:latest
WORKDIR /app
COPY --from=builder /app .
RUN chmod +x start.sh
CMD [ "/app/start.sh" ]