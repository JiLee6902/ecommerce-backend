'use strict'
const mongoose = require("mongoose")
const os = require('os')
const process = require('process')
const _SECONDS = 5000

const countConnect = () => {
    const numConnection = mongoose.connections.length
    console.log(`Number of connnection: ${numConnection}`)

}


const checkOverload = () => {
    setInterval(() => {
        const numConnection = mongoose.connections.length
        const numCores = os.cpus().length 
        const memoryUsage = process.memoryUsage().rss; 

        console.log( `Active ${numConnection}`)
        const maxConnection = numCores * 5
        if(numConnection > maxConnection) {
            console.log("Connection overload detected! ")
        }

    }, _SECONDS)
}

module.exports = {
    countConnect,
    checkOverload
}