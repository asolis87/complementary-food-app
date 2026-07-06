<template>
  <TierGate required-tier="PRO" feature-name="Menú Semanal">
    <div class="menu-page">

      <!-- ─── Empty state: no baby profile ─── -->
      <div v-if="!hasProfile && !profilesLoading" class="no-profile-state">
        <span class="material-symbols-outlined no-profile-state__icon" aria-hidden="true">child_care</span>
        <h2 class="no-profile-state__title">Primero crea un perfil de bebé</h2>
        <p class="no-profile-state__text">
          Para planificar el menú semanal necesitas tener un perfil de bebé.
          Crea uno desde tu perfil y regresa aquí.
        </p>
        <RouterLink to="/profile" class="no-profile-state__btn">
          <span class="material-symbols-outlined" aria-hidden="true">person_add</span>
          Ir a mi perfil
        </RouterLink>
      </div>

      <!-- ─── Loading profiles ─── -->
      <div v-else-if="profilesLoading" class="menu-loading">
        <span class="menu-loading__spinner" aria-hidden="true" />
        <p>Cargando perfiles...</p>
      </div>

      <!-- ─── Main content (requires profile) ─── -->
      <template v-else>

      <!-- ─── Header ─── -->
      <header class="menu-header">
        <div class="menu-header__titles">
          <h1 class="menu-header__title">Menú Semanal</h1>
          <p class="menu-header__subtitle">Planifica la alimentación de tu bebé</p>
        </div>
        <div class="menu-header__actions">
          <button
            class="preview-btn"
            :class="{ 'preview-btn--active': previewMode }"
            aria-label="Previsualizar menú"
            @click="previewMode = !previewMode"
          >
            <span class="material-symbols-outlined" aria-hidden="true">
              {{ previewMode ? 'edit_calendar' : 'visibility' }}
            </span>
            <span class="preview-btn__label">{{ previewMode ? 'Editar' : 'Vista previa' }}</span>
          </button>
          <button
            class="export-btn"
            :disabled="isExporting"
            :aria-label="isExporting ? 'Exportando menú...' : 'Exportar menú semanal'"
            @click="handleExport"
          >
            <span
              v-if="isExporting"
              class="export-btn__spinner"
              aria-hidden="true"
            />
            <template v-else>
              <span class="material-symbols-outlined" aria-hidden="true">download</span>
              <span class="export-btn__label">Exportar</span>
            </template>
          </button>
          <div class="week-nav">
            <button class="week-nav__btn" aria-label="Semana anterior" @click="prevWeek">
              <span class="material-symbols-outlined" aria-hidden="true">chevron_left</span>
            </button>
            <span class="week-nav__label">{{ weekLabel }}</span>
            <button class="week-nav__btn" aria-label="Semana siguiente" @click="nextWeek">
              <span class="material-symbols-outlined" aria-hidden="true">chevron_right</span>
            </button>
          </div>
        </div>
      </header>

      <!-- ─── Desktop: 7-column grid ─── -->
      <div v-show="!previewMode" class="week-grid" role="grid" :aria-label="`Menú semana del ${weekLabel}`">
        <div
          v-for="day in weekDays"
          :key="day.key"
          class="day-column"
          :class="{ 'day-column--today': day.isToday }"
          role="gridcell"
        >
          <!-- Day header -->
          <div class="day-header">
            <span class="day-header__name">{{ day.shortName }}</span>
            <span class="day-header__date" :class="{ 'day-header__date--today': day.isToday }">
              {{ day.dayNumber }}
            </span>
          </div>

          <!-- Meal slots -->
          <div class="meal-slots">
          <div
            v-for="meal in MEALS"
            :key="meal.key"
            class="meal-slot"
            :class="[`meal-slot--${meal.key}`, { 'meal-slot--loading': menuStore.isSlotLoading(day.key, meal.key) }]"
            :data-slot="`${day.key}:${meal.key}`"
          >
              <span class="meal-slot__label">
                <span class="material-symbols-outlined meal-slot__icon" aria-hidden="true">{{ meal.icon }}</span>
                {{ meal.name }}
              </span>

              <!-- Assigned plate -->
              <template v-if="getAssignedPlate(day.key, meal.key)">
                <div
                  class="plate-chip"
                  :class="{ 'plate-chip--loading': menuStore.isSlotLoading(day.key, meal.key) }"
                  :data-chip="`${day.key}:${meal.key}`"
                  @mouseenter="showTooltip(day.key, meal.key)"
                  @mouseleave="hideTooltip"
                >
                  <span
                    class="plate-chip__score"
                    :class="scoreClass(getAssignedPlate(day.key, meal.key)!)"
                    :title="scoreTooltip(getAssignedPlate(day.key, meal.key)!)"
                  >
                    <span class="material-symbols-outlined plate-chip__score-icon" aria-hidden="true">
                      {{ scoreIcon(getAssignedPlate(day.key, meal.key)!) }}
                    </span>
                  </span>
                  <span class="plate-chip__name">{{ getAssignedPlate(day.key, meal.key)!.name }}</span>
                  <div class="plate-chip__actions">
                    <button
                      class="plate-chip__serve"
                      :class="{ 'plate-chip__serve--served': menuStore.getServedAt(day.key, meal.key) }"
                      :title="menuStore.getServedAt(day.key, meal.key) ? 'Servido ✓' : 'Registrar comida'"
                      :disabled="menuStore.isServeLoading(day.key, meal.key)"
                      @click.stop="handleServeClick(day.key, meal.key)"
                    >
                      <span v-if="menuStore.isServeLoading(day.key, meal.key)" class="plate-chip__serve-spinner" />
                      <span v-else class="material-symbols-outlined" aria-hidden="true">
                        {{ menuStore.getServedAt(day.key, meal.key) ? 'check_circle' : 'restaurant' }}
                      </span>
                    </button>
                    <button
                      class="plate-chip__remove"
                      :aria-label="`Quitar ${getAssignedPlate(day.key, meal.key)!.name}`"
                      @click.stop="removePlate(day.key, meal.key)"
                    >
                      <span class="material-symbols-outlined" aria-hidden="true">close</span>
                    </button>
                  </div>
                </div>
              </template>

              <!-- Empty slot -->
              <template v-else>
                <button
                  class="add-slot-btn"
                  :class="{ 'add-slot-btn--loading': menuStore.isSlotLoading(day.key, meal.key) }"
                  :aria-label="`Agregar plato a ${meal.name} del ${day.name}`"
                  :disabled="menuStore.isSlotLoading(day.key, meal.key)"
                  @click="openPicker(day.key, meal.key)"
                >
                  <span v-if="menuStore.isSlotLoading(day.key, meal.key)" class="slot-spinner" aria-hidden="true" />
                  <span v-else class="material-symbols-outlined" aria-hidden="true">add</span>
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- ─── Desktop: Preview mode (compact snapshot) ─── -->
      <div v-show="previewMode" class="preview-grid" role="grid" aria-label="Vista previa del menú semanal">
        <!-- Column headers -->
        <div class="preview-grid__corner" />
        <div
          v-for="day in weekDays"
          :key="`ph-${day.key}`"
          class="preview-grid__day-header"
          :class="{ 'preview-grid__day-header--today': day.isToday }"
        >
          <span class="preview-grid__day-name">{{ day.shortName }}</span>
          <span class="preview-grid__day-number" :class="{ 'preview-grid__day-number--today': day.isToday }">
            {{ day.dayNumber }}
          </span>
        </div>

        <!-- Meal rows -->
        <template v-for="meal in MEALS" :key="`pm-${meal.key}`">
          <div class="preview-grid__meal-label" :class="`preview-grid__meal-label--${meal.key}`">
            <span class="material-symbols-outlined" aria-hidden="true">{{ meal.icon }}</span>
            {{ meal.name }}
          </div>
          <div
            v-for="day in weekDays"
            :key="`pv-${day.key}-${meal.key}`"
            class="preview-grid__cell"
            :class="{
              'preview-grid__cell--today': day.isToday,
              'preview-grid__cell--empty': !getAssignedPlate(day.key, meal.key),
              'preview-grid__cell--served': !!menuStore.getServedAt(day.key, meal.key)
            }"
          >
            <template v-if="getAssignedPlate(day.key, meal.key)">
              <div class="preview-grid__cell-header">
                <span
                  class="preview-grid__score-dot"
                  :class="scoreClass(getAssignedPlate(day.key, meal.key)!)"
                />
                <span class="preview-grid__plate-name">
                  {{ getAssignedPlate(day.key, meal.key)!.name }}
                </span>
                <span
                  v-if="menuStore.getServedAt(day.key, meal.key)"
                  class="material-symbols-outlined preview-grid__served-icon"
                  aria-hidden="true"
                >check_circle</span>
              </div>
               <ul v-if="menuStore.getSlotFoods(day.key, meal.key).length > 0" class="preview-grid__foods">
                 <li
                   v-for="item in menuStore.getSlotFoods(day.key, meal.key)"
                   :key="item.foodId"
                   class="preview-grid__food-item"
                 >
                    <span
                      class="preview-grid__food-dot"
                      :class="`preview-grid__food-dot--${item.food?.alClassification?.toLowerCase() ?? 'neutral'}`"
                    />
                    <span class="preview-grid__food-name">{{ item.food?.name ?? 'Alimento' }} <WarningBadge v-if="item.food" :tags="item.food.warningTags ?? []" /></span>
                    <!-- Compact exposure indicator after name -->
                    <span
                      class="preview-grid__exposure-mark"
                      :class="exposureDotClass(timesOfferedByFoodId[item.foodId] ?? null)"
                      :title="exposureDotTitle(timesOfferedByFoodId[item.foodId] ?? null)"
                    />
                 </li>
               </ul>
             </template>
             <span v-else class="preview-grid__empty-dash">—</span>
           </div>
         </template>
       </div>

       <!-- Tooltip for desktop food list -->
       <Teleport to="body">
         <Transition name="tooltip-fade">
           <div
             v-if="tooltip.visible && tooltip.content"
             class="food-tooltip"
             :style="{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }"
             role="tooltip"
           >
             <div class="food-tooltip__title">Alimentos</div>
             <ul class="food-tooltip__list">
               <li
                 v-for="item in tooltip.content"
                 :key="item.foodId"
                 class="food-tooltip__item"
               >
                 <span
                   class="food-tooltip__dot"
                   :class="`food-tooltip__dot--${item.food?.alClassification?.toLowerCase() ?? 'neutral'}`"
                 />
                 <span class="food-tooltip__name">{{ item.food?.name ?? 'Alimento' }}</span>
                 <FoodExposureBadge
                   v-if="item.foodId && timesOfferedByFoodId[item.foodId] !== undefined"
                   :times-offered="timesOfferedByFoodId[item.foodId] ?? null"
                   size="sm"
                 />
                 <span class="food-tooltip__al">
                   {{ getALLabel(item.food?.alClassification) }}
                 </span>
               </li>
             </ul>
           </div>
          </Transition>
        </Teleport>

        <!-- ─── Mobile: Day tabs + selected day detail ─── -->
      <div class="mobile-view" role="region" aria-label="Vista móvil del menú semanal">
        <!-- Day tabs -->
        <div class="day-tabs" role="tablist">
          <button
            v-for="day in weekDays"
            :key="day.key"
            class="day-tab"
            :class="{ 'day-tab--active': selectedDayKey === day.key, 'day-tab--today': day.isToday }"
            role="tab"
            :aria-selected="selectedDayKey === day.key"
            :aria-controls="`day-panel-${day.key}`"
            @click="selectedDayKey = day.key"
          >
            <span class="day-tab__short">{{ day.shortName }}</span>
            <span class="day-tab__number" :class="{ 'day-tab__number--today': day.isToday }">
              {{ day.dayNumber }}
            </span>
          </button>
        </div>

        <!-- Selected day meals -->
        <div
          v-for="day in weekDays"
          :key="`panel-${day.key}`"
          :id="`day-panel-${day.key}`"
          class="day-panel"
          role="tabpanel"
          :hidden="selectedDayKey !== day.key"
        >
          <div
            v-for="meal in MEALS"
            :key="meal.key"
            class="meal-row"
            :class="`meal-row--${meal.key}`"
          >
            <div class="meal-row__meta">
              <span class="material-symbols-outlined meal-row__icon" aria-hidden="true">{{ meal.icon }}</span>
              <span class="meal-row__name">{{ meal.name }}</span>
            </div>

            <!-- Assigned plate -->
            <template v-if="getAssignedPlate(day.key, meal.key)">
              <div class="mobile-plate-container">
                <!-- Plate name row with inline serve -->
                <div class="plate-row-chip" :class="{ 'plate-row-chip--loading': menuStore.isSlotLoading(day.key, meal.key) }">
                  <span class="plate-row-chip__score" :class="scoreClass(getAssignedPlate(day.key, meal.key)!)">
                    <span class="material-symbols-outlined" aria-hidden="true">
                      {{ scoreIcon(getAssignedPlate(day.key, meal.key)!) }}
                    </span>
                  </span>
                  <span class="plate-row-chip__name">{{ getAssignedPlate(day.key, meal.key)!.name }}</span>
                  <button
                    class="plate-row-chip__serve"
                    :class="{ 'plate-row-chip__serve--served': menuStore.getServedAt(day.key, meal.key) }"
                    :disabled="isServeDisabled(day.key, meal.key)"
                    :title="getServeTooltip(day.key, meal.key)"
                    @click.stop="handleServeClick(day.key, meal.key)"
                  >
                    <span v-if="menuStore.isServeLoading(day.key, meal.key)" class="plate-row-chip__serve-spinner" />
                    <span v-else class="material-symbols-outlined" aria-hidden="true">
                      {{ menuStore.getServedAt(day.key, meal.key) ? 'check_circle' : 'restaurant' }}
                    </span>
                  </button>
                  <button
                    class="plate-row-chip__remove"
                    :aria-label="`Quitar ${getAssignedPlate(day.key, meal.key)!.name}`"
                    @click="removePlate(day.key, meal.key)"
                  >
                    <span class="material-symbols-outlined" aria-hidden="true">close</span>
                  </button>
                </div>
                <!-- Food summary line -->
                <div v-if="getSlotFoods(day.key, meal.key).length > 0" class="food-summary">
                  <template v-for="(item, idx) in getSlotFoods(day.key, meal.key)" :key="item.foodId">
                    <span v-if="idx > 0" class="food-summary__sep">·</span>
                    <span
                      class="food-summary__dot"
                      :class="`food-summary__dot--${item.food?.alClassification?.toLowerCase() ?? 'neutral'}`"
                    />
                    <span class="food-summary__name">{{ item.food?.name ?? 'Alimento' }} <WarningBadge v-if="item.food" :tags="item.food.warningTags ?? []" /></span>
                    <!-- Compact exposure indicator (dot) for mobile summary -->
                    <span
                      v-if="item.foodId && timesOfferedByFoodId[item.foodId] !== undefined"
                      class="food-summary__exposure-dot"
                      :class="exposureDotClass(timesOfferedByFoodId[item.foodId] ?? null)"
                      :title="exposureDotTitle(timesOfferedByFoodId[item.foodId] ?? null)"
                    />
                  </template>
                </div>
              </div>
            </template>

            <!-- Empty row slot -->
            <template v-else>
              <button
                class="add-row-btn"
                :class="{ 'add-row-btn--loading': menuStore.isSlotLoading(day.key, meal.key) }"
                :aria-label="`Agregar plato a ${meal.name}`"
                :disabled="menuStore.isSlotLoading(day.key, meal.key)"
                @click="openPicker(day.key, meal.key)"
              >
                <span v-if="menuStore.isSlotLoading(day.key, meal.key)" class="slot-spinner" aria-hidden="true" />
                <template v-else>
                  <span class="material-symbols-outlined" aria-hidden="true">add_circle</span>
                  Agregar plato
                </template>
              </button>
            </template>
          </div>
        </div>
      </div>

      <!-- ─── Weekly Summary ─── -->
      <section class="summary-section" aria-label="Resumen semanal">
        <h2 class="summary-title">
          <span class="material-symbols-outlined summary-title__icon" aria-hidden="true">bar_chart</span>
          Resumen Semanal
        </h2>
        <div class="summary-grid">
          <div class="summary-card summary-card--balanced">
            <span class="summary-card__value">{{ weekStats.balanced }}</span>
            <span class="material-symbols-outlined summary-card__icon" aria-hidden="true">check_circle</span>
            <span class="summary-card__label">Equilibrado</span>
          </div>
          <div class="summary-card summary-card--total">
            <span class="summary-card__value">{{ weekStats.total }}</span>
            <span class="material-symbols-outlined summary-card__icon" aria-hidden="true">restaurant</span>
            <span class="summary-card__label">Platos planificados</span>
          </div>
          <div class="summary-card summary-card--empty">
            <span class="summary-card__value">{{ weekStats.empty }}</span>
            <span class="material-symbols-outlined summary-card__icon" aria-hidden="true">event_busy</span>
            <span class="summary-card__label">Sin planificar</span>
          </div>
        </div>
      </section>

      <!-- ─── Plate Picker Dialog ─── -->
      <Teleport to="body">
        <Transition name="dialog-fade">
          <div
            v-if="picker.open"
            class="dialog-backdrop"
            role="presentation"
            @click.self="closePicker"
          >
            <div
              class="dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="picker-title"
            >
              <div class="dialog__header">
                <h3 id="picker-title" class="dialog__title">Elegir plato</h3>
                <button class="dialog__close" aria-label="Cerrar" @click="closePicker">
                  <span class="material-symbols-outlined" aria-hidden="true">close</span>
                </button>
              </div>

              <!-- Loading -->
              <div v-if="plateStore.loading" class="picker-loading">
                <div class="picker-spinner" aria-hidden="true" />
                <span>Cargando platos...</span>
              </div>

              <!-- Empty plates -->
              <div v-else-if="plateStore.savedPlates.length === 0" class="picker-empty">
                <span class="material-symbols-outlined picker-empty__icon" aria-hidden="true">no_meals</span>
                <p>No tienes platos guardados todavía.</p>
                <button class="picker-empty__link" @click="openPlateDrawer">Crear un plato</button>
              </div>

              <!-- Plate list -->
              <ul v-else class="picker-list" role="listbox" :aria-label="`Platos disponibles`">
                <li
                  v-for="plate in plateStore.savedPlates"
                  :key="plate.id"
                  class="picker-item"
                  :class="{ 'picker-item--expanded': expandedPlateId === plate.id }"
                  role="option"
                  :aria-selected="false"
                  :aria-expanded="expandedPlateId === plate.id"
                >
                  <div class="picker-item__header" @click="togglePlatePreview(plate.id)">
                    <span class="picker-item__score" :class="scoreClass(plate)">
                      <span class="material-symbols-outlined" aria-hidden="true">{{ scoreIcon(plate) }}</span>
                    </span>
                    <span class="picker-item__name">{{ plate.name }}</span>
                    <span class="picker-item__meta">
                      {{ plate.items?.length ?? 0 }} alimentos
                    </span>
                    <span
                      class="material-symbols-outlined picker-item__arrow"
                      :class="{ 'picker-item__arrow--open': expandedPlateId === plate.id }"
                      aria-hidden="true"
                    >expand_more</span>
                  </div>

                  <!-- Expanded: food list + select button -->
                  <div v-if="expandedPlateId === plate.id" class="picker-item__detail">
                    <ul v-if="plate.items?.length" class="picker-food-list">
                      <li
                        v-for="item in plate.items"
                        :key="item.id"
                        class="picker-food-item"
                      >
                        <span
                          class="picker-food-item__dot"
                          :class="`picker-food-item__dot--${item.food?.alClassification?.toLowerCase() ?? 'neutral'}`"
                        />
                        <span class="picker-food-item__name">{{ item.food?.name ?? 'Alimento' }}</span>
                        <FoodExposureBadge
                          v-if="item.foodId && timesOfferedByFoodId[item.foodId] !== undefined"
                          :times-offered="timesOfferedByFoodId[item.foodId] ?? null"
                          size="sm"
                        />
                        <span class="picker-food-item__group">{{ formatGroup(item.groupAssignment) }}</span>
                      </li>
                    </ul>
                    <p v-else class="picker-food-empty">Sin alimentos</p>
                    <button class="picker-select-btn" @click="assignPlate(plate)">
                      <span class="material-symbols-outlined" aria-hidden="true">check</span>
                      Seleccionar plato
                    </button>
                  </div>
                </li>
                <li class="picker-create-item">
                  <button class="picker-create-btn" @click="openPlateDrawer">
                    <span class="material-symbols-outlined" aria-hidden="true">add_circle</span>
                    Crear plato nuevo
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- ─── Re-serve Confirmation Dialog ─── -->
      <Teleport to="body">
        <Transition name="dialog-fade">
          <div
            v-if="reServeDialog.open"
            class="dialog-backdrop"
            role="presentation"
            @click.self="closeReServeDialog"
          >
            <div
              class="dialog dialog--confirm"
              role="dialog"
              aria-modal="true"
              aria-labelledby="confirm-title"
              aria-describedby="confirm-desc"
            >
              <div class="dialog__header dialog__header--confirm">
                <span class="material-symbols-outlined dialog__confirm-icon" aria-hidden="true">warning</span>
                <h3 id="confirm-title" class="dialog__title">¿Registrar de nuevo?</h3>
              </div>

              <div class="dialog__body">
                <p id="confirm-desc" class="dialog__text">
                  ¿Quieres registrar de nuevo? Esto reemplazará las entradas anteriores.
                </p>
              </div>

              <div class="dialog__actions">
                <button class="dialog__btn dialog__btn--secondary" @click="closeReServeDialog">
                  Cancelar
                </button>
                <button class="dialog__btn dialog__btn--primary" @click="confirmReServe">
                  Sí, registrar
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- ─── First-serve Confirmation Dialog (UX-4) ─── -->
      <Teleport to="body">
        <Transition name="dialog-fade">
          <div
            v-if="firstServeDialog.open"
            class="dialog-backdrop"
            role="presentation"
            @click.self="closeFirstServeDialog"
          >
            <div
              class="dialog dialog--confirm"
              role="dialog"
              aria-modal="true"
              aria-labelledby="first-serve-title"
              aria-describedby="first-serve-desc"
            >
              <div class="dialog__header dialog__header--confirm">
                <span class="material-symbols-outlined dialog__confirm-icon" aria-hidden="true">restaurant</span>
                <h3 id="first-serve-title" class="dialog__title">¿Registrar esta comida en la bitácora?</h3>
              </div>

              <div class="dialog__body">
                <p id="first-serve-desc" class="dialog__text">
                  Esto registrará la comida como servida hoy.
                </p>
              </div>

              <div class="dialog__actions">
                <button class="dialog__btn dialog__btn--secondary" @click="closeFirstServeDialog">
                  Cancelar
                </button>
                <button class="dialog__btn dialog__btn--primary" @click="confirmFirstServe">
                  Sí, registrar
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- ─── Apply-to-all Dialog (UX-5) ─── -->
      <Teleport to="body">
        <Transition name="dialog-fade">
          <div
            v-if="applyAllDialog.open"
            class="dialog-backdrop"
            role="presentation"
            @click.self="closeApplyAllDialog"
          >
            <div
              class="dialog dialog--confirm"
              role="dialog"
              aria-modal="true"
              aria-labelledby="apply-all-title"
              aria-describedby="apply-all-desc"
            >
              <div class="dialog__header dialog__header--confirm">
                <span class="material-symbols-outlined dialog__confirm-icon" aria-hidden="true">calendar_month</span>
                <h3 id="apply-all-title" class="dialog__title">¿Aplicar a todas las comidas del día?</h3>
              </div>

              <div class="dialog__body">
                <p id="apply-all-desc" class="dialog__text">
                  Puedes asignar este plato solo a esta comida o a todas las comidas del día.
                </p>
              </div>

              <div class="dialog__actions">
                <button class="dialog__btn dialog__btn--secondary" @click="confirmApplySingle">
                  Solo esta comida
                </button>
                <button class="dialog__btn dialog__btn--primary" @click="confirmApplyAll">
                  Aplicar a todas
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- ─── Plate Builder Drawer (Menu→Builder flow) ─── -->
      <PlateBuilderDrawer
        :visible="showPlateDrawer"
        :meal-context="drawerMealContext ?? undefined"
        @plate-created="onPlateCreated"
        @close="closePlateDrawer"
        @update:visible="showPlateDrawer = $event"
      />

      <!-- ─── Export Frame (off-screen, for capture) ─── -->
      <MenuExportFrame
        ref="exportFrameRef"
        :week-start="weekStartISO"
        :week-end="weekEndISO"
        :week-label="weekLabel"
        :baby-name="profileStore.activeProfile?.name ?? ''"
        :stage-label="babyStageLabel"
        :days="exportData"
        :week-stats="weekStats"
        @done="onExportDone"
        @error="onExportError"
      />

      </template><!-- v-else: main content -->

    </div>
  </TierGate>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, watch, nextTick } from 'vue'
