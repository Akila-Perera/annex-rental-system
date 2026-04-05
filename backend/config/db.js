const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // process.env pulls the variables from your .env file
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        process.exit(1); // This stops the server if the database fails to connect
    }
};

module.exports = connectDB;