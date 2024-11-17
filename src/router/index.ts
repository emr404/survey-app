import { createRouter, createWebHistory } from "vue-router";
import SurveyPage from "@/pages/SurveyPage.vue";
import SuccessPage from "@/pages/SuccessPage.vue";

const routes = [
    {
        path: "/",
        name: "SurveyPage",
        component: SurveyPage,
    },
    {
        path: "/success",
        name: "SuccessPage",
        component: SuccessPage,
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;