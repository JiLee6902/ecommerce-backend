

const http = require('http');

//name 
process.title = 'node_non_cluster'

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.write('hello world! toidicode.com');
    res.end('Hello, welcome to out restaurant');
});

server.listen(8000, () => {
    console.log('Server is running on:::')
})