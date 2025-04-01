const mongoose = require("mongoose");
require("dotenv").config();

const connectToMongo = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL, {
        
        });
        console.log("mongoose has been connected successfully");
    } catch (error) {
        console.log("error occurred while connecting:", error);
        process.exit(1);
    }
    mongoose.connection.on("disconnected", () => {
        console.log("mongoose disconnected");
    });
};

module.exports = { connectToMongo };