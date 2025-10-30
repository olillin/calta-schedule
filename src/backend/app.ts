import express from 'express'
import fs from 'fs'
import http from 'http'
import https from 'https'

// Environment variables
interface EnvironmentVariables {
    PORT?: Number
}

// Remove 'optional' attributes from a type's properties
type Concrete<Type> = {
    [Property in keyof Type]-?: Type[Property]
}

const DEFAULT_ENVIRONMENT: Concrete<EnvironmentVariables> = {
    PORT: 8080,
}

const ENVIRONMENT: Concrete<EnvironmentVariables> = Object.assign(Object.assign({}, DEFAULT_ENVIRONMENT), process.env as EnvironmentVariables)
const { PORT } = ENVIRONMENT

// Paths
const PUBLIC_DIRECTORY = 'public'

// Setup express app
const app = express()

if (fs.existsSync(PUBLIC_DIRECTORY)) {
    app.use('/', express.static(PUBLIC_DIRECTORY))
} else {
    console.warn('WARNING: No public directory')
}

// Start server
var server
var useHttps = fs.existsSync('./key.pem') && fs.existsSync('./cert.pem')
if (useHttps) {
    server = https.createServer(
        {
            key: fs.readFileSync('./key.pem'),
            cert: fs.readFileSync('./cert.pem'),
        },
        app
    )
} else {
    server = http.createServer({}, app)
}

server.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`)
})