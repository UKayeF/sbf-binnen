## Metadata
name: Generate Quiz Resources
description: Extract all questions and images from a pdf. The questions will end up in a JSON file, the images in a separate folder and will be linked to within the JSON.

## Steps

1. Ask the user if they want to provide the categories and the ranges of the question numbers per category. If they don't, try to infer them as follows:

The categories will be either in bold or headlines within the pdf file. Each question is preceded by a number and a dot (e.g. "39. Woran kann man erkennen, ob der Anker hält?") - the number is the question number that helps identify the question. The first and last question number mark the ranges per category and should be given to the user to verify their correctness.

2. Once the categories and ranges have been determined, the extraction of questions can begin. The JSON file should be created as an object with one key per category. The schema in typescript should look like this: 
```typescript
    export interface Answer {
      text: string;
      isCorrect: boolean;
    }

    export interface Question {
      question: string;
      answers: Answer[];
      images?: string[];
      needsFix?: boolean;
      questionNumber: number;
    }

    export interface Category {
      [key: string]: Question[];
    }

    export interface QuestionsJson {
      categories: Category;
    }
```

Mind the following rules:
- Questions may go across multiple lines and always end in a question mark. If no question mark is found, prompt the user to complete the question.
- The first answer is always the only correct one. Set the isCorrect flag accordingly.
- Extracted images should end up in a separate images folder and should be named after the question number. (e.g. "42.png")
- If there are multiple images for the same question, distinguish them by adding dashes (e.g. "42-1.png", "42-2.png").
- The image paths should be included in the images array of the question (identified by key questionNumber)

3. When done, verify that every image is referenced exactly once.
4. Verify that each question ends in a question mark. Report any suspicious questions to the user.
5. For each question containing one or more images, prompt the user to verify them. If possible, display the question and image in conjunction (directly in the terminal)
6. Save the json file as questions.json in the current directory and the images in a separte images folder
