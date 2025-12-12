export function announce(message: string) {
  const region = document.getElementById('aria-live-region')
  if (!region) {
    const div = document.createElement('div')
    div.id = 'aria-live-region'
    div.setAttribute('aria-live', 'polite')
    div.setAttribute('aria-atomic', 'true')
    div.style.position = 'absolute'
    div.style.clip = 'rect(0 0 0 0)'
    div.style.height = '1px'
    div.style.width = '1px'
    div.style.margin = '-1px'
    div.style.border = '0'
    div.style.padding = '0'
    document.body.appendChild(div)
    div.textContent = message
    return
  }
  region.textContent = message
}
