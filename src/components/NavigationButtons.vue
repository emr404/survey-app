<template>
    <div class="flex justify-between mt-8">
        <button @click="previous" :disabled="isFirstQuestion" class="px-6 py-2 rounded-lg font-medium transition-colors duration-200
            disabled:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50
            enabled:bg-blue-600 enabled:hover:bg-blue-700 enabled:text-white">
            Previous
        </button>
        <button @click="next" :disabled="isLastQuestion" class="px-6 py-2 rounded-lg font-medium transition-colors duration-200
            disabled:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50
            enabled:bg-blue-600 enabled:hover:bg-blue-700 enabled:text-white">
            Next
        </button>
        <button @click="submit" v-if="isLastQuestion" class="px-6 py-2 rounded-lg font-medium transition-colors duration-200
            enabled:bg-blue-600 enabled:hover:bg-blue-700 enabled:text-white">
            Submit
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

        const next = () => store.dispatch("nextQuestion");
        const previous = () => store.dispatch("previousQuestion");

        const submit = () => {
            router.push({ name: "SuccessPage" });
        };

        return {
            isFirstQuestion,
            isLastQuestion,
            next,
            previous,
            submit,
        };
    },
});
</script>