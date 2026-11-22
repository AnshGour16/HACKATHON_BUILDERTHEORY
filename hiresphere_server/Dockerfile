FROM dart:stable AS build

WORKDIR /app
COPY pubspec.* ./
RUN dart pub get

COPY . .
RUN dart compile exe bin/main.dart -o bin/server

FROM subfuzion/dumb-init:latest AS runner

WORKDIR /app
COPY --from=build /runtime/ /
COPY --from=build /app/bin/server /app/bin/server
COPY --from=build /app/config/ /app/config/

EXPOSE 8080 8081 8082

CMD ["/usr/bin/dumb-init", "--", "/app/bin/server", "--mode", "production"]
