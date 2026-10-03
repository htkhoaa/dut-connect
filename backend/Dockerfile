FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /workspace
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw
COPY src/ src/
RUN --mount=type=cache,target=/root/.m2 ./mvnw -B -ntp clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine AS runtime
RUN apk add --no-cache curl \
    && addgroup -S app && adduser -S -G app app
WORKDIR /app
COPY --from=build --chown=app:app /workspace/target/dut-connect.jar app.jar
USER app
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=5s --start-period=60s --retries=6 \
    CMD curl --fail --silent http://localhost:8080/api/actuator/health/readiness > /dev/null || exit 1
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
