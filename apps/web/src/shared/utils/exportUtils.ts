export function fixHtml2CanvasColors(targetEl: HTMLElement): () => void {
  const allEls = targetEl.querySelectorAll('*')
  const styleBackups = new Map<HTMLElement, string | null>()

  const propsToFix = [
    'color',
    'background-color',
    'border-top-color',
    'border-right-color',
    'border-bottom-color',
    'border-left-color',
  ]

  allEls.forEach((rawEl) => {
    const el = rawEl as HTMLElement
    const computed = window.getComputedStyle(el)
    
    let needsFix = false
    const fixes: Record<string, string> = {}

    propsToFix.forEach((prop) => {
      const val = computed.getPropertyValue(prop)
      if (val && val.includes('color(srgb')) {
        needsFix = true
        fixes[prop] = val.replace(
          /color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)/g,
          (_, r, g, b, a) => {
            const R = Math.round(parseFloat(r) * 255)
            const G = Math.round(parseFloat(g) * 255)
            const B = Math.round(parseFloat(b) * 255)
            const A = a !== undefined ? parseFloat(a) : 1
            return `rgba(${R}, ${G}, ${B}, ${A})`
          }
        )
      }
    })

    if (needsFix) {
      styleBackups.set(el, el.getAttribute('style'))
      Object.entries(fixes).forEach(([prop, fixedVal]) => {
        el.style.setProperty(prop, fixedVal, 'important')
      })
    }
  })

  // Return a restore function
  return () => {
    styleBackups.forEach((prevStyle, el) => {
      if (prevStyle === null) {
        el.removeAttribute('style')
      } else {
        el.setAttribute('style', prevStyle)
      }
    })
  }
}
