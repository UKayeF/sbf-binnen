#!/bin/bash

set -e

echo "Quiz Template Scaffolder"
echo "========================="
echo ""

read -p "Enter project name (e.g., my-quiz): " PROJECT_NAME

if [ -z "$PROJECT_NAME" ]; then
  echo "Error: Project name cannot be empty"
  exit 1
fi

if [ -d "$PROJECT_NAME" ]; then
  read -p "Directory '$PROJECT_NAME' already exists. Overwrite? (y/N): " CONFIRM
  if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "Aborted"
    exit 1
  fi
  rm -rf "$PROJECT_NAME"
fi

echo ""
echo "Creating project structure..."

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cp -r "$SCRIPT_DIR" "$PROJECT_NAME"

if [ -f "$PROJECT_NAME/package.json" ]; then
  sed -i '' "s/quiz-template/$PROJECT_NAME/g" "$PROJECT_NAME/package.json"
  sed -i '' "s/Quiz application/$PROJECT_NAME quiz application/g" "$PROJECT_NAME/package.json"
fi

if [ -f "$PROJECT_NAME/vite.config.ts" ]; then
  sed -i '' "s/name: 'Quiz App'/name: '$PROJECT_NAME'/" "$PROJECT_NAME/vite.config.ts"
  sed -i '' "s/short_name: 'Quiz'/short_name: '$PROJECT_NAME'/" "$PROJECT_NAME/vite.config.ts"
  sed -i '' "s/description: 'Quiz application'/description: '$PROJECT_NAME quiz application'/" "$PROJECT_NAME/vite.config.ts"
fi

if [ -f "$PROJECT_NAME/src/index.html" ]; then
  sed -i '' "s/<title>Quiz<\/title>/<title>$PROJECT_NAME<\/title>/" "$PROJECT_NAME/src/index.html"
  sed -i '' "s/content=\"Quiz application\"/content=\"$PROJECT_NAME quiz application\"/" "$PROJECT_NAME/src/index.html"
fi

if [ -f "$PROJECT_NAME/src/models/quizConfig.ts" ]; then
  sed -i '' "s/\"Category 1\"/\"General\"/g" "$PROJECT_NAME/src/models/quizConfig.ts"
  sed -i '' "s/\"Category 2\"/\"Advanced\"/g" "$PROJECT_NAME/src/models/quizConfig.ts"
fi

echo ""
echo "Project created: $PROJECT_NAME"
echo ""
echo "Next steps:"
echo "  1. cd $PROJECT_NAME"
echo "  2. npm install"
echo "  3. Edit src/data/fragen.json with your questions"
echo "  4. Edit src/models/quizConfig.ts with your categories"
echo "  5. Edit src/index.html and vite.config.ts with your app name"
echo "  6. npm run dev"
echo ""
echo "Good luck with your quiz!"