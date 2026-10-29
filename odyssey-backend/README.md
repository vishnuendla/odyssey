# Odyssey Backend

Java 17 and Spring Boot 3.2 REST API for Odyssey. The backend uses Spring Security, Spring Data JPA, and MySQL.

## Requirements

- Java 17
- Maven
- MySQL 8

## Configure and run

In PowerShell, set local database credentials and create a fresh JWT signing key:

```powershell
$env:DB_URL = "jdbc:mysql://localhost:3306/odyssey_db?allowPublicKeyRetrieval=true&useSSL=false&createDatabaseIfNotExist=true"
$env:DB_USERNAME = "root"
$env:DB_PASSWORD = "your-local-mysql-password"
$env:JWT_SECRET = [Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
mvn spring-boot:run
```

The API listens on http://localhost:9090. The database URL, username, password, and JWT key are provided through environment variables. `JWT_EXPIRATION` is optional and is measured in milliseconds; the default is one day. The `production` Spring profile reads database and JWT settings from the same environment variables.

Do not commit credentials or signing keys. Rotating `JWT_SECRET` invalidates existing login tokens.

## Verify

```powershell
mvn --batch-mode --no-transfer-progress verify
```

The repository currently has no backend test sources, so Maven reports “No tests to run.” GitHub Actions runs Maven verification on pushes and pull requests to `dev` and `main`.

## API areas

- `/api/auth` — registration, login, current user, and logout
- `/api/journals` — journal management and public journals
- `/api/locations` — location search
