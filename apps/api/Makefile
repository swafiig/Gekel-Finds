.PHONY: run build test vet tidy migrate up down secrets

run:            ## run locally (loads .env)
	set -a; . ./.env; set +a; go run ./cmd/server
build:
	CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o bin/server ./cmd/server
test:
	go test ./... -race -count=1
vet:
	go vet ./...
tidy:           ## creates go.sum
	go mod tidy
migrate:        ## needs DATABASE_URL (psql syntax)
	for f in db/migrations/*.sql; do psql "$$DATABASE_URL" -v ON_ERROR_STOP=1 -f $$f; done
up:
	docker compose up --build -d
down:
	docker compose down
secrets:        ## print two fresh secrets
	@echo JWT_SECRET=$$(openssl rand -base64 48 | tr -d '\n'); echo OTP_SECRET=$$(openssl rand -base64 48 | tr -d '\n')
