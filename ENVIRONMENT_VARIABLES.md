# Environment Variables Documentation

This document outlines the environment variables required to configure and run the `ms-supplier` microservice.

## Required Variables

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `DATABASE_URL` | Connection string for the PostgreSQL database. Must be in the format `postgresql://USER:PASSWORD@HOST:PORT/DBNAME`. | **Yes** | N/A | `postgresql://postgres:postgres@localhost:5432/ms_supplier` |

## Optional Variables

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `PORT` | The port on which the service listens. | No | `3001` | `8080` |

## Notes for DevOps

- **Database**: The service uses Prisma ORM. Ensure the `DATABASE_URL` points to a valid PostgreSQL instance.
- **CI/CD**: In the CI/CD pipeline (GitHub Actions), these variables should be injected as secrets or environment variables if needed for integration tests (though currently, the build process only requires `npm install` and `docker build`).
- **Production**: For production deployment (e.g., K8s, ECS), ensure `DATABASE_URL` is set to the production database endpoint.