import { RouterLink } from 'vue-router'
import type { Plate, PlateItemSummary } from '@pakulab/shared'
import { DAY_KEY_TO_INDEX, DAY_INDEX_TO_KEY, type MealKey as SharedMealKey, MEAL_TYPE_TO_KEY } from '@pakulab/shared'
import { getAgeMonths, getSuggestedStageForAge, PLATE_STAGE_LABELS, getMealSlotsForAge } from '@pakulab/shared'
import TierGate from '@/shared/components/TierGate.vue'
import PlateBuilderDrawer from '@/shared/components/PlateBuilderDrawer.vue'
import MenuExportFrame from './components/MenuExportFrame.vue'
import WarningBadge from '@/shared/components/WarningBadge.vue'
import { usePlateStore } from '@/shared/stores/plateStore.js'
import { useMenuStore } from '@/shared/stores/menuStore.js'
import { useProfileStore } from '@/shared/stores/profileStore.js'
import { useUiStore } from '@/shared/stores/uiStore.js'
import { useFoodHistoryStore } from '@/shared/stores/foodHistoryStore.js'
import { useFoodExposure } from '@/shared/composables/useFoodExposure.js'
import FoodExposureBadge from '@/shared/components/FoodExposureBadge.vue'

// ─── Food visualization helpers ───────────────────────────────────────────

