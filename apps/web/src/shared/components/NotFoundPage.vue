<template>
  <div class="not-found">
    <h1>404</h1>
    <p>Página no encontrada</p>
    <RouterLink to="/" class="btn">Ir al inicio</RouterLink>
  </div>
</template>

<style scoped>
.not-found { text-align: center; padding: 4rem 1rem; }
.not-found h1 { font-size: 6rem; color: #d1d5db; margin: 0; }
.btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background: #16a34a;
  color: white;
  border-radius: 0.5rem;
  text-decoration: none;
}
</style>
