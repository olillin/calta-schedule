import { readFile } from 'fs/promises'
import {
    Calendar,
    CalendarEvent,
    deserializeComponentString,
    padHours,
} from 'iamcal'
import { tzlib_get_ical_block } from 'timezones-ical-library'
import { capitalizeWords } from './util'

const kurskoder = 0
const datum = 1
const starttid = 2
const sluttid = 3
const rum = 4
const handledareA = 5
const handledareB = 6
const handledareC = 7

export type ScheduleLine = [
    kurskoder: string,
    datum: string,
    starttid: string,
    sluttid: string,
    rum: string,
    handledareA: string,
    handledareB: string,
    handledareC: string
]
export type ScheduleData = ScheduleLine[]

export async function loadCsvFromFile(
    path: string = '../schedule.csv'
): Promise<ScheduleData> {
    return readFile(path).then(text => parseCsv(text.toString()))
}

export async function loadCsvFromUrl(url: string): Promise<ScheduleData> {
    return new Promise((resolve, reject) => {
        fetch(url).then(async response => {
            if (response.ok) {
                const text = await response.text()
                const csv = parseCsv(text)
                resolve(csv)
            } else {
                reject(response)
            }
        })
    })
}

export function parseCsv(
    text: string,
    removeHeader: boolean = true
): ScheduleData {
    const lines = text
        .toString()
        .split(/\r?\n/)
        .map(line => line.split(/, ?/) as ScheduleLine)
    if (removeHeader) return lines.slice(1)

    return lines
}

export function findPeople(csv: ScheduleData): Set<string> {
    return new Set<string>(csv.flatMap(line => getPeople(line)))
}

function getPeople(line: ScheduleLine): readonly string[] {
    return [line[handledareA], line[handledareB], line[handledareC]]
        .map(p => p.trim())
        .filter(p => p !== '')
}

export async function createCalendar(
    csv: ScheduleData,
    ta: string
): Promise<Calendar> {
    const calendar = new Calendar(
        '-//Olillin/calta-schedule//SV'
    ).setCalendarName(
        `Advanced Python TA Lab Schedule (${capitalizeWords(ta)})`
    )
    const serializedTimezone = tzlib_get_ical_block('Europe/Stockholm')
    const timezone = await deserializeComponentString(
        typeof serializedTimezone === 'string'
            ? serializedTimezone
            : serializedTimezone[0]
    )
    calendar.addComponent(timezone)

    ta = ta.toLowerCase()

    const now = new Date()

    for (let i = 0; i < csv.length; i++) {
        const line = csv[i]

        const people = getPeople(line)
        if (!people.map(p => p.toLowerCase()).includes(ta)) continue

        const date = line[datum].replace(/-/g, '')

        let [startHours, startMinutes] = line[starttid].split(':')
        startHours = padHours(parseInt(startHours) - 1)
        const start = date + 'T' + startHours + startMinutes + '00Z'

        let [endHours, endMinutes] = line[sluttid].split(':')
        endHours = padHours(parseInt(endHours) - 1)
        const end = date + 'T' + endHours + endMinutes + '00Z'

        const event = new CalendarEvent(`session${i}`, now, now)
            .setProperty(
                'DTSTAMP',
                now.toISOString().replace(/([-:]|\.\d+)/g, '')
            )
            .setProperty('DTSTART', start)
            .setProperty('DTEND', end)
            .setSummary(`Lab Advanced Python`)
            .setDescription(
                `Handledare: ${people.join(', ')}\nKurskoder: ${
                    line[kurskoder]
                }`
            )
            .setLocation(line[rum])

        calendar.addComponent(event)
    }

    return calendar
}
