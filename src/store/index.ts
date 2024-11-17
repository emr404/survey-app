import { createStore, Store, useStore as baseUseStore } from "vuex";
import { InjectionKey } from "vue";
import { SurveyState, Question } from "@/types/survey";

const persistState = (store: Store<SurveyState>) => {
	const savedState = localStorage.getItem("survey-state");
	if (savedState) {
		store.replaceState(JSON.parse(savedState));
	}

	store.subscribe((mutation, state) => {
		localStorage.setItem("survey-state", JSON.stringify(state));
	});
};

export const key: InjectionKey<Store<SurveyState>> = Symbol();

export const store = createStore<SurveyState>({
	state: {
		currentQuestionIndex: 0,
		answers: {},
		questions: [],
	},
	mutations: {
		SET_QUESTIONS(state, questions: Question[]) {
			state.questions = questions;
		},
		SET_ANSWER(
			state,
			{ questionId, answer }: { questionId: string; answer: string }
		) {
			state.answers[questionId] = answer;
		},
		NEXT_QUESTION(state) {
			if (state.currentQuestionIndex < state.questions.length - 1) {
				state.currentQuestionIndex++;
			}
		},
		PREVIOUS_QUESTION(state) {
			if (state.currentQuestionIndex > 0) {
				state.currentQuestionIndex--;
			}
		},
		RESET_SURVEY(state) {
			state.currentQuestionIndex = 0;
			state.answers = {};
			localStorage.removeItem("survey-state");
		},
	},
	actions: {
		loadQuestions({ commit }, questions: Question[]) {
			commit("SET_QUESTIONS", questions);
		},
		saveAnswer({ commit }, payload: { questionId: string; answer: string }) {
			commit("SET_ANSWER", payload);
		},
		nextQuestion({ commit }) {
			commit("NEXT_QUESTION");
		},
		previousQuestion({ commit }) {
			commit("PREVIOUS_QUESTION");
		},
		resetSurvey({ commit }) {
			commit("RESET_SURVEY");
		},
	},
	plugins: [persistState],
});

export function useStore() {
	return baseUseStore(key);
}
