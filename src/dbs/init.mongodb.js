'use strict'

const mongoose = require("mongoose");
const { countConnect } = require("../helpers/check.connect")
const { db: { host, port, name } } = require('../configs/config.mongodb')

const connectString = 'mongodb://admin:password@mongodb:27017/shopDEV?authSource=admin';

class Database {
    constructor() {
        this.connect()
    }

    connect(type = 'mongodb') {   
        if (1 === 1) {
            mongoose.set('debug', true);
            mongoose.set('debug', { color: true });

        }

        mongoose.connect(connectString, {
            
            maxPoolSize: 50
        }).then(_ => {
            console.log("Check count connnect: ", countConnect())

        })
            .catch(err => console.log("Error Connect!"));
    }

    static getInstance() {
        if (!Database.instance) {
            Database.instance = new Database()
        }
        return Database.instance
    }

}

const instanceMongoDB = Database.getInstance();


module.exports = instanceMongoDB;

