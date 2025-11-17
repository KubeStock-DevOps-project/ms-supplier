const path = require("path");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const YAML = require("yamljs");
const swaggerUi = require("swagger-ui-express");
const OpenApiValidator = require("express-openapi-validator");

// We will create this file in the next step
const supplierRouter = require("./routes/suppliers"); 
require("dotenv").config();
const { errorHandler } = require("./middleware/error");

const app = express();

// --- Basic middleware ---
app.use(helmet()); // Adds security headers
app.use(cors()); // Allows cross-origin requests
app.use(express.json({ limit: "1mb" })); // Parses incoming JSON payloads
app.use(morgan("dev")); // Logs incoming requests to the console

// --- OpenAPI & Swagger ---
// Load your OpenAPI specification file
const specPath = path.resolve(__dirname, "../supplier-management-service.yaml");
const apiSpec = YAML.load(specPath);

// Setup Swagger UI documentation at /docs
app.use("/docs", swaggerUi.serve, swaggerUi.setup(apiSpec));
// Serve the raw JSON spec at /api-docs.json
app.get("/api-docs.json", (_req, res) => res.json(apiSpec));

// --- OpenAPI Request Validation ---
// This middleware validates all incoming requests against your .yaml file
app.use(
  OpenApiValidator.middleware({
    apiSpec: specPath,
    validateRequests: true, // Ensure requests match the spec
    validateResponses: false, // We'll leave this off for simplicity
  })
);

// --- Your Application Routes ---
// All your supplier routes will be prefixed with /
app.use("/", supplierRouter);

// --- Error Handling ---
// 404 handler for any routes that don't exist
app.use((req, res) => {
  res.status(404).json({
    code: "NOT_FOUND",
    message: "Route not found",
    request_id: req.headers["x-request-id"],
  });
});

// Centralized error handler (the file you created in Step 11)
app.use(errorHandler);

// --- Start the Server ---
const port = process.env.PORT || 3001; // Reads the port from your .env file
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(
    `Supplier Management Service running on http://localhost:${port} (docs at /docs)`
  );
});

module.exports = app;