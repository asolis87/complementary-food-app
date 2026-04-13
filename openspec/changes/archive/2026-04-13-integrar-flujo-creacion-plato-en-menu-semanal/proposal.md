# Proposal: Integrar flujo de creación de plato en menú semanal

## Intent

Permitir a los usuarios crear un nuevo plato directamente desde el planificador del menú semanal sin perder el contexto, y asignar un plato recién creado al menú directamente desde el creador de platos. Esto reduce la fricción actual de 7+ pasos a un flujo integrado y bidireccional.

## Scope

### In Scope
- Extraer la lógica del creador de platos a un composable `usePlateBuilder.ts`.
- Crear un componente `PlateBuilderDrawer` tipo slide-over que use el nuevo composable.
- Refactorizar `PlateBuilderPage` para usar el composable `usePlateBuilder.ts`.
- Integrar un botón "Crear plato nuevo" en el selector de menú que abra el drawer.
- Implementar asignación automática al guardar desde el drawer al slot activo del menú.
- Implementar opción en el creador de platos (página) para asignar el plato a un slot de comida.

### Out of Scope
- Rediseñar completamente la página `MenuWeekPage.vue` (solo se añadirá la llamada al drawer).
- Modificar el modelo de datos de Base de Datos.
- Cambios en el flujo de búsqueda de alimentos (`FoodSearchModal.vue`).

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- `weekly-menu`: Añadir creación de platos inline mediante el drawer.
- `plate-builder`: Añadir asignación directa al menú tras guardar.

## Approach

1. **Composable Extraction**: Extraer el estado y lógica de `PlateBuilderPage` a `usePlateBuilder.ts` para que pueda ser consumido tanto por la vista de página como por el drawer.
2. **Slide-over Drawer**: Crear `PlateBuilderDrawer` que se renderizará casi a pantalla completa en móviles, consumiendo el composable.
3. **Menu Integration**: Desde el picker de platos en el menú semanal, lanzar el drawer al hacer clic en "Crear plato nuevo". Al completarse, el plato se guarda y se asigna automáticamente al `MenuMeal` correspondiente.
4. **Builder Integration**: En la vista tradicional del builder, añadir una acción para asignar el plato recién guardado a un día/comida del menú semanal.
5. **Cache Refresh**: Asegurar que `menuStore` se actualice con el nuevo plato creado para evitar staleness.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `@pakulab/web/src/composables/usePlateBuilder.ts` | New | Lógica extraída de creación de platos |
| `@pakulab/web/src/components/PlateBuilderDrawer.vue` | New | Interfaz slide-over para creación inline |
| `@pakulab/web/src/pages/PlateBuilderPage.vue` | Modified | Refactorizado para usar el composable y añadir opción de asignación |
| `@pakulab/web/src/pages/MenuWeekPage.vue` | Modified | Integración del drawer y botón de creación |
| `@pakulab/web/src/stores/plateStore.ts` | Modified | Prevención de colisiones en `draftItems` |
| `@pakulab/web/src/stores/menuStore.ts` | Modified | Actualización de caché tras creación inline |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Colisión de estado en `plateStore.draftItems` al ser un singleton | Med | Mover el estado de borrador al composable o instanciarlo por contexto. |
| Experiencia de usuario en móviles con el drawer | High | Diseñar el drawer para que tome casi toda la pantalla en resoluciones pequeñas, asegurando que `FoodSearchModal` funcione correctamente sobre él. |
| Caché desactualizada en `menuStore` | Low | Disparar una recarga de los platos guardados o actualizar el store localmente tras la respuesta exitosa del API. |
| Complejidad añadida a `MenuWeekPage.vue` (ya >2200 líneas) | High | Mantener la lógica del drawer encapsulada y emitir eventos simples hacia la página. |

## Rollback Plan

- Revertir los commits de frontend. Como no hay cambios en el modelo de datos (`@pakulab/api` o Prisma), el rollback es 100% seguro a nivel de UI.

## Dependencies

- Vue 3 + Pinia (existente)
- Componente de Drawer/Modal de la librería de UI actual.

## Success Criteria

- [ ] Un usuario puede crear y asignar un plato desde el menú semanal sin navegar fuera de la página.
- [ ] Un usuario puede crear un plato en la página del builder y asignarlo inmediatamente al menú.
- [ ] La funcionalidad existente de `PlateBuilderPage` se mantiene intacta.
- [ ] El menú refleja inmediatamente los platos recién creados y asignados.
