# Quiz Template

A reusable template for creating quiz applications with categories, multiple-choice questions, image support, and results tracking.

## Features

- Multiple categories with configurable question counts and passing thresholds
- Shuffled questions and answer options each round
- Immediate feedback with correct/incorrect highlighting
- Auto-continue option with configurable delay
- Optional confirmation before submitting answers
- Persistent settings via localStorage
- PWA support for offline use
- Image support for questions
- Responsive design

## Project Structure

```
template/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── create-project.sh          # Scaffolding script
├── src/
│   ├── index.html
│   ├── main.ts
│   ├── styles.css
│   ├── models/
│   │   ├── questions.ts      # TypeScript interfaces
│   │   └── quizConfig.ts      # Quiz configuration
│   ├── data/
│   │   └── fragen.json       # Questions data
│   └── public/              # Static assets
```

## Usage

### Create a new quiz project

```bash
./create-project.sh
```

This will:
1. Ask for a project name
2. Copy the template to a new directory
3. Update package.json, vite.config.ts, and index.html with your project name
4. Create sensible default categories

### Manual setup

```bash
# Copy the template directory
cp -r template my-quiz
cd my-quiz

# Install dependencies
npm install

# Start development server
npm run dev
```

## Configuration

### Questions (`src/data/fragen.json`)

```json
{
  "categories": {
    "My Category": [
      {
        "question": "What is 2 + 2?",
        "answers": [
          { "text": "4", "isCorrect": true },
          { "text": "3", "isCorrect": false },
          { "text": "5", "isCorrect": false },
          { "text": "6", "isCorrect": false }
        ],
        "image": "data/images/question1.png"
      }
    ]
  }
}
```

### Categories (`src/models/quizConfig.ts`)

```typescript
export const defaultQuizConfig: QuizConfig = {
  categories: {
    "My Category": {
      questionsCount: 10,
      passingThreshold: 7,
    },
  },
  totalPassingThreshold: 7,
};
```

### PWA Configuration (`vite.config.ts`)

Update the manifest section with your app name and theme colors.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run typecheck` - Run TypeScript type checking
- `npm run deploy` - Build and deploy to GitHub Pages

## Adding Images

Place images in `src/data/images/` and reference them in the question:

```json
{
  "question": "What does this sign mean?",
  "image": "data/images/sign42.png",
  "answers": [...]
}
```

For multiple images:

```json
{
  "question": "Compare these signs...",
  "images": ["data/images/sign1.png", "data/images/sign2.png"],
  "answers": [...]
}
```