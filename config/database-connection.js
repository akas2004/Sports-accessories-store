const mongoose = require('mongoose');
require('dotenv').config(); // Load environment variables from .env file

// Use the DATABASE_URI from .env
mongoose
  .connect(`${process.env.DATABASE_URI}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log("DB Connected");
  })
  .catch((err) => {
    console.error("DB Connection Error", err);
  });

module.exports = mongoose.connection;
