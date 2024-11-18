<template>
    <div class="min-h-screen bg-gray-100 py-4 sm:py-8">
        <div class="w-full max-w-sm sm:max-w-md mx-auto bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <h1 class="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 text-center">
                Travel Companion
            </h1>
            <QuestionDisplay />
            <NavigationButtons />
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, onMounted } from "vue";
import { useStore } from "@/store/index";
import questions from "@/data/questions.json";
import QuestionDisplay from "@/components/QuestionsDisplay.vue";
import NavigationButtons from "@/components/NavigationButtons.vue";

export default defineComponent({
    components: {
        QuestionDisplay,
        NavigationButtons,
    },
    setup() {
        const store = useStore();

        onMounted(() => {
            store.dispatch("loadQuestions", questions);
        });
    },
});
</script>

<style>
@import '@/assets/tailwind.css';
</style>