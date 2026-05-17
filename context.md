# Code Context — Plate Export Download Bug

## Files Retrieved
1. `apps/web/src/modules/plates/PlateBuilderPage.vue` (lines 373–499) — `handleExport`, `onExportDone`, template for `<PlateExport>` slot wiring
2. `apps/web/src/modules/plates/components/PlateExport.vue` (lines 1–120) — `capture()` method, DOM structure, CSS hiding strategy
3. `apps/web/src/modules/plates/components/PlateActions.vue` (lines 1–100) — export button emission
4. `apps/web/src/modules/plates/components/PlateVisualization.vue` (lines 1–220) — rendered inside export frame, uses `<img>` with `/images/plate/*.png` and `color-mix()` CSS
5. `apps/web/src/modules/menus/components/MenuExportFrame.vue` (lines 1–185) — **working** export pattern for comparison
6. `apps/web/src/modules/menus/MenuWeekPage.vue` (lines 1490–1540) — **working** download handler for comparison
7. `apps/web/src/modules/plates/PlateDetailPage.vue` (lines 325–360) — another export using `useCORS: true`
8. `apps/web/vite.config.ts` (lines 1–120) — PWA service worker config
9. `apps/web/public/images/plate/` — fruits.png (386KB), cereals.png (415KB), vegetables.png (472KB) — all exist

## Full Pipeline Trace

```
User clicks "Exportar"
  → PlateActions @click → emit('export')
  → PlateBuilderPage.handleExport()
    → exporting = true
    → await exportRef.value.capture()  [PlateExport.capture()]
      → exportRef.value check (DOM element .export-frame)
      → await import('html2canvas')
      → exportRef.style.opacity = '1'   (was 0)
      → await setTimeout(50ms)
      → await html2canvas(exportRef.value, { scale:2, background:'#fff', logging:false })
      → exportRef.style.opacity = '0'
      → dataUrl = canvas.toDataURL('image/png')
      → emit('done', dataUrl)
        → PlateBuilderPage.onExportDone(dataUrl)
          → link = document.createElement('a')
          → link.href = dataUrl
          → link.download = `${draftName}-pakulab.png`
          → document.body.appendChild(link)
          → link.click()           ← DOWNLOAD SHOULD HAPPEN HERE
          → document.body.removeChild(link)
          → showToast('Imagen descargada', 'success')
    → exporting = false
```

**User observes:** "Exportando..." → "Imagen descargada" toast → **no download starts**.

This means the code reaches `link.click()`, no exception is caught, the success toast fires — but the browser doesn't trigger a file download.

## Root Cause Analysis (ordered by probability)

### 🔴 PRIMARY SUSPECT: `opacity: 0` + `z-index: -1` causes blank/invalid canvas

The export container uses a fundamentally different hiding strategy from every other export in the project:

| Component | Hiding Strategy | Works? |
|-----------|----------------|--------|
| `PlateExport.vue` | `opacity: 0` on frame + `z-index: -1` on container | ❌ |
| `MenuExportFrame.vue` | `position: fixed; top: -9999px` off-screen | ✅ |
| `PlateDetailPage.vue` | captures visible DOM directly | ✅ |
| `exportDayPdf.ts` | `position: absolute; left: -9999px` | ✅ |

**How this causes the bug:**

`html2canvas` computes styles via `window.getComputedStyle()`. The export container (`.export-container`) has:
```css
.export-container {
  position: absolute;
  left: 0; top: 0;
  width: 100%;
  z-index: -1;          /* ← Behind all page content */
  pointer-events: none;
}
```

The `.export-frame` (the captured element) has `opacity: 0` which gets toggled to `1` at capture time. BUT the parent `.export-container` is still `z-index: -1`, placing the entire export subtree behind `.page-main` and `.content-area`. When `html2canvas` tries to render this element:

