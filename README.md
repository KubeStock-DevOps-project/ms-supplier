# Supplier & Procurement Service (ms-supplier)

This is the Supplier & Procurement microservice for the **Inventory Management System** project.

## Overview

Its primary responsibility is to handle all interactions with vendors (suppliers). This includes:

- Managing supplier profiles and contact information.
- Creating and managing the lifecycle of Purchase Orders (POs).
- Providing an audit trail for all changes to supplier and PO data.

This service is built to be consistent with the architecture of the ms-order-main service.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Setup](#environment-setup)
  - [Installation](#installation)
  - [Running the Database](#running-the-database)
  - [Syncing the Database](#syncing-the-database)
  - [Running the Service](#running-the-service)
- [API Endpoints](#api-endpoints)
  - [Suppliers](#suppliers)
  - [Purchase Orders (POs)](#purchase-orders-pos)

## Tech Stack

- **Framework**: Express.js
- **Database**: PostgreSQL (managed via Docker)
- **ORM**: Prisma
- **API Specification**: OpenAPI 3.0 (Swagger)
- **Validation**: express-openapi-validator
- **Runtime**: Node.js

## Getting Started

### Prerequisites

- Node.js (v18+)
- Docker (for running the PostgreSQL database)

### Environment Setup

1. Copy `.env.example` to a new file named `.env` and fill in your database details. The default `DATABASE_URL` is configured to work with the Docker command below.

   ```env
   # Application
   PORT=3001

   # Database connection
   # Format: postgresql://USER:PASSWORD@HOST:PORT/DBNAME
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ms_supplier
   ```

### Installation

1. Install dependencies:

   ```bash
   npm install
   ```

### Running the Database

This project requires a running PostgreSQL database. You can run one in Docker with this command:

```bash
docker run --name ms-supplier-db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=ms_supplier -p 5432:5432 -d postgres:15
```

This matches the `DATABASE_URL` in the `.env` file.

### Syncing the Database

This command will read your `prisma/schema.prisma` file and create all the tables in your database:

```bash
npx prisma db push
```

### Running the Service

This command starts the server in development mode using nodemon, which will automatically restart when you save a file.

```bash
npm run dev
```

- Service runs on: <http://localhost:3001>
- API Docs are at: <http://localhost:3001/docs>

## API Endpoints

This service provides endpoints for managing Suppliers and Purchase Orders. All endpoints are fully documented and testable at <http://localhost:3001/docs>.

### Suppliers

- **POST** `/suppliers`: Register a new supplier.
- **GET** `/suppliers`: List all suppliers (paginated).
- **GET** `/suppliers/{id}`: Get a specific supplier's profile.
- **PATCH** `/suppliers/{id}`: Update a supplier's profile (supports optimistic concurrency via If-Match header).
- **GET** `/suppliers/{id}/audit`: Get a full audit history for a supplier.

### Purchase Orders (POs)

- **POST** `/purchase-orders`: Create a new purchase order for a supplier.
- **GET** `/purchase-orders`: List all purchase orders (for admin use).
- **GET** `/suppliers/{id}/purchase-orders`: List all POs for a specific supplier.
- **GET** `/purchase-orders/{id}`: Get a specific purchase order.
- **PATCH** `/purchase-orders/{id}`: Update a PO's status (e.g., "ACCEPTED", "SHIPPED").
