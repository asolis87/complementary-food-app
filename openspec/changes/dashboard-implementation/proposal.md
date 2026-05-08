# Proposal: Dashboard Implementación de Pakulab

## Intent

Los usuarios de Pakulab actualmente ven una landing page sin valor tras iniciar sesión. Necesitamos proporcionarles un dashboard accionable que les muestre rápidamente dónde está su bebé en la alimentación complementaria, permitiendo registrar comidas, ver sugerencias, estar alertas de alérgenos y entender el balance nutricional.

## Scope

### In Scope
- Header de contexto (nombre, edad, días AC, plan)
- Sección de registros del día (desayuno, comida, cena) con edición rápida
- Sección de sugerencias de alimentos por edad
- Alertas de alérgenos pendientes
- Roadmap general por 5 categorías (Verduras, Frutas, Proteínas, Cereales, Grasas)
- Insight de balance Astringente/Laxante semanal con tips rotativos
- Endpoints en backend para proveer estos datos
- Componentes en frontend responsivo (Bento grid en desktop, stack en mobile)

### Out of Scope
- Métricas vanidosas y completitud total del roadmap a detalle en el dashboard
- Gestión de múltiples perfiles de bebés (se asume 1 seleccionado por defecto o gestionado por el header)
- Tips generados por IA (se usarán hardcoded basados en DB de alimentos)

## Capabilities

### New Capabilities
- `actionable-dashboard`: Presenta el resumen del día, sugerencias de alimentos, progreso en el roadmap, alertas de alérgenos y balance A/L a los usuarios autenticados.

### Modified Capabilities
- None

## Approach

Implementar un nuevo módulo `dashboard` en `apps/api` con un controlador y servicio que agregue información de `diary`, `foods` y `allergens`. En `apps/web`, crear el módulo `dashboard` (o integrarlo a `home`) con los componentes UI requeridos siguiendo el diseño en Stitch (Bento grid para desktop, stack vertical para mobile). Reutilizaremos `FoodChip` y `ProgressBar`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `apps/api/src/modules/dashboard` | New | Módulo que agrupa la lógica de los widgets del dashboard |
| `apps/web/src/modules/dashboard` | New | Vistas y componentes del dashboard |
| `apps/web/src/modules/diary` | Modified | Añadir `FoodRegistrationModal` para registros desde el dashboard |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Performance del endpoint al agregar múltiples fuentes | Medium | Cachear resultados a nivel de repositorio/servicio o en frontend, consolidar queries donde sea posible |
| Complejidad del Bento Grid en frontend | Low | Usar CSS Grid moderno y fallar elegantemente a flexbox/stack en mobile |
| Data inconsistency en Insight A/L | Low | Depender estrictamente de las propiedades hardcodeadas en la DB de alimentos para generar los tips rotativos |

## Rollback Plan

Mantener la ruta de la landing page existente accesible temporalmente. Ocultar el nuevo componente dashboard bajo un feature flag en el frontend o revertir los commits si ocurre una falla crítica, regresando al componente Home/Landing original.

## Dependencies

- Diseños de Stitch (ya validados)
- Módulos existentes en API: `foods`, `diary`, `profiles`, `allergens`

## Success Criteria

- [ ] El dashboard carga en < 2 segundos
- [ ] Los 6 widgets renderizan correctamente datos reales
- [ ] Es posible registrar una comida en 1-click desde la card de Registros de Hoy
- [ ] El grid se adapta correctamente a mobile, tablet y desktop