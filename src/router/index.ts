import { createRouter, createWebHistory } from 'vue-router';
import SurveyPage from '@/pages/SurveyPage.vue';

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'SurveyPage', component: SurveyPage },
    { path: '/preview', name: 'PreviewAnswers', component: () => import('@/pages/PreviewAnswers.vue') },
    { path: '/results', alias: '/success', name: 'SuccessPage', component: () => import('@/pages/SuccessPage.vue') },
    { path: '/compare', component: () => import('@/pages/ComparePage.vue') },
    { path: '/destination/:id', component: () => import('@/pages/DestinationPage.vue') },
    { path: '/itinerary', component: () => import('@/pages/ItineraryPage.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior(_to, _from, saved) { return saved || { top: 0 }; },
});