const AL_LABELS: Record<string, string> = {
  ASTRINGENT: 'Astringente',
  LAXATIVE: 'Laxante',
  NEUTRAL: 'Neutro',
}

const MAX_VISIBLE_FOODS = 3
const MAX_FOOD_NAME_LENGTH = 15

interface TooltipState {
  visible: boolean
  content: PlateItemSummary[] | null
  x: number
  y: number
}

const tooltip = ref<TooltipState>({
  visible: false,
  content: null,
  x: 0,
  y: 0,
})

// ─── Serve / Re-serve dialog state ─────────────────────────────────────────

interface ReServeDialogState {
  open: boolean
  dayKey: DayKey | null
  mealKey: MealKey | null
}

const reServeDialog = ref<ReServeDialogState>({
  open: false,
  dayKey: null,
  mealKey: null,
})

// ─── First-serve confirmation dialog (UX-4) ──────────────────────────────────

interface FirstServeDialogState {
  open: boolean
  dayKey: DayKey | null
  mealKey: MealKey | null
}

const firstServeDialog = reactive<FirstServeDialogState>({
  open: false,
  dayKey: null,
  mealKey: null,
})

// ─── Apply-to-all dialog (UX-5) ──────────────────────────────────────────────

interface ApplyAllDialogState {
  open: boolean
  plate: Plate | null
  dayKey: DayKey | null
}

const applyAllDialog = reactive<ApplyAllDialogState>({
  open: false,
  plate: null,
  dayKey: null,
})

const pendingMealKey = ref<MealKey | ''>('')

// ─── Plate builder drawer state (Menu→Builder flow) ──────────────────────────

const showPlateDrawer = ref(false)
const drawerMealContext = ref<{ dayOfWeek: number; mealType: SharedMealKey } | null>(null)

// ─── Preview mode ────────────────────────────────────────────────────────

const previewMode = ref(false)

// ─── Export state ─────────────────────────────────────────────────────────

const isExporting = ref(false)
const exportFrameRef = ref<InstanceType<typeof MenuExportFrame> | null>(null)

// ─── Constants ────────────────────────────────────────────────────────────

type MealKey = 'desayuno' | 'comida' | 'cena' | 'snack1' | 'snack2'
type DayKey = 'lun' | 'mar' | 'mie' | 'jue' | 'vie' | 'sab' | 'dom'

interface MealDef {
  key: MealKey
  name: string
  icon: string
}

interface DayInfo {
  key: DayKey
  name: string
  shortName: string
  dayNumber: string
  date: Date
  isToday: boolean
}

// Icon mapping for meal types (Material Symbols)
const MEAL_ICONS: Record<SharedMealKey, string> = {
  desayuno: 'wb_sunny',
  comida: 'lunch_dining',
  cena: 'bedtime',
  snack1: 'bakery_dining',
  snack2: 'cookie',
  snack: 'bakery_dining',
}

// ─── Stores ───────────────────────────────────────────────────────────────

const plateStore = usePlateStore()
const menuStore = useMenuStore()
const profileStore = useProfileStore()
const uiStore = useUiStore()
const foodHistoryStore = useFoodHistoryStore()

// ─── Profile guard ────────────────────────────────────────────────────────

const hasProfile = computed(() => !!profileStore.activeProfile)
const profilesLoading = computed(() => profileStore.loading ?? false)

// ─── Baby age and stage (for export) ──────────────────────────────────────

/** Baby's age in months (0 if birthDate is missing/invalid) */
const babyAgeMonths = computed<number>(() => {
  const birthDate = profileStore.activeProfile?.birthDate
  return birthDate ? getAgeMonths(birthDate) : 0
})

// ─── Age-aware meal slots (REQ-A3) ────────────────────────────────────────

/**
 * Age-aware meal columns for the menu grid. Uses getMealSlotsForAge to
 * return 3 meals (<10m), 4 meals (10-12m), or 5 meals (≥13m).
 */
const MEALS = computed<MealDef[]>(() => {
  const slots = getMealSlotsForAge(babyAgeMonths.value)
  return slots.map(slot => ({
    key: MEAL_TYPE_TO_KEY[slot.mealType] as MealKey,
    name: slot.label,
    icon: MEAL_ICONS[MEAL_TYPE_TO_KEY[slot.mealType]],
  }))
})

/** Baby's current stage label (empty string if age is 0) */
const babyStageLabel = computed<string>(() => {
  const ageMonths = babyAgeMonths.value
  if (ageMonths === 0) return ''
  const stage = getSuggestedStageForAge(ageMonths)
  return PLATE_STAGE_LABELS[stage]
})

// ─── Week state ───────────────────────────────────────────────────────────

/** Offset in weeks from current week. 0 = this week, -1 = last week, etc. */
const weekOffset = ref(0)

/** Week anchor: Monday of the displayed week */
const weekStart = computed<Date>(() => {
  const now = new Date()
  const dayOfWeek = now.getDay() // 0=Sun…6=Sat
  const diffToMonday = (dayOfWeek + 6) % 7
  const monday = new Date(now)
  monday.setDate(now.getDate() - diffToMonday + weekOffset.value * 7)
  monday.setHours(0, 0, 0, 0)
  return monday
})

/** ISO date string for API calls (YYYY-MM-DD) */
const weekStartISO = computed(() => {
  return weekStart.value.toISOString().slice(0, 10)
})

/** ISO date string for week end (Sunday) */
const weekEndISO = computed(() => {
  const end = new Date(weekStart.value)
  end.setDate(weekStart.value.getDate() + 6)
  return end.toISOString().slice(0, 10)
})

const weekLabel = computed(() => {
  const start = weekStart.value
  const end = new Date(start)
  end.setDate(start.getDate() + 6)

  const fmtDay = (d: Date) =>
    d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })

  return `${fmtDay(start)} – ${fmtDay(end)}`
})

const weekDays = computed<DayInfo[]>(() => {
  const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
  const shortNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
  const keys: DayKey[] = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom']
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart.value)
    date.setDate(weekStart.value.getDate() + i)
    const isToday = date.getTime() === today.getTime()
    return {
      key: keys[i]!,
      name: dayNames[i]!,
      shortName: shortNames[i]!,
      dayNumber: date.getDate().toString(),
      date,
      isToday,
    }
  })
})

// ─── Food Exposure ─────────────────────────────────────────────────────────
const foodExposure = useFoodExposure()

/**
 * Collect all unique food IDs from currently visible week slots and picker plates.
 * Includes assigned plates in the week grid + saved plates in the picker.
 */
const weekFoodIds = computed<string[]>(() => {
  const ids = new Set<string>()
  // Week grid foods
  for (const day of weekDays.value) {
    for (const meal of MEALS.value) {
      const plate = menuStore.getPlate(day.key, meal.key as MealKey)
      if (plate?.items) {
        for (const item of plate.items) {
          if (item.foodId) ids.add(item.foodId)
        }
      }
    }
  }
  // Picker plate foods (so badges show when user expands plates in picker)
  for (const plate of plateStore.savedPlates) {
    if (plate.items) {
      for (const item of plate.items) {
        if (item.foodId) ids.add(item.foodId)
      }
    }
  }
  return [...ids]
})

