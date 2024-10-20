
const cluster = require('cluster');
const http = require('http')
const numCPUs = require('os').cpus().length; 
if (cluster.isMaster) {
    process.title = 'node_cluster_master'

    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died`);
        console.log('Starting a new worker');
        cluster.fork(); 
    })
} else {
    process.title = `node_cluster_${cluster.worker.id}`
    require('./non.cluster')
}

