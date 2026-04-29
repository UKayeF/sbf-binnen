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
    Basisfragen: {
      questionsCount: 7,
      passingThreshold: 5,
    },
    "Spezifische Fragen Binnen": {
      questionsCount: 23,
      passingThreshold: 20,
    },
    "Spezifische Fragen Segeln": {
      questionsCount: 7,
      passingThreshold: 5,
    },
  },
  totalPassingThreshold: 30,
};

export const testImageQuizConfig: QuizConfig = {
  categories: {
    "Bilder-Tests": {
      questionsCount: 100, // High enough to include all image questions
      passingThreshold: 0,
    },
  },
  totalPassingThreshold: 0,
};

export const imageOnlyQuizConfig: QuizConfig = {
  categories: {
    "Bilder-Quiz (nur Fragen mit Bildern)": {
      questionsCount: 100,
      passingThreshold: 0,
    },
  },
  totalPassingThreshold: 0,
};

