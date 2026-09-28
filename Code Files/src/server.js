require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    const PORT = process.env.PORT || 5000;

    const server = app.listen(PORT, () => {
      console.log(
        `Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`
      );
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (err) => {
      console.error(`Unhandled Rejection: ${err.message}`);

      server.close(() => {
        process.exit(1);
      });
    });

  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();