/** Map of foodId → timesOffered (null when not yet cached) for passing to child templates */
const timesOfferedByFoodId = computed<Record<string, number | null>>(() => {
  const result: Record<string, number | null> = {}
  for (const foodId of weekFoodIds.value) {
    result[foodId] = foodExposure.getTimesOffered(foodId)
  }
  return result
})

/** Fetch exposure data for all week foods when week changes or profile switches */
async function fetchWeekExposure() {
  if (weekFoodIds.value.length > 0) {
    await foodExposure.fetch(weekFoodIds.value)
  }
}

/** Fetch food history (timesOffered + firstDate) for all week foods. Used to flag "primera vez". */
async function fetchWeekFoodHistory() {
  const profileId = profileStore.activeProfile?.id
  if (!profileId || weekFoodIds.value.length === 0) return
  await foodHistoryStore.fetchForFoods(profileId, weekFoodIds.value)
}

/** Re-fetch exposure when week changes or when the set of food IDs changes */
watch([weekOffset, weekFoodIds], async () => {
  if (weekFoodIds.value.length > 0) {
    await foodExposure.fetch(weekFoodIds.value)
  }
})

/** Re-fetch exposure when active profile changes */
watch(() => profileStore.activeProfile?.id, async (newProfileId) => {
  if (newProfileId) {
    menuStore.clearProfileCache()
    await menuStore.fetchWeekMenu(newProfileId, weekStartISO.value)
  }
})

/** Re-fetch exposure when saved plates are loaded (picker plate foods) */
watch(() => plateStore.savedPlates.length, async () => {
  if (weekFoodIds.value.length > 0) {
    await foodExposure.fetch(weekFoodIds.value)
  }
})

/** Export view-models for MenuExportFrame */
interface ExportFood {
  foodId: string
  name: string
  alClassification: 'ASTRINGENT' | 'LAXATIVE' | 'NEUTRAL'
  /** True when this is the first occurrence of a never-before-offered food in the chronological week walk */
  isNew: boolean
}

interface ExportMeal {
  type: string
  plateName: string | null
  foods: ExportFood[]
}

interface ExportDay {
  label: string
  date: string
  newFoods: string[]
  meals: ExportMeal[]
}

/**
 * Build export data with chronological "primera vez" tracking.
 *
 * Algorithm:
 *   1. Foods with timesOffered > 0 historically are seeded into `seenSoFar`.
 *   2. Walk days lun→dom; for each day mark the FIRST occurrence of any food
 *      not in `seenSoFar` as `isNew`. After processing the day, add those
 *      newly introduced foods to `seenSoFar` so they don't re-flag on later days.
 */
const exportData = computed<ExportDay[]>(() => {
  const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
  const keys: DayKey[] = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom']

  const profileId = profileStore.activeProfile?.id
  const seenSoFar = new Set<string>()
  if (profileId) {
    for (const foodId of weekFoodIds.value) {
      const history = foodHistoryStore.historyForFood(profileId, foodId)
      if (history && history.timesOffered > 0) {
        seenSoFar.add(foodId)
      }
    }
  }

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart.value)
    date.setDate(weekStart.value.getDate() + i)

    const dayKey = keys[i]!
    const newFoodIdsToday = new Set<string>()
    const newFoodNamesToday: string[] = []

    const meals: ExportMeal[] = MEALS.value.map((meal) => {
      const plate = menuStore.getPlate(dayKey, meal.key)
      const foods: ExportFood[] = menuStore.getSlotFoods(dayKey, meal.key).map((item) => {
        const foodId = item.foodId ?? ''
        const name = item.food?.name ?? 'Alimento'
        // Mark as new only the FIRST occurrence per day of an unseen food
        const isNew =
          !!foodId &&
          !seenSoFar.has(foodId) &&
          !newFoodIdsToday.has(foodId)
        if (isNew) {
          newFoodIdsToday.add(foodId)
          newFoodNamesToday.push(name)
        }
        return {
          foodId,
          name,
          alClassification: (item.food?.alClassification ?? 'NEUTRAL') as 'ASTRINGENT' | 'LAXATIVE' | 'NEUTRAL',
          isNew,
        }
      })

      return {
        type: meal.name,
        plateName: plate?.name ?? null,
        foods,
      }
    })

    // After processing this day, today's "new" foods become "seen" for later days
    for (const id of newFoodIdsToday) seenSoFar.add(id)

    return {
      label: dayNames[i]!,
      date: date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }),
      newFoods: newFoodNamesToday,
      meals,
    }
  })
})

function prevWeek() {
  weekOffset.value--
}

function nextWeek() {
  weekOffset.value++
}

// ─── Menu assignment state (backed by menuStore) ──────────────────────────

/** 
 * Get assigned plate from store.
 * Thin wrapper for template compatibility.
 */
function getAssignedPlate(dayKey: DayKey, mealKey: MealKey): Plate | undefined {
  return menuStore.getPlate(dayKey, mealKey) ?? undefined
}

/**
 * Remove plate from slot via store (with optimistic UI + API sync).
 */
async function removePlate(dayKey: DayKey, mealKey: MealKey): Promise<void> {
  const profileId = profileStore.activeProfile?.id
  if (!profileId) return

  try {
    await menuStore.removePlate(profileId, weekStartISO.value, dayKey, mealKey)
  } catch (err) {
    // Error already handled in store (rollback + toast), just log
    console.error('Failed to remove plate:', err)
  }
}

// ─── Serve button handlers ─────────────────────────────────────────────────

/**
 * Handle serve button click.
 * If not served yet: calls serveMeal.
 * If already served: opens re-serve confirmation dialog.
 */
function handleServeClick(dayKey: DayKey, mealKey: MealKey): void {
  const servedAt = menuStore.getServedAt(dayKey, mealKey)

  if (servedAt) {
    // Already served - open re-serve dialog
    reServeDialog.value = {
      open: true,
      dayKey,
      mealKey,
    }
  } else {
    // Not served yet — open first-serve confirmation dialog (UX-4)
    firstServeDialog.open = true
    firstServeDialog.dayKey = dayKey
    firstServeDialog.mealKey = mealKey
  }
}

/**
 * Call serve API for a meal slot.
 */
async function serveMeal(dayKey: DayKey, mealKey: MealKey): Promise<void> {
  const profileId = profileStore.activeProfile?.id
  if (!profileId) return

  try {
    await menuStore.serveMeal(profileId, dayKey, mealKey)
  } catch (err) {
    // Error already handled in store
    console.error('Failed to serve meal:', err)
  }
}

/**
 * Confirm re-serve from dialog.
 */
async function confirmReServe(): Promise<void> {
  if (!reServeDialog.value.dayKey || !reServeDialog.value.mealKey) return

  const profileId = profileStore.activeProfile?.id
  if (!profileId) {
    closeReServeDialog()
    return
  }

  const dayKey = reServeDialog.value.dayKey
  const mealKey = reServeDialog.value.mealKey

  closeReServeDialog()

  try {
    await menuStore.reServeMeal(profileId, dayKey, mealKey)
  } catch (err) {
    // Error already handled in store
    console.error('Failed to re-serve meal:', err)
  }
}

function closeReServeDialog(): void {
  reServeDialog.value = {
    open: false,
    dayKey: null,
    mealKey: null,
  }
}

// ─── First-serve dialog handlers (UX-4) ──────────────────────────────────────

async function confirmFirstServe(): Promise<void> {
  if (!firstServeDialog.dayKey || !firstServeDialog.mealKey) return

  const profileId = profileStore.activeProfile?.id
  if (!profileId) {
    closeFirstServeDialog()
    return
  }

  const dayKey = firstServeDialog.dayKey
  const mealKey = firstServeDialog.mealKey

  closeFirstServeDialog()

  try {
    await menuStore.serveMeal(profileId, dayKey, mealKey)
  } catch (err) {
    console.error('Failed to serve meal:', err)
  }
}

function closeFirstServeDialog(): void {
  firstServeDialog.open = false
  firstServeDialog.dayKey = null
  firstServeDialog.mealKey = null
}

/**
 * Get serve button label based on state.
 */
function getServeButtonLabel(dayKey: DayKey, mealKey: MealKey): string {
  const servedAt = menuStore.getServedAt(dayKey, mealKey)
  return servedAt ? 'Servido \u2713' : 'Se lo di \u2713'
}

/**
 * Get serve button state classes.
 */
function getServeButtonClass(dayKey: DayKey, mealKey: MealKey): string {
  const servedAt = menuStore.getServedAt(dayKey, mealKey)
  if (servedAt) {
    return 'serve-btn--served'
  }
  return 'serve-btn--ready'
}

/**
 * Check if serve button should be disabled.
 */
function isServeDisabled(dayKey: DayKey, mealKey: MealKey): boolean {
  return menuStore.isServeLoading(dayKey, mealKey)
}

/**
 * Get tooltip text for served button.
 */
function getServeTooltip(dayKey: DayKey, mealKey: MealKey): string {
  const servedAt = menuStore.getServedAt(dayKey, mealKey)
  if (!servedAt) return ''

  const date = new Date(servedAt)
  const formatted = date.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
  return `Registrado el ${formatted}`
}

// ─── Food visualization helpers ───────────────────────────────────────────

/**
 * Get visible foods for desktop food list (max 3). * REQ-1: Show up to 3 food names with A/L indicator dots.
 */
function getVisibleFoods(dayKey: DayKey, mealKey: MealKey): PlateItemSummary[] {
  return menuStore.getSlotFoods(dayKey, mealKey).slice(0, MAX_VISIBLE_FOODS)
}

/**
 * Get overflow count for badge.
 */
function getFoodOverflowCount(dayKey: DayKey, mealKey: MealKey): number {
  const foods = menuStore.getSlotFoods(dayKey, mealKey)
  return Math.max(0, foods.length - MAX_VISIBLE_FOODS)
}

/**
 * Get slot foods for mobile chips.
 */
function getSlotFoods(dayKey: DayKey, mealKey: MealKey): PlateItemSummary[] {
  return menuStore.getSlotFoods(dayKey, mealKey)
}

/**
 * Truncate food name for mobile chips.
 * REQ-002: Mobile chips show names truncated to 15 chars.
 */
function truncateFoodName(name: string): string {
  if (name.length <= MAX_FOOD_NAME_LENGTH) return name
  return name.slice(0, MAX_FOOD_NAME_LENGTH) + '…'
}

/**
 * Get A/L classification label in Spanish.
 */
function getALLabel(classification: string | undefined): string {
  if (!classification) return 'Neutro'
  return AL_LABELS[classification] ?? 'Neutro'
}

/**
 * CSS class for the compact exposure dot in preview grid.
 * Returns empty string for KNOWN or UNKNOWN (no dot shown).
 */
function exposureDotClass(timesOffered: number | null): string {
  if (timesOffered === null) return ''
  if (timesOffered === 0) return 'exposure-mark--new'
  if (timesOffered <= 3) return 'exposure-mark--exploring'
  return ''
}

/**
 * Tooltip text for the compact exposure dot.
 */
function exposureDotTitle(timesOffered: number | null): string {
  if (timesOffered === null) return ''
  if (timesOffered === 0) return 'Nuevo alimento'
  if (timesOffered <= 3) return `Ofrecido ${timesOffered} vez${timesOffered === 1 ? '' : 'es'}`
  return ''
}

