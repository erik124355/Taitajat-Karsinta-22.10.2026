
import { createRouter, createWebHistory } from 'vue-router';

import TapahtumaView from '../views/tapahtuma.vue';

const routes = [
  {
    path: '/',
    name: 'tapahtuma',
    component: TapahtumaView
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
