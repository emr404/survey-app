<template>
    <div class="flex flex-wrap justify-between items-center gap-4 mt-8 sm:flex-nowrap">
        <button @click="previous" :disabled="isFirstQuestion" class="w-full sm:w-auto px-4 py-2 text-sm sm:text-base rounded-lg font-medium transition-colors duration-200
                disabled:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50
                enabled:bg-blue-600 enabled:hover:bg-blue-700 enabled:text-white">
            Previous
        </button>
        <button @click="next" :disabled="isLastQuestion || !hasAnswered" class="w-full sm:w-auto px-4 py-2 text-sm sm:text-base rounded-lg font-medium transition-colors duration-200
                disabled:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50
                enabled:bg-blue-600 enabled:hover:bg-blue-700 enabled:text-white">
            Next
        </button>
        <button @click="goToPreview" v-if="isLastQuestion && hasAnswered" class="w-full sm:w-auto px-4 py-2 text-sm sm:text-base rounded-lg font-medium transition-colors duration-200
                enabled:bg-blue-600 enabled:hover:bg-blue-700 enabled:text-white">
            Preview Answers
        </button>
    </div>
</template>


<script lang="ts">
import { defineComponent, computed } from "vue";
import { useStore } from "@/store/index";
import { useRouter } from "vue-router";

export default defineComponent({
    setup() {
        const store = useStore();
        const router = useRouter();

        const isFirstQuestion = computed(() => store.state.currentQuestionIndex === 0);
        const isLastQuestion = computed(() => store.state.currentQuestionIndex === store.state.questions.length - 1);

        const hasAnswered = computed(() => {
            const currentQuestion = store.state.questions[store.state.currentQuestionIndex];
            return currentQuestion ? !!store.state.answers[currentQuestion.id] : false;
        });

        const next = () => store.dispatch("nextQuestion");
        const previous = () => store.dispatch("previousQuestion");

        const goToPreview = () => {
            router.push({ name: "PreviewAnswers" }); // Navigate to the preview page
        };

        return {
            isFirstQuestion,
            isLastQuestion,
            hasAnswered,
            next,
            previous,
            goToPreview,
        };
    },
});
</script>