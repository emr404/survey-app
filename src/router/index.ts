import { createRouter, createWebHistory } from "vue-router";
import SurveyPage from "@/pages/SurveyPage.vue";
import SuccessPage from "@/pages/SuccessPage.vue";
import PreviewAnswers from "@/pages/PreviewAnswers.vue";

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
    {
        path: "/preview",
        name: "PreviewAnswers",
        component: PreviewAnswers,
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;