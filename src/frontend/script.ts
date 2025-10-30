const taSelect = document.getElementById('ta') as HTMLSelectElement
const urlOutput = document.getElementById('url') as HTMLElement

fetch('/people').then(response => 
    response.json()
).then(data => {
    const people = data.people as string[]

    people.forEach(ta => {
        const option = document.createElement('option')
        option.innerText = ta
        option.value = ta.toLowerCase()
        taSelect.appendChild(option)
    })
})

taSelect.addEventListener('change', () => {
    urlOutput.innerHTML = ''
    if (taSelect.value === '') return
    
    const newUrl = getUrl()
    urlOutput.appendChild(createUrlContainer(newUrl))
})

function getUrl(): string {
    const baseUrl = window.location.origin
    const ta = taSelect.value.toLowerCase()
    return baseUrl + `/calendar?ta=${ta.replace(/ /g, '+')}`
}

function createUrlContainer(url: string): HTMLElement {
    const container = document.createElement('span')
    container.className = 'calendar-url'

    const urlInput = document.createElement('input')
    urlInput.type = 'text'
    urlInput.disabled = true
    urlInput.ariaDisabled = 'true'
    urlInput.value = url
    container.appendChild(urlInput)

    const copyNotice = document.createElement('span')
    copyNotice.className = 'copy-notice'
    const innerCopyNotice = document.createElement('span')
    innerCopyNotice.className = 'no-select'
    innerCopyNotice.innerText = 'Copied!'
    copyNotice.appendChild(innerCopyNotice)
    container.appendChild(copyNotice)

    const copyButton = document.createElement('button')
    copyButton.className = 'copy-calendar-url'
    copyButton.onclick = () => {
        urlInput.select()
        urlInput.setSelectionRange(0, 99999) // For mobile devices

        navigator.clipboard.writeText(urlInput.value)

        copyNotice.classList.add('visible')
        setTimeout(() => {
            copyNotice.classList.remove('visible')
        }, 3000)
    }
    container.appendChild(copyButton)

    return container
}