/**
 * Show tooltip with food list on desktop hover.
 * REQ-003: Tooltip shows full food names with A/L classification.
 */
function showTooltip(dayKey: DayKey, mealKey: MealKey): void {
  const foods = menuStore.getSlotFoods(dayKey, mealKey)
  if (foods.length === 0) return

  tooltip.value.content = foods
  tooltip.value.visible = true

  // Position tooltip anchored to the plate-chip, not the full meal-slot
  const chipKey = `${dayKey}:${mealKey}`
  const chipElement = document.querySelector(`[data-chip="${chipKey}"]`)
  if (chipElement) {
    const rect = chipElement.getBoundingClientRect()
    const tooltipWidth = 200
    // Center horizontally on the chip, clamp to viewport
    let x = rect.left + rect.width / 2 - tooltipWidth / 2
    x = Math.max(8, Math.min(x, window.innerWidth - tooltipWidth - 8))
    tooltip.value.x = x
    tooltip.value.y = rect.bottom + 6
  }
}

function hideTooltip(): void {
  tooltip.value.visible = false
  tooltip.value.content = null
}

// ─── Picker ───────────────────────────────────────────────────────────────

interface PickerState {
  open: boolean
  dayKey: DayKey | null
  mealKey: MealKey | null
}

const picker = ref<PickerState>({ open: false, dayKey: null, mealKey: null })
const expandedPlateId = ref<string | null>(null)

function openPicker(dayKey: DayKey, mealKey: MealKey): void {
  picker.value = { open: true, dayKey, mealKey }
  expandedPlateId.value = null
}

function closePicker(): void {
  picker.value = { open: false, dayKey: null, mealKey: null }
  expandedPlateId.value = null
}

// ─── Plate builder drawer handlers (Menu→Builder flow) ────────────────────

function openPlateDrawer(): void {
  if (!picker.value.dayKey || !picker.value.mealKey) return

  const dayKey = picker.value.dayKey
  const mealKey = picker.value.mealKey

  // Close picker first, then open the drawer
  closePicker()

  drawerMealContext.value = {
    dayOfWeek: DAY_KEY_TO_INDEX[dayKey],
    mealType: mealKey as SharedMealKey,
  }
  showPlateDrawer.value = true
}

async function onPlateCreated(plate: Plate): Promise<void> {
  const ctx = drawerMealContext.value
  if (!ctx) return

  const dayKey = DAY_INDEX_TO_KEY[ctx.dayOfWeek] as DayKey
  const mealKey = ctx.mealType as MealKey

  // Close drawer first
  closePlateDrawer()

  // Refresh plates list so the picker shows the new plate next time
  await plateStore.fetchSavedPlates()

  // Reuse the apply-all dialog: let user choose "solo esta comida" or "aplicar a todas"
  applyAllDialog.open = true
  applyAllDialog.plate = plate
  applyAllDialog.dayKey = dayKey
  pendingMealKey.value = mealKey
}

function closePlateDrawer(): void {
  showPlateDrawer.value = false
  drawerMealContext.value = null
}

// ─── Apply-all dialog handlers (UX-5) ───────────────────────────────────────≡

async function confirmApplySingle(): Promise<void> {
  if (!applyAllDialog.plate || !applyAllDialog.dayKey || !pendingMealKey.value) return

  const profileId = profileStore.activeProfile?.id
  if (!profileId) {
    closeApplyAllDialog()
    return
  }

  const { dayKey, plate } = applyAllDialog
  const mealKey = pendingMealKey.value as MealKey

  closeApplyAllDialog()

  try {
    await menuStore.assignPlate(profileId, weekStartISO.value, dayKey!, mealKey, plate!)
  } catch (err) {
    console.error('Failed to assign plate:', err)
  }
}

async function confirmApplyAll(): Promise<void> {
  if (!applyAllDialog.plate || !applyAllDialog.dayKey) return

  const profileId = profileStore.activeProfile?.id
  if (!profileId) {
    closeApplyAllDialog()
    return
  }

  const { dayKey, plate } = applyAllDialog
  closeApplyAllDialog()

  // Sequential assignment to avoid Pinia reactive state race conditions (UX-5)
  for (const meal of MEALS.value) {
    try {
      await menuStore.assignPlate(profileId, weekStartISO.value, dayKey!, meal.key, plate!)
    } catch (err) {
      console.error('Failed to assign plate to all meals:', err)
      break
    }
  }
}

function closeApplyAllDialog(): void {
  applyAllDialog.open = false
  applyAllDialog.plate = null
  applyAllDialog.dayKey = null
  pendingMealKey.value = ''
}

function togglePlatePreview(plateId: string): void {
  expandedPlateId.value = expandedPlateId.value === plateId ? null : plateId
}

const GROUP_LABELS: Record<string, string> = {
  FRUIT: 'Fruta',
  VEGETABLE: 'Verdura',
  PROTEIN: 'Proteína',
  CEREAL_TUBER: 'Cereal',
  HEALTHY_FAT: 'Grasa saludable',
}

function formatGroup(group: string): string {
  return GROUP_LABELS[group] ?? group
}

async function assignPlate(plate: Plate): Promise<void> {
  if (!picker.value.dayKey || !picker.value.mealKey) return

  const dayKey = picker.value.dayKey
  const mealKey = picker.value.mealKey

  // Close picker first, then open apply-all dialog (UX-5)
  closePicker()

  applyAllDialog.open = true
  applyAllDialog.plate = plate
  applyAllDialog.dayKey = dayKey
  pendingMealKey.value = mealKey
}

// ─── Mobile tab state ─────────────────────────────────────────────────────

const selectedDayKey = ref<DayKey>('lun')

// Initialize to today's day if in current week
const todayDay = weekDays.value.find((d) => d.isToday)
if (todayDay) selectedDayKey.value = todayDay.key

// ─── Weekly stats ─────────────────────────────────────────────────────────

/** Use store's computed stats */
const weekStats = computed(() => menuStore.weekStats)

// ─── Plate score helpers ──────────────────────────────────────────────────

function scoreClass(plate: Plate): string {
  if (plate.balanceScore > 0.2) return 'score--balanced'
  if (plate.balanceScore < -0.2) return 'score--unbalanced'
  return 'score--neutral'
}

function scoreIcon(plate: Plate): string {
  if (plate.balanceScore > 0.2) return 'check_circle'
  if (plate.balanceScore < -0.2) return 'warning'
  return 'remove_circle'
}

/**
 * Get tooltip text for the balance score icon.
 * REQ-3: Explain the visual score indicator.
 */
function scoreTooltip(plate: Plate): string {
  if (plate.balanceScore >0.2) return 'Plato equilibrado'
  if (plate.balanceScore < -0.2) return 'Plato astringente'
  return 'Plato neutro'
}

// ─── Export handlers ───────────────────────────────────────────────────────

async function handleExport(): Promise<void> {
  if (isExporting.value || !exportFrameRef.value) return

  isExporting.value = true

  try {
    // Make sure the food history is loaded so "primera vez" badges render correctly
    await fetchWeekFoodHistory()
    // Wait for frame to render
    await nextTick()
    // Trigger capture
    await exportFrameRef.value.capture()
  } catch (err) {
    console.error('Export failed:', err)
    isExporting.value = false
  }
}

