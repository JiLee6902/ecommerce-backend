'use strict'

const mongoose = require("mongoose");
const { countConnect } = require("../helpers/check.connect")

const connectString = process.env.MONGODB_URI ||'mongodb://admin:password@mongodb:27017/shopDEV?authSource=admin';
//mongodb+srv://root:aPxp3Rt1sLqDfmG0@cluster.gtgqo6e.mongodb.net/jilee
mongoose.connect(connectString).then(_ => console.log("Check count connnect: ", countConnect()))
    .catch(err => console.log("Error Connect!"));

//dành cho dev    
if (1 === 0) {
    mongoose.set('debug', true);
    mongoose.set('debug', { color: true });

}

module.exports = mongoose;