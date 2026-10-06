FROM golang:1.27-alpine AS builder

WORKDIR /app

RUN apk add --no-cache ca-certificates

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -trimpath -ldflags="-s -w" \
    -o /bin/gekel-api ./cmd/server


FROM gcr.io/distroless/static-debian13:nonroot

WORKDIR /app

COPY --from=builder /bin/gekel-api /app/gekel-api

USER nonroot:nonroot

EXPOSE 8080

ENTRYPOINT ["/app/gekel-api"]