function onExportDone(dataUrl: string): void {
  try {
    // Create download link
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `menu-semanal-${weekStartISO.value}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    uiStore.addToast('Menú exportado', 'success')
  } catch (err) {
    console.error('Download failed:', err)
    uiStore.addToast('Error al descargar el menú', 'error')
  } finally {
    isExporting.value = false
  }
}

function onExportError(message: string): void {
  console.error('Export error:', message)
  isExporting.value = false
  uiStore.addToast('Error al exportar el menú. Intenta de nuevo.', 'error')
}

// ─── Lifecycle ────────────────────────────────────────────────────────────

onMounted(async () => {
  // Ensure baby profiles are loaded (may not be if navigating directly to /menus)
  if (profileStore.profiles.length === 0) {
    await profileStore.fetchProfiles()
  }

  // Fetch saved plates for the picker
  if (plateStore.savedPlates.length === 0) {
    await plateStore.fetchSavedPlates()
  }

  // Fetch menu for current week
  const profileId = profileStore.activeProfile?.id
  if (profileId) {
    await menuStore.fetchWeekMenu(profileId, weekStartISO.value)
  }

  // Fetch food exposure data for visible week foods
  await fetchWeekExposure()
})

// ─── Watchers ─────────────────────────────────────────────────────────────

/** Watch week changes and fetch appropriate menu */
watch(weekStartISO, async (newWeekStart) => {
  const profileId = profileStore.activeProfile?.id
  if (profileId) {
    await menuStore.fetchWeekMenu(profileId, newWeekStart)
  }
})

/** Watch profile changes and clear cache + fetch new */
watch(() => profileStore.activeProfile?.id, async (newProfileId) => {
  if (newProfileId) {
    menuStore.clearProfileCache()
    await menuStore.fetchWeekMenu(newProfileId, weekStartISO.value)
  }
})
</script>

<style scoped>
/* ─── No profile empty state ─── */
.no-profile-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--md3-space-12) var(--md3-space-4);
  gap: var(--md3-space-3);
}

.no-profile-state__icon {
  font-size: 3.5rem !important;
  color: var(--md3-primary);
  opacity: 0.7;
}

.no-profile-state__title {
  font-family: var(--md3-font-headline);
  font-size: var(--md3-headline-sm);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
  margin: 0;
}

.no-profile-state__text {
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-lg);
  color: var(--md3-on-surface-variant);
  max-width: 400px;
  margin: 0;
  line-height: 1.5;
}

.no-profile-state__btn {
  display: inline-flex;
  align-items: center;
  gap: var(--md3-space-2);
  margin-top: var(--md3-space-2);
  padding: 0.75rem var(--md3-space-5);
  background: var(--md3-gradient-cta);
  color: var(--md3-on-primary);
  border: none;
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-size: var(--md3-body-md);
  font-weight: var(--md3-weight-semibold);
  text-decoration: none;
  cursor: pointer;
  transition: background var(--md3-transition-fast), box-shadow var(--md3-transition-fast);
}

.no-profile-state__btn:hover {
  background: var(--md3-gradient-cta-hover);
  box-shadow: var(--md3-shadow-elevated);
}

.no-profile-state__btn .material-symbols-outlined {
  font-size: 1.125rem;
}

/* ─── Loading state ─── */
.menu-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--md3-space-12) var(--md3-space-4);
  gap: var(--md3-space-3);
  color: var(--md3-on-surface-variant);
}

.menu-loading__spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid var(--md3-outline-variant);
  border-top-color: var(--md3-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ─── Page layout ─── */
.menu-page {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-6);
  max-width: 1200px;
  margin: 0 auto;
  overflow-x: hidden;
}

/* ─── Header ─── */
.menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--md3-space-3);
}

.menu-header__titles {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-1);
}

.menu-header__title {
  margin: 0;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-headline-md);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
  letter-spacing: var(--md3-headline-tracking);
}

.menu-header__subtitle {
  margin: 0;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  color: var(--md3-on-surface-variant);
  display: none;
}

@media (min-width: 768px) {
  .menu-header__subtitle {
    display: block;
  }
}

.menu-header__actions {
  display: flex;
  align-items: center;
  gap: var(--md3-space-3);
}

.week-nav {
  display: flex;
  align-items: center;
  gap: var(--md3-space-2);
  background: var(--md3-surface-container-low);
  border-radius: var(--md3-rounded-full);
  padding: var(--md3-space-1) var(--md3-space-2);
}

.week-nav__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  min-width: 44px;
  min-height: 44px;
  border: none;
  background: transparent;
  color: var(--md3-primary);
  border-radius: var(--md3-rounded-full);
  cursor: pointer;
  transition: background var(--md3-transition-fast);
}

.week-nav__btn:hover {
  background: var(--md3-surface-container);
}

.week-nav__btn .material-symbols-outlined {
  font-size: 1.25rem;
}

.week-nav__label {
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-semibold);
  color: var(--md3-on-surface);
  min-width: 140px;
  text-align: center;
}

/* ─── Export button ─── */
.export-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  border: none;
  background: var(--md3-primary);
  color: var(--md3-on-primary);
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-semibold);
  cursor: pointer;
  transition: background var(--md3-transition-fast), opacity var(--md3-transition-fast);
  min-height: 40px;
}

.export-btn:hover:not(:disabled) {
  background: var(--md3-primary-hover, var(--md3-primary));
  opacity: 0.9;
}

.export-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.export-btn .material-symbols-outlined {
  font-size: 1.125rem;
}

.export-btn__spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: var(--md3-on-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

/* Mobile: icon-only export button */
.export-btn__label {
  display: none;
}

@media (min-width: 768px) {
  .export-btn__label {
    display: inline;
  }
}

@media (max-width: 767px) {
  .export-btn {
    padding: 0.5rem;
    min-height: 36px;
    min-width: 36px;
  }

  .menu-header {
    gap: var(--md3-space-2);
  }

  .menu-header__actions {
    gap: var(--md3-space-2);
  }

  .menu-header__title {
    font-size: var(--md3-headline-sm);
  }
}

/* ─── Preview button ─── */
.preview-btn {
  display: none;
}

@media (min-width: 768px) {
  .preview-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.625rem 1rem;
    border: 1.5px solid var(--md3-outline-variant);
    background: transparent;
    color: var(--md3-on-surface);
    border-radius: var(--md3-rounded-full);
    font-family: var(--md3-font-label);
    font-size: var(--md3-label-lg);
    font-weight: var(--md3-weight-semibold);
    cursor: pointer;
    transition: border-color var(--md3-transition-fast), background var(--md3-transition-fast), color var(--md3-transition-fast);
    min-height: 40px;
  }

  .preview-btn:hover {
    border-color: var(--md3-primary);
    color: var(--md3-primary);
    background: var(--md3-surface-container-low);
  }

  .preview-btn--active {
    border-color: var(--md3-primary);
    background: var(--md3-primary-container);
    color: var(--md3-on-primary-container);
  }

  .preview-btn .material-symbols-outlined {
    font-size: 1.125rem;
  }
}

/* ─── Desktop: Week grid ─── */
.week-grid {
  display: none;
  grid-template-columns: repeat(7, 1fr);
  gap: var(--md3-space-2);
}

@media (min-width: 768px) {
  .week-grid {
    display: grid;
  }

  .mobile-view {
    display: none !important;
  }
}

.day-column {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-1);
  background: var(--md3-surface-container-lowest);
  border-radius: var(--md3-rounded-md);
  padding: var(--md3-space-2);
  box-shadow: none;
  border: 1px solid var(--md3-outline-variant);
  transition: box-shadow var(--md3-transition-fast), border-color var(--md3-transition-fast);
}

.day-column:hover {
  border-color: var(--md3-primary);
  box-shadow: var(--md3-shadow-soft);
}

.day-column--today {
  background: var(--md3-primary-container);
  border-color: var(--md3-primary);
  box-shadow: var(--md3-shadow-soft);
}

.day-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding-bottom: var(--md3-space-1);
  border-bottom: 1px solid var(--md3-outline-variant);
}

.day-column--today .day-header {
  border-bottom-color: var(--md3-on-primary-container);
}

.day-header__name {
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-md);
  font-weight: var(--md3-weight-semibold);
  color: var(--md3-on-surface-variant);
  text-transform: uppercase;
  letter-spacing: var(--md3-label-tracking);
}

.day-column--today .day-header__name {
  color: var(--md3-on-primary-container);
}

.day-header__date {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-body-md);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
  border-radius: var(--md3-rounded-full);
}

.day-header__date--today {
  background: var(--md3-primary);
  color: var(--md3-on-primary);
}

.meal-slots {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-1);
}

/* ─── Meal slot (desktop) ─── */
.meal-slot {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-height: 48px;
}

.meal-slot__label {
  display: flex;
  align-items: center;
  gap: var(--md3-space-1);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-sm);
  font-weight: var(--md3-weight-semibold);
  text-transform: uppercase;
  letter-spacing: var(--md3-label-tracking);
  color: var(--md3-on-surface-variant);
}

.meal-slot__icon {
  font-size: 0.875rem;
}

.meal-slot--desayuno .meal-slot__label { color: var(--md3-tertiary); }
.meal-slot--comida .meal-slot__label { color: var(--md3-primary); }
.meal-slot--cena .meal-slot__label { color: var(--md3-secondary); }

.meal-slot--loading {
  opacity: 0.7;
}

.slot-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid var(--md3-outline-variant);
  border-top-color: var(--md3-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

/* ─── Add slot button ─── */
.add-slot-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 32px;
  padding: var(--md3-space-1);
  border: 1.5px dashed var(--md3-outline-variant);
  border-radius: var(--md3-rounded-sm);
  background: transparent;
  color: var(--md3-outline-variant);
  cursor: pointer;
  opacity: 0.5;
  transition: border-color var(--md3-transition-fast), background var(--md3-transition-fast), color var(--md3-transition-fast), opacity var(--md3-transition-fast);
}

.day-column:hover .add-slot-btn,
.add-slot-btn:hover {
  opacity: 1;
}

.add-slot-btn:hover {
  border-color: var(--md3-primary);
  background: var(--md3-surface-container-low);
  color: var(--md3-primary);
}

.add-slot-btn .material-symbols-outlined {
  font-size: 1rem;
}

/* ─── Plate chip (desktop) ─── */
.plate-chip {
  display: flex;
  align-items: center;
  gap: var(--md3-space-1);
  padding: 4px 6px;
  background: var(--md3-surface-container);
  border-radius: var(--md3-rounded-sm);
  min-height: 30px;
  cursor: default;
}

.plate-chip__score {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.plate-chip__score .material-symbols-outlined {
  font-size: 1rem;
}

.plate-chip__name {
  flex: 1;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  font-weight: var(--md3-weight-medium);
  color: var(--md3-on-surface);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
  line-height: var(--md3-label-line-height);
}

.plate-chip__actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity var(--md3-transition-fast);
}

.plate-chip:hover .plate-chip__actions {
  opacity: 1;
}

/* Always show serve icon when already served */
.plate-chip:has(.plate-chip__serve--served) .plate-chip__actions {
  opacity: 1;
}

.plate-chip__serve {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--md3-primary);
  border-radius: var(--md3-rounded-full);
  cursor: pointer;
  flex-shrink: 0;
  transition: background var(--md3-transition-fast), color var(--md3-transition-fast);
}

.plate-chip__serve:hover {
  background: var(--md3-surface-container-high);
}

.plate-chip__serve--served {
  color: var(--md3-primary);
}

.plate-chip__serve--served .material-symbols-outlined {
  font-variation-settings: 'FILL' 1;
}

.plate-chip__serve .material-symbols-outlined {
  font-size: 1.125rem;
}

.plate-chip__serve-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid var(--md3-outline-variant);
  border-top-color: var(--md3-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.plate-chip__remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: none;
  background: transparent;
  color: var(--md3-on-surface-variant);
  border-radius: var(--md3-rounded-full);
  cursor: pointer;
  flex-shrink: 0;
  transition: background var(--md3-transition-fast), color var(--md3-transition-fast);
}

.plate-chip__remove:hover {
  background: var(--md3-error-container);
  color: var(--md3-error);
}

.plate-chip__remove .material-symbols-outlined {
  font-size: 0.875rem;
}

.plate-chip--loading {
  opacity: 0.6;
  pointer-events: none;
}

/* ─── Food list (desktop — hidden, tooltip replaces it) ─── */
.food-list {
  list-style: none;
  margin: var(--md3-space-1) 0 0;
  padding: 0;
  display: none;
  flex-direction: column;
  gap: 2px;
}

.food-list__item {
  display: flex;
  align-items: center;
  gap: var(--md3-space-1);
}

.food-list__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.food-list__dot--astringent {
  background: #ef4444;
}

.food-list__dot--laxative {
  background: #22c55e;
}

.food-list__dot--neutral {
  background: #9ca3af;
}

.food-list__name {
  font-family: var(--md3-font-body);
  font-size: var(--md3-label-sm);
  color: var(--md3-on-surface-variant);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}

.food-list__overflow {
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-sm);
  color: var(--md3-outline);
  font-style: italic;
  padding-left: calc(6px + var(--md3-space-1));
}

/* ─── Food tooltip ─── */
.food-tooltip {
  position: fixed;
  z-index: 1001;
  background: var(--md3-surface-container-highest);
  border-radius: var(--md3-rounded-md);
  padding: var(--md3-space-2) var(--md3-space-3);
  box-shadow: var(--md3-shadow-card);
  min-width: 180px;
  max-width: 240px;
  pointer-events: none;
}

.food-tooltip__title {
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-sm);
  font-weight: var(--md3-weight-semibold);
  color: var(--md3-on-surface-variant);
  text-transform: uppercase;
  letter-spacing: var(--md3-label-tracking);
  margin-bottom: var(--md3-space-2);
  padding-bottom: var(--md3-space-1);
  border-bottom: 1px solid var(--md3-outline-variant);
}

.food-tooltip__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-2);
}

.food-tooltip__item {
  display: flex;
  align-items: center;
  gap: var(--md3-space-2);
}

.food-tooltip__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.food-tooltip__dot--astringent {
  background: #ef4444;
}

.food-tooltip__dot--laxative {
  background: #22c55e;
}

.food-tooltip__dot--neutral {
  background: #9ca3af;
}

.food-tooltip__name {
  flex: 1;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  color: var(--md3-on-surface);
}

.food-tooltip__al {
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-sm);
  color: var(--md3-on-surface-variant);
  font-style: italic;
}

.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
  transition: opacity var(--md3-transition-fast), transform var(--md3-transition-fast);
}

.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* ─── Preview grid (desktop only) ─── */
.preview-grid {
  display: none;
}

@media (min-width: 768px) {
  .preview-grid {
    display: grid;
    grid-template-columns: auto repeat(7, 1fr);
    gap: 1px;
    background: var(--md3-outline-variant);
    border-radius: var(--md3-rounded-md);
    overflow: hidden;
    border: 1px solid var(--md3-outline-variant);
    grid-auto-rows: auto;
  }
}

.preview-grid__corner {
  background: var(--md3-surface-container-low);
  padding: var(--md3-space-2);
}

.preview-grid__day-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: var(--md3-space-2);
  background: var(--md3-surface-container-low);
  min-width: 0;
}

.preview-grid__day-header--today {
  background: var(--md3-primary-container);
}

.preview-grid__day-name {
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-sm);
  font-weight: var(--md3-weight-semibold);
  text-transform: uppercase;
  letter-spacing: var(--md3-label-tracking);
  color: var(--md3-on-surface-variant);
}

.preview-grid__day-header--today .preview-grid__day-name {
  color: var(--md3-on-primary-container);
}

.preview-grid__day-number {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-body-sm);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
  border-radius: var(--md3-rounded-full);
}

.preview-grid__day-number--today {
  background: var(--md3-primary);
  color: var(--md3-on-primary);
}

.preview-grid__meal-label {
  display: flex;
  align-items: center;
  gap: var(--md3-space-1);
  padding: var(--md3-space-2) var(--md3-space-3);
  background: var(--md3-surface-container-low);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-sm);
  font-weight: var(--md3-weight-semibold);
  text-transform: uppercase;
  letter-spacing: var(--md3-label-tracking);
  color: var(--md3-on-surface-variant);
  white-space: nowrap;
}

.preview-grid__meal-label .material-symbols-outlined {
  font-size: 0.875rem;
}

.preview-grid__meal-label--desayuno { color: var(--md3-tertiary); }
.preview-grid__meal-label--comida { color: var(--md3-primary); }
.preview-grid__meal-label--cena { color: var(--md3-secondary); }

.preview-grid__cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--md3-space-2);
  background: var(--md3-surface-container-lowest);
  min-height: 40px;
  min-width: 0;
}

.preview-grid__cell-header {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.preview-grid__cell--today {
  background: color-mix(in srgb, var(--md3-primary-container) 30%, var(--md3-surface-container-lowest));
}

.preview-grid__cell--empty {
  justify-content: center;
}

.preview-grid__cell--served {
  background: color-mix(in srgb, var(--md3-primary-container) 15%, var(--md3-surface-container-lowest));
}

.preview-grid__score-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.preview-grid__score-dot.score--balanced { background: #22c55e; }
.preview-grid__score-dot.score--neutral { background: #f59e0b; }
.preview-grid__score-dot.score--unbalanced { background: #ef4444; }

.preview-grid__plate-name {
  flex: 1;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  color: var(--md3-on-surface);
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
  line-height: 1.3;
}

.preview-grid__served-icon {
  font-size: 0.875rem;
  color: var(--md3-primary);
  flex-shrink: 0;
  font-variation-settings: 'FILL' 1;
}

.preview-grid__foods {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.preview-grid__food-item {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

/* Force exposure mark to never shrink, even when food name is long */
.preview-grid__exposure-mark {
  width: 12px;
  height: 12px;
  min-width: 12px;
  border-radius: 50%;
  flex-shrink: 0;
  flex-grow: 0;
  /* Default: amber while loading / unknown */
  background: #f59e0b !important;
  border: 2px solid rgba(255,255,255,0.95);
  box-shadow: 0 0 0 1px rgba(0,0,0,0.1);
}
.preview-grid__exposure-mark--new {
  background: #22c55e !important;
}
.preview-grid__exposure-mark--exploring {
  background: #f59e0b !important;
}

.preview-grid__food-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  flex-shrink: 0;
}

.preview-grid__food-dot--astringent { background: #ef4444; }
.preview-grid__food-dot--laxative { background: #22c55e; }
.preview-grid__food-dot--neutral { background: #9ca3af; }

/* Compact exposure mark after food name */
.preview-grid__exposure-mark {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  /* Default: amber while loading / unknown */
  background: #f59e0b !important;
  border: 1.5px solid rgba(255,255,255,0.9);
}
.preview-grid__exposure-mark--new {
  background: #22c55e !important;
}
.preview-grid__exposure-mark--exploring {
  background: #f59e0b !important;
}

.preview-grid__food-name {
  font-family: var(--md3-font-body);
  font-size: var(--md3-label-sm);
  color: var(--md3-on-surface-variant);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.preview-grid__empty-dash {
  color: var(--md3-outline-variant);
  font-size: var(--md3-body-sm);
  align-self: center;
}

/* ─── Food summary line (mobile) ─── */
.food-summary {
  display: flex;
  align-items: center;
  gap: 3px;
  flex-wrap: wrap;
  row-gap: 1px;
  overflow: hidden;
  max-height: 2.4em;
}

.food-summary__dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  flex-shrink: 0;
}

.food-summary__dot--astringent { background: #ef4444; }
.food-summary__dot--laxative { background: #22c55e; }
.food-summary__dot--neutral { background: #9ca3af; }

/* Compact exposure indicator dot (mobile food summary) */
.food-summary__exposure-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.food-summary__exposure-dot--new {
  background: var(--md3-tertiary, #006c4c);
}
.food-summary__exposure-dot--exploring {
  background: var(--md3-secondary, #f59e0b);
}

.food-summary__name {
  font-family: var(--md3-font-body);
  font-size: var(--md3-label-sm);
  color: var(--md3-on-surface-variant);
}

.food-summary__sep {
  color: var(--md3-outline-variant);
  font-size: var(--md3-label-sm);
}

/* ─── Mobile plate container ─── */
.mobile-plate-container {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-1);
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.food-chips-scroll {
  display: flex;
  gap: var(--md3-space-1);
  overflow-x: auto;
  padding-bottom: 2px;
  scrollbar-width: none;
}

.food-chips-scroll::-webkit-scrollbar {
  height: 4px;
}

.food-chips-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.food-chips-scroll::-webkit-scrollbar-thumb {
  background: var(--md3-outline-variant);
  border-radius: 2px;
}

.food-chip {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 2px 6px;
  background: var(--md3-surface-container-low);
  border-radius: var(--md3-rounded-sm);
  flex-shrink: 0;
  border-left: 2.5px solid transparent;
}

.food-chip--astringent {
  border-left-color: #ef4444;
}

.food-chip--laxative {
  border-left-color: #22c55e;
}

.food-chip--neutral {
  border-left-color: #9ca3af;
}

.food-chip__name {
  font-family: var(--md3-font-body);
  font-size: var(--md3-label-sm);
  color: var(--md3-on-surface-variant);
  white-space: nowrap;
}

.add-slot-btn--loading {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ─── Score classes ─── */
.score--balanced { color: var(--md3-primary); }
.score--unbalanced { color: var(--md3-error); }
.score--neutral { color: var(--md3-on-surface-variant); }

/* ─── Mobile view ─── */
.mobile-view {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-3);
  min-width: 0;
}

.day-tabs {
  display: flex;
  gap: var(--md3-space-1);
  overflow-x: auto;
  padding-bottom: var(--md3-space-1);
  scrollbar-width: none;
}

.day-tabs::-webkit-scrollbar {
  display: none;
}

.day-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--md3-space-1);
  padding: var(--md3-space-2) var(--md3-space-3);
  border: none;
  background: var(--md3-surface-container-low);
  border-radius: var(--md3-rounded-md);
  cursor: pointer;
  flex-shrink: 0;
  transition: background var(--md3-transition-fast);
}

.day-tab--active {
  background: var(--md3-primary-container);
}

.day-tab__short {
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-md);
  font-weight: var(--md3-weight-semibold);
  text-transform: uppercase;
  letter-spacing: var(--md3-label-tracking);
  color: var(--md3-on-surface-variant);
}

.day-tab--active .day-tab__short {
  color: var(--md3-on-primary-container);
}

.day-tab__number {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-body-md);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
  border-radius: var(--md3-rounded-full);
}

.day-tab__number--today {
  background: var(--md3-primary);
  color: var(--md3-on-primary);
}

/* ─── Day panel (mobile) ─── */
.day-panel {
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-2);
  min-width: 0;
}

.day-panel[hidden] {
  display: none;
}

.meal-row {
  display: flex;
  align-items: flex-start;
  gap: var(--md3-space-2);
  padding: var(--md3-space-2) var(--md3-space-3);
  background: var(--md3-surface-container-lowest);
  border-radius: var(--md3-rounded-md);
  border: 1px solid var(--md3-outline-variant);
  min-height: 48px;
  min-width: 0;
  overflow: hidden;
}

.meal-row__meta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 44px;
  padding-top: 2px;
}

.meal-row__icon {
  font-size: 1.25rem;
  color: var(--md3-on-surface-variant);
}

.meal-row--desayuno .meal-row__icon { color: var(--md3-tertiary); }
.meal-row--comida .meal-row__icon { color: var(--md3-primary); }
.meal-row--cena .meal-row__icon { color: var(--md3-secondary); }

.meal-row__name {
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-sm);
  font-weight: var(--md3-weight-semibold);
  text-transform: uppercase;
  letter-spacing: var(--md3-label-tracking);
  color: var(--md3-on-surface-variant);
}

/* ─── Plate row chip (mobile) ─── */
.plate-row-chip {
  display: flex;
  align-items: center;
  gap: var(--md3-space-1);
  flex: 1;
  min-width: 0;
  padding: 4px 8px;
  background: var(--md3-surface-container);
  border-radius: var(--md3-rounded-sm);
}

.plate-row-chip__score .material-symbols-outlined {
  font-size: 1rem;
}

.plate-row-chip__name {
  flex: 1;
  min-width: 0;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  font-weight: var(--md3-weight-medium);
  color: var(--md3-on-surface);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.plate-row-chip__serve {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  border: none;
  background: transparent;
  color: var(--md3-primary);
  border-radius: var(--md3-rounded-full);
  cursor: pointer;
  transition: background var(--md3-transition-fast), color var(--md3-transition-fast);
}

.plate-row-chip__serve:active {
  background: var(--md3-primary-container);
}

.plate-row-chip__serve--served {
  color: var(--md3-primary);
}

.plate-row-chip__serve--served .material-symbols-outlined {
  font-variation-settings: 'FILL' 1;
}

.plate-row-chip__serve .material-symbols-outlined {
  font-size: 1.125rem;
}

.plate-row-chip__serve-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid var(--md3-outline-variant);
  border-top-color: var(--md3-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.plate-row-chip__remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  border: none;
  background: transparent;
  color: var(--md3-on-surface-variant);
  border-radius: var(--md3-rounded-full);
  cursor: pointer;
  transition: background var(--md3-transition-fast), color var(--md3-transition-fast);
}

.plate-row-chip__remove:hover {
  background: var(--md3-error-container);
  color: var(--md3-error);
}

.plate-row-chip__remove .material-symbols-outlined {
  font-size: 0.875rem;
}

.plate-row-chip--loading {
  opacity: 0.6;
  pointer-events: none;
}

/* ─── Add row button (mobile) ─── */
.add-row-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--md3-space-2);
  flex: 1;
  padding: var(--md3-space-2) var(--md3-space-3);
  min-width: 44px;
  min-height: 44px;
  border: 1.5px dashed var(--md3-outline-variant);
  border-radius: var(--md3-rounded-sm);
  background: transparent;
  color: var(--md3-on-surface-variant);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-medium);
  cursor: pointer;
  transition: border-color var(--md3-transition-fast), background var(--md3-transition-fast), color var(--md3-transition-fast);
}

.add-row-btn:hover {
  border-color: var(--md3-primary);
  background: var(--md3-surface-container-low);
  color: var(--md3-primary);
}

.add-row-btn .material-symbols-outlined {
  font-size: 1.25rem;
}

/* ─── Summary section ─── */
.summary-section {
  background: var(--md3-surface-container-lowest);
  border-radius: var(--md3-rounded-md);
  padding: var(--md3-space-6);
  box-shadow: var(--md3-shadow-soft);
}

.summary-title {
  display: flex;
  align-items: center;
  gap: var(--md3-space-2);
  margin: 0 0 var(--md3-space-4);
  font-family: var(--md3-font-headline);
  font-size: var(--md3-headline-sm);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
}

.summary-title__icon {
  font-size: 1.5rem;
  color: var(--md3-primary);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--md3-space-3);
}

@media (max-width: 480px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
}

.summary-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--md3-space-2);
  padding: var(--md3-space-4) var(--md3-space-3);
  border-radius: var(--md3-rounded-md);
  text-align: center;
}

.summary-card--balanced {
  background: var(--md3-primary-container);
}

.summary-card--total {
  background: var(--md3-surface-container);
}

.summary-card--empty {
  background: var(--md3-surface-container-high);
}

.summary-card__value {
  font-family: var(--md3-font-headline);
  font-size: var(--md3-headline-lg);
  font-weight: var(--md3-weight-bold);
  color: var(--md3-on-surface);
  line-height: 1;
}

.summary-card--balanced .summary-card__value {
  color: var(--md3-on-primary-container);
}

.summary-card__icon {
  font-size: 1.5rem;
}

.summary-card--balanced .summary-card__icon { color: var(--md3-primary); }
.summary-card--total .summary-card__icon { color: var(--md3-on-surface-variant); }
.summary-card--empty .summary-card__icon { color: var(--md3-outline); }

.summary-card__label {
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-md);
  font-weight: var(--md3-weight-medium);
  color: var(--md3-on-surface-variant);
}

.summary-card--balanced .summary-card__label {
  color: var(--md3-on-primary-container);
}

/* ─── Dialog / Plate picker ─── */
.dialog-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(11, 15, 15, 0.4);
  backdrop-filter: var(--md3-glass-blur-sm);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
  padding: 0;
}

@media (min-width: 600px) {
  .dialog-backdrop {
    align-items: center;
    padding: var(--md3-space-6);
  }
}

.dialog {
  width: 100%;
  max-width: 480px;
  max-height: 70vh;
  background: var(--md3-surface-container-lowest);
  border-radius: var(--md3-rounded-lg) var(--md3-rounded-lg) 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: var(--md3-shadow-ambient);
}

@media (min-width: 600px) {
  .dialog {
    border-radius: var(--md3-rounded-lg);
    max-height: 80vh;
  }
}

.dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--md3-space-4) var(--md3-space-6);
  border-bottom: 1.5px solid var(--md3-outline-variant);
  flex-shrink: 0;
}

.dialog__title {
  margin: 0;
  font-family: var(--md3-font-headline);
  font-size: var(--md3-title-lg);
  font-weight: var(--md3-weight-semibold);
  color: var(--md3-on-surface);
}

.dialog__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  color: var(--md3-on-surface-variant);
  border-radius: var(--md3-rounded-full);
  cursor: pointer;
  transition: background var(--md3-transition-fast);
}

.dialog__close:hover {
  background: var(--md3-surface-container-low);
}

.dialog__close .material-symbols-outlined {
  font-size: 1.25rem;
}

/* ─── Picker states ─── */
.picker-loading,
.picker-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--md3-space-3);
  padding: var(--md3-space-12) var(--md3-space-6);
  color: var(--md3-on-surface-variant);
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
}

.picker-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--md3-surface-container-high);
  border-top-color: var(--md3-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.picker-empty__icon {
  font-size: 3rem;
  color: var(--md3-outline);
}

.picker-empty__link {
  display: inline-flex;
  padding: 0.5rem 1.25rem;
  background: var(--md3-primary);
  color: var(--md3-on-primary);
  border: none;
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-semibold);
  text-decoration: none;
  cursor: pointer;
  transition: background var(--md3-transition-fast);
}

.picker-empty__link:hover {
  background: var(--md3-primary-dim);
}

/* ─── Picker plate list ─── */
.picker-list {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  flex: 1;
}

.picker-item {
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid var(--md3-surface-container-low);
  transition: background var(--md3-transition-fast);
}

.picker-item:last-child {
  border-bottom: none;
}

.picker-item--expanded {
  background: var(--md3-surface-container-low);
}

.picker-item__header {
  display: flex;
  align-items: center;
  gap: var(--md3-space-3);
  padding: var(--md3-space-3) var(--md3-space-6);
  cursor: pointer;
  transition: background var(--md3-transition-fast);
}

.picker-item__header:hover {
  background: var(--md3-surface-container-low);
}

.picker-item__score {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.picker-item__score .material-symbols-outlined {
  font-size: 1.25rem;
}

.picker-item__name {
  flex: 1;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  font-weight: var(--md3-weight-medium);
  color: var(--md3-on-surface);
}

.picker-item__meta {
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-sm);
  color: var(--md3-on-surface-variant);
  flex-shrink: 0;
}

.picker-item__arrow {
  font-size: 1.25rem;
  color: var(--md3-outline);
  flex-shrink: 0;
  transition: transform var(--md3-transition-fast);
}

.picker-item__arrow--open {
  transform: rotate(180deg);
}

/* ─── Picker detail (expanded) ─── */
.picker-item__detail {
  padding: 0 var(--md3-space-6) var(--md3-space-4);
}

.picker-food-list {
  list-style: none;
  margin: 0 0 var(--md3-space-3) 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--md3-space-1);
}

.picker-food-item {
  display: flex;
  align-items: center;
  gap: var(--md3-space-2);
  padding: var(--md3-space-1) 0;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  color: var(--md3-on-surface-variant);
}

.picker-food-item__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.picker-food-item__dot--astringent {
  background: var(--md3-error, #ba1a1a);
}

.picker-food-item__dot--laxative {
  background: var(--md3-tertiary, #006c4c);
}

.picker-food-item__dot--neutral {
  background: var(--md3-outline, #73796e);
}

.picker-food-item__name {
  flex: 1;
}

.picker-food-item__group {
  font-size: var(--md3-label-sm);
  color: var(--md3-outline);
}

.picker-food-empty {
  margin: 0 0 var(--md3-space-3) 0;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-sm);
  color: var(--md3-outline);
}

.picker-select-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--md3-space-2);
  width: 100%;
  padding: var(--md3-space-2) var(--md3-space-4);
  background: var(--md3-primary);
  color: var(--md3-on-primary);
  border: none;
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-semibold);
  cursor: pointer;
  transition: background var(--md3-transition-fast);
}

.picker-select-btn:hover {
  background: var(--md3-primary-dim);
}

.picker-select-btn .material-symbols-outlined {
  font-size: 1.125rem;
}

/* ─── Create new plate button in picker ─── */
.picker-create-item {
  list-style: none;
  padding: var(--md3-space-2) 0;
}

.picker-create-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--md3-space-2);
  width: 100%;
  padding: var(--md3-space-3) var(--md3-space-4);
  background: transparent;
  color: var(--md3-primary);
  border: 2px dashed var(--md3-outline-variant);
  border-radius: var(--md3-rounded-lg);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-semibold);
  cursor: pointer;
  transition: background var(--md3-transition-fast), border-color var(--md3-transition-fast);
}

.picker-create-btn:hover {
  background: var(--md3-primary-container);
  border-color: var(--md3-primary);
}

.picker-create-btn .material-symbols-outlined {
  font-size: 1.25rem;
}

/* ─── Dialog transition ─── */
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity var(--md3-transition-normal);
}

.dialog-fade-enter-active .dialog,
.dialog-fade-leave-active .dialog {
  transition: transform var(--md3-transition-normal);
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}

.dialog-fade-enter-to,
.dialog-fade-leave-from {
  opacity: 1;
}

.dialog-fade-enter-from .dialog {
  transform: translateY(20px);
}

.dialog-fade-enter-to .dialog,
.dialog-fade-leave-from .dialog {
  transform: translateY(0);
}

.dialog-fade-leave-to .dialog {
  transform: translateY(20px);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ─── Serve button ─── */
.serve-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--md3-space-1);
  width: 100%;
  padding: var(--md3-space-1) var(--md3-space-2);
  border: 1.5px solid var(--md3-outline-variant);
  border-radius: var(--md3-rounded-sm);
  background: transparent;
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-sm);
  font-weight: var(--md3-weight-semibold);
  cursor: pointer;
  transition: all var(--md3-transition-fast);
  margin-top: var(--md3-space-1);
}

.serve-btn__icon {
  font-size: 0.875rem;
}

.serve-btn__spinner {
  width: 14px;
  height: 14px;
  border: 2px solid var(--md3-outline-variant);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

/* Ready state: primary outline */
.serve-btn--ready {
  color: var(--md3-primary);
  border-color: var(--md3-primary);
}

.serve-btn--ready:hover:not(:disabled) {
  background: var(--md3-primary-container);
}

/* Served state: filled, secondary */
.serve-btn--served {
  color: var(--md3-on-secondary);
  background: var(--md3-secondary);
  border-color: var(--md3-secondary);
}

.serve-btn--served:hover:not(:disabled) {
  background: var(--md3-secondary-dim, var(--md3-secondary));
  opacity: 0.9;
}

.serve-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Mobile serve button adjustments */
.serve-btn--mobile {
  margin-top: var(--md3-space-2);
  padding: var(--md3-space-2) var(--md3-space-3);
}

/* ─── Confirmation dialog styles ─── */
.dialog--confirm {
  max-width: 360px;
  text-align: center;
}

.dialog__header--confirm {
  flex-direction: column;
  gap: var(--md3-space-3);
  padding-bottom: var(--md3-space-3);
  border-bottom: none;
}

.dialog__confirm-icon {
  font-size: 2.5rem;
  color: var(--md3-tertiary);
}

.dialog__body {
  padding: 0 var(--md3-space-6) var(--md3-space-4);
}

.dialog__text {
  margin: 0;
  font-family: var(--md3-font-body);
  font-size: var(--md3-body-md);
  color: var(--md3-on-surface-variant);
  line-height: 1.5;
}

.dialog__actions {
  display: flex;
  gap: var(--md3-space-2);
  padding: var(--md3-space-3) var(--md3-space-6) var(--md3-space-6);
  justify-content: flex-end;
}

.dialog__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--md3-space-2) var(--md3-space-4);
  border: none;
  border-radius: var(--md3-rounded-full);
  font-family: var(--md3-font-label);
  font-size: var(--md3-label-lg);
  font-weight: var(--md3-weight-semibold);
  cursor: pointer;
  transition: background var(--md3-transition-fast);
}

.dialog__btn--secondary {
  background: transparent;
  color: var(--md3-on-surface-variant);
}

.dialog__btn--secondary:hover {
  background: var(--md3-surface-container-low);
}

.dialog__btn--primary {
  background: var(--md3-primary);
  color: var(--md3-on-primary);
}

.dialog__btn--primary:hover {
  background: var(--md3-primary-dim);
}
</style>
