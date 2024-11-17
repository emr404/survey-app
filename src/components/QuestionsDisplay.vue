<template>
    <div class="space-y-6">
        <h2 class="text-xl font-semibold text-gray-700">{{ currentQuestion?.text }}</h2>
        <div class="space-y-3">
            <div v-for="option in currentQuestion?.options" :key="option" class="flex items-center">
                <label class="flex items-center space-x-3 w-full p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input type="radio" :value="option" v-model="selectedAnswer"
                        class="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                    <span class="text-gray-700">{{ option }}</span>
                </label>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";
import { useStore } from "@/store/index";

export default defineComponent({
    setup() {
        const store = useStore();
        const currentQuestion = computed(
            () => store.state.questions[store.state.currentQuestionIndex]
        );

        const selectedAnswer = computed({
            get: () => store.state.answers[currentQuestion.value?.id || ""] || "",
            set: (value: string) => {
                if (currentQuestion.value) {
                    store.dispatch("saveAnswer", {
                        questionId: currentQuestion.value.id,
                        answer: value,
                    });
                }
            },
        });

        return {
            currentQuestion,
            selectedAnswer,
        };
    }
});
</script>
