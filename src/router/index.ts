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
  scrollBehavior(_to, _from, saved) { return saved || { top: 0 }; },
});
