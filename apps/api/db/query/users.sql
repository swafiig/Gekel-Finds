-- name: CreateUser :one
INSERT INTO users (
    full_name,
    email,
    phone,
    password_hash,
    role
)
VALUES (
    $1,
    $2,
    $3,
    $4,
    $5
)
RETURNING *;


-- name: GetUserByID :one
SELECT *
FROM users
WHERE id = $1
LIMIT 1;


-- name: GetUserByPhone :one
SELECT *
FROM users
WHERE phone = $1
LIMIT 1;


-- name: GetUserByEmail :one
SELECT *
FROM users
WHERE email = $1
LIMIT 1;


-- name: ListUsers :many
SELECT *
FROM users
ORDER BY created_at DESC
LIMIT $1
OFFSET $2;


-- name: UpdateUser :one
UPDATE users
SET
    full_name = $2,
    email = $3,
    phone = $4,
    role = $5,
    is_active = $6,
    updated_at = NOW()
WHERE id = $1
RETURNING *;


-- name: UpdateUserPassword :one
UPDATE users
SET
    password_hash = $2,
    updated_at = NOW()
WHERE id = $1
RETURNING *;


-- name: DeactivateUser :one
UPDATE users
SET
    is_active = FALSE,
    updated_at = NOW()
WHERE id = $1
RETURNING *;