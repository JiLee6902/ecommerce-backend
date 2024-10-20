const app = require("./src/app")

const PORT = process.env.PORT || 3000
const server = app.listen(PORT, () => {
    console.log(`MSV eCommerce start with ${PORT}  `)
})

process.on('SIGINT', () => {
    server.close(() => console.log("Exit server Express"))
})

