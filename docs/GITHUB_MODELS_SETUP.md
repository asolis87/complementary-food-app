# GitHub Models Setup for GGA

> Guía para configurar GitHub Models como provider de IA para Gentleman Guardian Angel (GGA)

---

## 📋 Requisitos Previos

1. **GitHub Pro Subscription** — Tu cuenta debe tener suscripción Pro para acceder a GitHub Models
2. **Repositorio en GitHub** — El repo donde querés usar GGA
3. **Permisos de admin** — Para crear secrets en el repositorio

---

## 🔑 Paso 1: Generar GitHub Token (GH_TOKEN)

### Opción A: GitHub Settings (Recomendado)

1. Andá a **GitHub Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
   - URL: https://github.com/settings/tokens

2. Click en **"Generate new token (classic)"**

3. Completá:
   - **Note**: `GGA Code Review - complementary-food`
   - **Expiration**: `No expiration` (o 90 días si preferís rotar)
   - **Scopes** (marcar los siguientes):
     - ✅ `repo` — Full control of private repositories (incluye `contents:read`)
     - ✅ `read:org` — Read org membership (si el repo es de una organización)

4. Click en **"Generate token"** al final de la página

5. **Copiá el token inmediatamente** — No lo vas a poder ver de nuevo!
   - Formato: `ghp_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`

### Opción B: GitHub CLI (Alternativa)

Si tenés `gh` instalado:

```bash
gh auth token --scopes repo,read:org --note "GGA Code Review"
```

---

## 🔐 Paso 2: Agregar Secret al Repositorio

1. Andá a tu repositorio en GitHub: https://github.com/tu-usuario/complementary-food

2. Click en **Settings** (pestaña superior derecha)

3. En el sidebar izquierdo, click en **Secrets and variables** → **Actions**

4. Click en **"New repository secret"**

5. Completá:
   - **Name**: `GH_TOKEN`
   - **Secret**: Pegá el token que copiaste en el Paso 1

6. Click en **"Add secret"**

---

## ✅ Paso 3: Verificar Configuración

### Verificar que el secret existe

1. Volvé a **Settings** → **Secrets and variables** → **Actions**
2. Deberías ver `GH_TOKEN` en la lista de secrets (el valor está oculto)

### Verificar que GitHub Models está disponible

Con tu suscripción Pro, GitHub Models debería estar disponible automáticamente. Para verificar:

1. Andá a https://github.com/marketplace/models
2. Deberías ver modelos disponibles incluyendo **Claude Sonnet 4**

---

## 🚀 Paso 4: Probar GGA Localmente (Opcional)

Antes de confiar en CI, podés probar GGA localmente:

### Instalar GGA

```bash
# macOS / Linux
git clone https://github.com/Gentleman-Programming/gentleman-guardian-angel.git /tmp/gga
chmod +x /tmp/gga/bin/gga
echo 'export PATH="/tmp/gga/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Verificar instalación
gga version
```

### Configurar variables de entorno

```bash
# En tu terminal o .env local
export GH_TOKEN="ghp_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
```

### Ejecutar review manual

```bash
# Review de archivos staged
gga run

# Review de último commit
gga run --ci

# Review de PR (necesita estar en un PR real)
gga run --pr-mode
```

---

## 📊 Paso 5: Monitorear en CI

Una vez que abrís un PR a `staging`:

1. Andá a la pestaña **Actions** de tu repo
2. Deberías ver el workflow **"GGA Code Review"** corriendo
3. Click en el workflow para ver los logs
4. Si falla, revisá las violaciones reportadas por GGA

---

## ⚠️ Troubleshooting

### Error: "GitHub Models API unavailable"

**Causa**: Tu cuenta no tiene acceso a GitHub Models o el token no tiene permisos suficientes.

**Solución**:
1. Verificá que tenés suscripción Pro: https://github.com/settings/plans
2. Regenerá el token con los scopes correctos (`repo`, `read:org`)
3. Esperá 1-2 minutos después de crear el secret (GitHub tarda en propagar)

### Error: "RATE_LIMIT_EXCEEDED"

**Causa**: Excediste el límite de requests a GitHub Models.

**Solución**:
1. GitHub Models Pro tiene límites generosos, pero no ilimitados
2. Usá `--diff-only` para reducir tokens enviados
3. Excluí archivos innecesarios en `.gga` (`EXCLUDE_PATTERNS`)
4. Considerá usar otro provider si es frecuente (Claude, Gemini)

### Error: "STATUS: FAILED" sin violaciones claras

**Causa**: GGA detectó violaciones pero el output no es claro.

**Solución**:
1. Revisá los logs completos del workflow en GitHub Actions
2. Corré `gga run --verbose` localmente para más detalle
3. Ajustá las reglas en `AGENTS-GGA.md` si son muy estrictas

### Workflow timeout (10 minutos)

**Causa**: PR muy grande, la review tarda más de 10 minutos.

**Solución**:
1. Aumentá `timeout-minutes` en el workflow (máx 30)
2. Aumentá `TIMEOUT=900` en `.gga`
3. Dividí PRs grandes en PRs más pequeños (mejor práctica)

---

## 💰 Costos

Con **GitHub Pro** ($4 USD/mes):

- **GitHub Models**: Incluido con límites generosos
- **Límite exacto**: Ver https://github.com/settings/billing (sección "GitHub Models")
- **Excedente**: Si excedés el límite, se te cobra por token o se bloquea hasta el próximo mes

**Estimado por PR**:
- PR pequeño (<10 archivos): ~500-1000 tokens → $0.01-0.02
- PR mediano (10-50 archivos): ~2000-5000 tokens → $0.04-0.10
- PR grande (50+ archivos): ~10000+ tokens → $0.20+

**Recomendación**: Usá `--diff-only` y excluì tests para reducir costos.

---

## 📚 Recursos Adicionales

- **GGA Documentation**: https://github.com/Gentleman-Programming/gentleman-guardian-angel
- **GitHub Models**: https://github.com/marketplace/models
- **GitHub Tokens**: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens
- **GitHub Actions**: https://docs.github.com/en/actions

---

## ✅ Checklist Final

- [ ] Token generado con scopes `repo` y `read:org`
- [ ] Secret `GH_TOKEN` agregado al repositorio
- [ ] Archivo `.gga` configurado con `PROVIDER=github:claude-sonnet-4`
- [ ] Workflow `.github/workflows/gga-review.yml` creado
- [ ] PR de prueba abierto a `staging`
- [ ] Workflow corrió exitosamente (o falló como esperado)

---

**Última actualización**: 2026-04-22
**Versión**: 1.0.0
