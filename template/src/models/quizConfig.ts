export interface CategoryConfig {
  questionsCount: number;
  passingThreshold: number;
}

export interface QuizConfig {
  categories: Record<string, CategoryConfig>;
  totalPassingThreshold: number;
}

export const defaultQuizConfig: QuizConfig = {
  categories: {
    "Category 1": {
      questionsCount: 10,
      passingThreshold: 7,
    },
    "Category 2": {
      questionsCount: 10,
      passingThreshold: 7,
    },
  },
  totalPassingThreshold: 14,
};