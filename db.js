const mongoose = require("mongoose");
require("dotenv").config();

const connectToMongo = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL, {
       
        });
         console.log("Connected to MongoDB successfully");
    
    } catch (error) {
        console.log(error);
        console.error("Error connecting to MongoDB:", error.message);   
        process.exit(1);
    }
    mongoose.connection.on("disconnected", () => {
            });
};

module.exports = { connectToMongo };