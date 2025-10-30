import { randomUUID } from 'crypto'
import { readFile } from 'fs/promises'
import { Calendar, CalendarDateTime, CalendarEvent, ONE_MINUTE_MS, padZeros } from 'iamcal'
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

export function parseCsv(text: string, removeHeader: boolean = true): ScheduleData {
    const lines = text
        .toString()
        .split(/\r?\n/)
        .map(line => line.split(/, ?/) as ScheduleLine)
    if (removeHeader) 
        return lines.slice(1)
    
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

export function createCalendar(csv: ScheduleData, ta: string, offsetMinutes: number = 0): Calendar {
    const calendar = new Calendar(
        '-//Olillin/calta-schedule//SV'
    ).setCalendarName(
        `Advanced Python TA Lab Schedule (${capitalizeWords(ta)})`
    )

    const offsetMs = offsetMinutes * ONE_MINUTE_MS

    ta = ta.toLowerCase()

    for (let i = 0; i < csv.length; i++) {
        const line = csv[i]
        
        const people = getPeople(line)
        if (!people.map(p => p.toLowerCase()).includes(ta)) continue

        const startString = line[datum] + ' ' + line[starttid]
        const start = new Date(new Date(startString).getTime() + offsetMs)
        const endString = line[datum] + ' ' + line[sluttid]
        const end = new Date(new Date(endString).getTime() + offsetMs)

        const event = new CalendarEvent(`session${line}`, new Date(), start)
            .setEnd(end)
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
