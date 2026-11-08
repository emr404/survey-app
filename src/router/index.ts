import { createRouter, createWebHistory } from 'vue-router';
import SurveyPage from '@/pages/SurveyPage.vue';

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'SurveyPage', component: SurveyPage },
    { path: '/results', name: 'SuccessPage', component: () => import('@/pages/SuccessPage.vue') },
    { path: '/destination/:id', component: () => import('@/pages/DestinationPage.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior(to, from, saved) {
    if (saved) return saved;
    if (to.path === from.path && to.path === '/') return { el: '.preference-form', top: 20 };
    return { top: 0 };
  },
});
