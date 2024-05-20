<script setup>
import Icon from './Icon.vue'

const { icon, color, selectedColor, iconColor, size } = defineProps(['title', 'icon', 'color', 'selectedColor', 'iconColor', 'size'])

const height = size + 'px'
const radius = Number(size) / 2 + 'px'
</script>

<template>
  <div class="container">
    <Icon class="icon" :name="icon" :color="iconColor" :selected-color="iconColor"></Icon>
  </div>
</template>

<style scoped>
.container {
  height: v-bind(height);
  width: v-bind(height);

  border-radius: v-bind(radius);
  background-color: v-bind(color);
  text-align: center;
  transition: 0.1s;
}

.container:hover {
  background-color: v-bind(selectedColor);
}

.icon {
  width: 100%;
  height: 100%;
}
</style>
