export interface Question {
	id: string;
	text: string;
	options: string[];
}

export interface SurveyState {
	currentQuestionIndex: number;
	answers: Record<string, string>;
	questions: Question[];
}