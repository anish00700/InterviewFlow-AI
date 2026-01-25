const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        console.log("Attempting to connect to DB...");
        // console.log("URI:", process.env.MONGO_URI); // Debug only
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/interviewflow');

        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
