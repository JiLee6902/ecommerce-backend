'use strict';

const mongoose = require("mongoose");
const { countConnect } = require("../helpers/check.connect");

const connectString = 'mongodb://admin:password@mongodb:27017/shopDEV?authSource=admin&connectTimeoutMS=30000&serverSelectionTimeoutMS=30000';

class Database {
    constructor() {
        this.connect();
    }

    // Thêm retry logic
    async connect(type = 'mongodb') {
        if (1 === 1) {
            mongoose.set('debug', true);
            mongoose.set('debug', { color: true });
        }

        const connectWithRetry = async (retries = 5, interval = 5000) => {
            try {
                await mongoose.connect(connectString, {
                    maxPoolSize: 50,
                    serverSelectionTimeoutMS: 30000,
                    heartbeatFrequencyMS: 2000,
                });

                console.log("Connected to MongoDB successfully!");
                console.log("Check count connect: ", countConnect());

                return true;
            } catch (err) {
                console.log(`MongoDB connection attempt failed. Retries left: ${retries}`);
                console.error('Error:', err.message);

                if (retries <= 0) {
                    console.error("Max retries reached. Could not connect to MongoDB");
                    process.exit(1);
                }

                await new Promise(resolve => setTimeout(resolve, interval));
                return connectWithRetry(retries - 1, interval);
            }
        };


        mongoose.connection.on('error', err => {
            console.error('MongoDB connection error:', err);
            connectWithRetry();
        });

        mongoose.connection.on('connected', () => {
            console.log('MongoDB connected');
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected');
            connectWithRetry();
        });


        process.on('SIGINT', async () => {
            try {
                await mongoose.connection.close();
                console.log('MongoDB connection closed through app termination');
                process.exit(0);
            } catch (err) {
                console.error('Error during MongoDB disconnection:', err);
                process.exit(1);
            }
        });

        return connectWithRetry();
    }

    static getInstance() {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }
}

const instanceMongoDB = Database.getInstance();
module.exports = instanceMongoDB;