1. **Chrome may report computed dimensions as zero**: Elements with `z-index: -1` behind other content may have their layout optimized away by the browser rendering engine. The `offsetHeight`/`offsetWidth` could report 0.
2. **Images may not load**: The `<img>` elements inside the hidden PlateVisualization have `src="/images/plate/*.png"`. While images normally load regardless of CSS, the combination of `z-index: -1` parent + `opacity: 0` on the direct element + being behind a full-page layout may prevent image decoding.
3. **Result**: `html2canvas` produces a canvas of 0×0 pixels (or a blank white canvas). `canvas.toDataURL()` returns a valid but meaningless data URL. `link.click()` is called with this URL. The browser either:
   - Downloads a tiny blank file (user doesn't notice)
   - Or silently ignores the navigation to an effectively empty data URL

**Evidence:** The PlateDetailPage export (captures visible `.plate-detail-page`) and MenuExportFrame (uses off-screen positioning, NOT opacity/z-index) both work. The opacity/z-index strategy is unique to PlateExport and is the only export that fails.

### 🟡 SECONDARY: Missing `useCORS: true`

**Every other html2canvas call in the project uses `useCORS: true`:**

| File | `useCORS` |
|------|-----------|
| `PlateExport.vue` | ❌ MISSING |
| `PlateDetailPage.vue` | ✅ `true` |
| `MenuExportFrame.vue` | ✅ `true` |
| `exportDayPdf.ts` | ✅ `true` |
| `exportWeekPdf.ts` | ✅ `true` |

While same-origin images (`/images/plate/*.png`) shouldn't require `useCORS`, the project has an active service worker (vite-plugin-pwa) with `CacheFirst` strategy for images:
```typescript
urlPattern: /\.(png|svg|jpg|jpeg|webp|woff2|woff|ttf)$/,
handler: 'CacheFirst',
```
The service worker may serve cached image responses that `html2canvas` interprets differently from same-origin, causing internal taint tracking. Without `useCORS`, html2canvas may skip rendering images that the SW served from cache.

### 🟡 TERTIARY: `color-mix()` CSS is not supported by html2canvas v1.4.1

`PlateVisualization.vue` uses CSS `color-mix()` extensively:
```css
.segment-fruit {
  background-color: color-mix(in srgb, var(--md3-primary-container) 20%, transparent);
}
```

html2canvas v1.4.1 does not support `color-mix()` (CSS Color Level 5). It will fall back to `transparent` for these background colors. While this doesn't prevent the download, it means the exported image will have blank segment backgrounds — degrading export quality.

### 🟢 UNLIKELY: Async boundary breaks user gesture

The download `link.click()` happens inside `onExportDone`, which is called synchronously via `emit('done')` from within the async `capture()`. While some browsers (Safari) require user gestures for programmatic downloads, Chrome does not block `data:` URL downloads via `<a download>` even across async boundaries. MenuWeekPage uses the exact same emit pattern and presumably works.

### 🟢 UNLIKELY: CSP blocking

No Content-Security-Policy headers or `<meta>` tags exist. No CSP blocking.

## Architecture: Export Strategy Comparison

**Working pattern (MenuExportFrame):**
```
.export-frame {
  position: fixed;
  top: -9999px;
  left: -9999px;
  /* Element is fully rendered, just off-screen */
  /* html2canvas renders it perfectly */
}
```

**Broken pattern (PlateExport):**
```
.export-container {
  position: absolute;
  z-index: -1;      /* Behind EVERYTHING */
}
.export-frame {
  opacity: 0;       /* Temporarily toggled to 1 */
}
/* Element exists at top:0, left:0, behind page content */
/* html2canvas may get zero dimensions or blank rendering */
```

## Start Here

Open `apps/web/src/modules/plates/components/PlateExport.vue` — this file needs two fixes:

1. **Change hiding strategy from `opacity: 0` + `z-index: -1` to off-screen positioning** (like MenuExportFrame). Remove the opacity toggle logic from `capture()` since it won't be needed.

2. **Add `useCORS: true`** to the html2canvas options (line 99–104), matching all other exports in the project.

The capture function should look like:
```typescript
async function capture(): Promise<void> {
  if (!exportRef.value) {
    emit('error', 'Elemento de exportación no disponible')
    return
  }
  try {
    const { default: html2canvas } = await import('html2canvas')
    const canvas = await html2canvas(exportRef.value, {
      scale: 2,
      useCORS: true,          // ← ADD
      backgroundColor: '#ffffff',
      logging: false,
    })
    const dataUrl = canvas.toDataURL('image/png')
    emit('done', dataUrl)
  } catch (err) {
    emit('error', err instanceof Error ? err.message : 'Error al exportar')
  }
}
```

And the CSS for `.export-container` should use off-screen positioning:
```css
.export-container {
  position: fixed;
  top: -9999px;
  left: -9999px;
  width: 400px;
}
.export-frame {
  /* Remove opacity: 0 — always fully rendered */
  opacity: 1;
}
```

## Additional Recommendation

Add error logging to `onExportDone` in PlateBuilderPage.vue (line 489–498) so future failures are detectable:

```typescript
function onExportDone(dataUrl: string) {
  try {
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `${draftName.value || 'plato'}-pakulab.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast('Imagen descargada', 'success')
  } catch (err) {
    console.error('[export] download failed:', err)
    showToast('Error al descargar la imagen', 'error')
  }
}
```
