const { auth } = require("express-oauth2-jwt-bearer");
require("dotenv").config();

// Authorization middleware. When used, the Access Token must
// exist and be verified against the Auth0 JSON Web Key Set.
const checkJwt = auth({
  audience: process.env.ASGARDIO_AUDIENCE,
  issuerBaseURL: process.env.ASGARDIO_ISSUER_BASE_URL,
  tokenSigningAlg: "RS256",
});

module.exports = checkJwt;
