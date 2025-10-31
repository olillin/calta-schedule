import express from 'express'
import fs from 'fs'
import http from 'http'
import https from 'https'
import { createCalendar, findPeople, loadCsvFromUrl } from './convert'

// Environment variables
interface EnvironmentVariables {
    PORT?: number
    CSV_URL?: string | null
}

// Remove 'optional' attributes from a type's properties
type Concrete<Type> = {
    [Property in keyof Type]-?: Type[Property]
}

const DEFAULT_ENVIRONMENT: Concrete<EnvironmentVariables> = {
    PORT: 8080,
    CSV_URL: null,
}

const ENVIRONMENT: Concrete<EnvironmentVariables> = Object.assign(
    Object.assign({}, DEFAULT_ENVIRONMENT),
    process.env as EnvironmentVariables
)
const { PORT, CSV_URL } = ENVIRONMENT

if (!CSV_URL) {
    console.error('Missing required environment CSV_URL')
    process.exit()
}

// Paths
const PUBLIC_DIRECTORY = 'public'

// Setup express app
const app = express()

if (fs.existsSync(PUBLIC_DIRECTORY)) {
    app.use('/', express.static(PUBLIC_DIRECTORY))
} else {
    console.warn('WARNING: No public directory')
}

app.get('/calendar', (req, res) => {
    const ta = String(req.query.ta ?? '')
    loadCsvFromUrl(CSV_URL)
        .then(csv => {
            return createCalendar(csv, ta)
        })
        .then(calendar => {
            res.setHeader('Content-Type', 'text/calendar')
                .setHeader(
                    'Content-Disposition',
                    `attachment; filename="${ta}.ics"`
                )
                .end(calendar.serialize())
        })
})

app.get('/people', (req, res) => {
    loadCsvFromUrl(CSV_URL).then(csv => {
        const people = [...findPeople(csv)].sort()
        res.json({ people: people })
    })
})

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
