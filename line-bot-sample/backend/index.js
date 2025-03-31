const express = require("express");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import presentation layer routes
const presentationRoutes = require("./presentation/reservation");
app.use(presentationRoutes);

// Import the call.js router
const callRoutes = require("./presentation/call"); // Adjust the path based on where call.js is located
app.use(callRoutes);

app.get("/", (req, res) => {
  res.status(200).send("Success");
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
