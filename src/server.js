const app = require("./app");

const port = process.env.PORT || 3001;

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(
    `Supplier Management Service running on http://localhost:${port} (docs at /docs)`
  );
});
