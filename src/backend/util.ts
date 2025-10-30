export function capitalize(s: string) {
    return s.substring(0, 1).toUpperCase() + s.substring(1).toLowerCase()
}

export function capitalizeWords(text: string): string {
    return text.split(' ').map(capitalize).join(' ')
}