<template>
    <div class="min-h-screen bg-gray-100 py-8">
        <div class="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
            <h1 class="text-2xl font-bold text-gray-800 mb-6 text-center">Preview Your Answers</h1>
            <div v-if="unansweredQuestions.length > 0" class="text-red-600 mb-4">
                <p>Please answer all questions before submitting:</p>
                <ul>
                    <li v-for="question in unansweredQuestions" :key="question.id">
                        {{ question.text }}
                    </li>
                </ul>
            </div>
            <div v-else class="text-green-600 mb-4">
                <p>All questions answered! You can submit your responses.</p>
            </div>
            <div v-for="question in questions" :key="question.id" class="mb-4">
                <h2 class="text-xl font-semibold text-gray-700">{{ question.text }}</h2>
                <p class="text-gray-600">Your answer: {{ answers[question.id] || 'No answer provided' }}</p>
                <button @click="goToQuestion(question.id)" class="text-blue-500 underline">Edit</button> <!-- Edit button -->
            </div>
            <button @click="submit" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">
                Submit
            </button>
        </div>
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
        const questions = computed(() => store.state.questions);
        const answers = computed(() => store.state.answers);

        const unansweredQuestions = computed(() => {
            return questions.value.filter(question => !answers.value[question.id]);
        });

        const goToQuestion = (questionId: string) => {
            const questionIndex = questions.value.findIndex(q => q.id === questionId);
            if (questionIndex !== -1) {
                store.state.currentQuestionIndex = questionIndex;
                router.push({ name: "SurveyPage" });
            }
        };

        const submit = () => {
            router.push({ name: "SuccessPage" }); 
        };

        return {
            questions,
            answers,
            unansweredQuestions,
            goToQuestion,
            submit,
        };
    },
});
</script>

<style>
@import '@/assets/tailwind.css';
</style>