# Build stage: compile the Spring Boot jar with JDK 17.
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# Cache dependencies separately from the source tree.
COPY pom.xml .
RUN mvn -q -DskipTests dependency:go-offline

COPY src ./src
RUN mvn -q -DskipTests package

# Runtime stage: small JRE image with a non-root user.
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

RUN addgroup -S odyssey && adduser -S odyssey -G odyssey \
    && apk add --no-cache curl

COPY --from=build /app/target/odyssey-backend-*.jar app.jar

RUN mkdir -p /app/uploads && chown -R odyssey:odyssey /app
USER odyssey

ENV FILE_UPLOAD_DIR=/app/uploads \
    JAVA_OPTS="-XX:MaxRAMPercentage=75 -XX:+UseG1GC"

EXPOSE 9090

HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
    CMD curl -fsS http://localhost:9090/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
