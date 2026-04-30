import { QuestionsJson, Question } from './models/questions';
import { QuizConfig, defaultQuizConfig } from './models/quizConfig';
import fragenData from './data/fragen.json';

interface AppSettings {
  autoContinue: boolean;
  confirmBeforeSubmitting: boolean;
}

const defaultSettings: AppSettings = {
  autoContinue: true,
  confirmBeforeSubmitting: false
};

function loadSettings(): AppSettings {
  const stored = localStorage.getItem('quizSettings');
  if (stored) {
    return { ...defaultSettings, ...JSON.parse(stored) };
  }
  return { ...defaultSettings };
}

function saveSettings(settings: AppSettings): void {
  localStorage.setItem('quizSettings', JSON.stringify(settings));
}

interface QuizState {
  currentCategory: string;
  currentQuestionIndex: number;
  questions: Question[];
  answers: { question: string; selected: number; correct: boolean }[];
  categoryScores: Record<string, number>;
  showFeedback: boolean;
  lastSelectedIndex: number;
}

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function selectQuestions(questions: Question[], count: number): Question[] {
  return shuffle(questions).slice(0, count);
}

function shuffleAnswers(question: Question): Question {
  return {
    ...question,
    answers: shuffle(question.answers)
  };
}

function initQuiz(config: QuizConfig): QuizState {
  const state: QuizState = {
    currentCategory: '',
    currentQuestionIndex: 0,
    questions: [],
    answers: [],
    categoryScores: {},
    showFeedback: false,
    lastSelectedIndex: -1
  };

  for (const [categoryName, categoryConfig] of Object.entries(config.categories)) {
    const categoryQuestions = (fragenData as QuestionsJson).categories[categoryName];
    if (categoryQuestions) {
      const selected = selectQuestions(categoryQuestions, categoryConfig.questionsCount);
      state.questions.push(...selected.map(shuffleAnswers));
      state.categoryScores[categoryName] = 0;
    }
  }

  if (state.questions.length > 0) {
    state.currentCategory = Object.keys(config.categories)[0];
  }

  return state;
}

function renderQuestion(state: QuizState, config: QuizConfig, showFeedback: boolean = false, selectedIndex: number = -1, confirmBeforeSubmitting: boolean = false): string {
  if (state.currentQuestionIndex >= state.questions.length) {
    return renderResults(state, config);
  }

  const question = state.questions[state.currentQuestionIndex];
  const categoryIndex = state.questions.slice(0, state.currentQuestionIndex)
    .filter((_, i) => getCategoryForQuestion(state, i) === state.currentCategory).length;
  const categoryConfig = config.categories[state.currentCategory] || { questionsCount: state.questions.length, passingThreshold: 0 };

  let html = `<h2>${state.currentCategory} (${categoryIndex + 1}/${categoryConfig.questionsCount})</h2>`;
  html += `<p class="question">${question.question}</p>`;
  
  const displayImages = question.image || [];
  for (const img of displayImages) {
    html += `<img class="question-image" src="${img}" alt="Question image" />`;
  }
  
  html += `<div class="answers">`;

  question.answers.forEach((answer, index) => {
    let classes = 'answer-btn';
    if (showFeedback) {
      if (answer.isCorrect) {
        classes += ' correct';
      } else if (index === selectedIndex) {
        classes += ' incorrect';
      }
    }
    html += `<button class="${classes}" data-index="${index}" ${showFeedback ? 'disabled' : ''}>${answer.text}</button>`;
  });

  html += `</div>`;
  
  if (question.needsFix) {
    html += `<p class="needsfix">Image assignment needs to be reviewed</p>`;
  }
  
  if (confirmBeforeSubmitting && !showFeedback) {
    html += `<button id="submit-btn" disabled>Submit</button>`;
  }
  
  if (showFeedback) {
    html += `<button id="next-btn">Next</button>`;
  }
  
  return html;
}

function getCategoryForQuestion(state: QuizState, questionIndex: number): string {
  let questionCount = 0;
  for (const [categoryName, categoryConfig] of Object.entries(defaultQuizConfig.categories)) {
    const nextCount = questionCount + categoryConfig.questionsCount;
    if (questionIndex < nextCount) {
      return categoryName;
    }
    questionCount = nextCount;
  }
  return state.currentCategory;
}

function renderResults(state: QuizState, config: QuizConfig): string {
  let totalScore = 0;
  let html = `<h2>Results</h2><table class="results"><thead><tr><th>Category</th><th>Score</th><th>Passed</th></tr></thead><tbody>`;

  for (const [categoryName, categoryConfig] of Object.entries(config.categories)) {
    const score = state.categoryScores[categoryName] || 0;
    const passed = score >= categoryConfig.passingThreshold;
    if (passed) totalScore += score;
    html += `<tr><td>${categoryName}</td><td>${score}/${categoryConfig.questionsCount}</td><td>${passed ? 'Y' : 'N'}</td></tr>`;
  }

  const totalPassed = totalScore >= config.totalPassingThreshold;
  html += `</tbody></table>`;
  html += `<p class="total">Total: ${totalScore} points - ${totalPassed ? 'PASSED!' : 'FAILED'}</p>`;
  html += `<button id="restart-btn">Restart</button>`;
  html += `<button id="start-over-btn">Start Over</button>`;
  return html;
}

function renderSettingsModal(settings: AppSettings): string {
  return `
    <div id="settings-modal" class="modal">
      <div class="modal-content">
        <h2>Settings</h2>
        <label>
          <input type="checkbox" id="auto-continue" ${settings.autoContinue ? 'checked' : ''}>
          Auto continue after selection (0.5s delay)
        </label>
        <label>
          <input type="checkbox" id="confirm-before-submitting" ${settings.confirmBeforeSubmitting ? 'checked' : ''}>
          Confirm before submitting
        </label>
        <button id="save-settings">Save</button>
        <button id="close-settings">Close</button>
      </div>
    </div>
  `;
}

function renderApp() {
  const app = document.getElementById('app');
  if (!app) return;

  const settings = loadSettings();

  const modalDiv = document.createElement('div');
  modalDiv.id = 'settings-modal-container';
  modalDiv.innerHTML = renderSettingsModal(settings);
  document.body.appendChild(modalDiv);

  const config = defaultQuizConfig;
  const state = initQuiz(config);

  function openSettings() {
    const modalInner = document.getElementById('settings-modal');
    const settingsBtn = document.getElementById('settings-btn');
    
    settingsBtn?.addEventListener('click', () => {
      if (modalInner) modalInner.style.display = 'flex';
    });
    
    document.getElementById('save-settings')?.addEventListener('click', () => {
      const autoContinue = (document.getElementById('auto-continue') as HTMLInputElement)?.checked ?? true;
      const confirmBeforeSubmitting = (document.getElementById('confirm-before-submitting') as HTMLInputElement)?.checked ?? false;
      saveSettings({ autoContinue, confirmBeforeSubmitting });
      if (modalInner) modalInner.style.display = 'none';
    });
    
    document.getElementById('close-settings')?.addEventListener('click', () => {
      if (modalInner) modalInner.style.display = 'none';
    });
  }
  
  function submitAnswer(selectedIndex: number) {
    const question = state.questions[state.currentQuestionIndex];
    const isCorrect = question.answers[selectedIndex].isCorrect;
    
    const currentCat = getCategoryForQuestion(state, state.currentQuestionIndex);
    if (isCorrect) {
      state.categoryScores[currentCat] = (state.categoryScores[currentCat] || 0) + 1;
    }
    
    state.answers.push({
      question: question.question,
      selected: selectedIndex,
      correct: isCorrect
    });
    
    state.showFeedback = true;
    state.lastSelectedIndex = selectedIndex;
    
    render();
  }

  function render() {
    const headerButtons = `<div class="header"><button id="settings-btn">Settings</button></div>`;
    
    if (state.showFeedback) {
      app!.innerHTML = headerButtons + renderQuestion(state, config, true, state.lastSelectedIndex, false);
      openSettings();
      
      if (settings.autoContinue) {
        setTimeout(() => {
          if (state.currentQuestionIndex < state.questions.length) {
            state.currentQuestionIndex++;
            state.showFeedback = false;
            
            const nextCat = getCategoryForQuestion(state, state.currentQuestionIndex);
            if (nextCat !== state.currentCategory) {
              state.currentCategory = nextCat;
            }
            
            render();
          }
        }, 500);
      }
      
      document.getElementById('next-btn')?.addEventListener('click', () => {
        state.currentQuestionIndex++;
        state.showFeedback = false;
        
        if (state.currentQuestionIndex < state.questions.length) {
          const nextCat = getCategoryForQuestion(state, state.currentQuestionIndex);
          if (nextCat !== state.currentCategory) {
            state.currentCategory = nextCat;
          }
        }
        
        render();
      });
    } else if (state.currentQuestionIndex >= state.questions.length) {
      app!.innerHTML = headerButtons + renderResults(state, config);
      openSettings();
      
      document.getElementById('restart-btn')?.addEventListener('click', () => {
        state.currentQuestionIndex = 0;
        state.showFeedback = false;
        state.answers = [];
        state.categoryScores = {};
        for (const cat of Object.keys(state.categoryScores)) {
          state.categoryScores[cat] = 0;
        }
        render();
      });
      
      document.getElementById('start-over-btn')?.addEventListener('click', () => {
        location.reload();
      });
    } else {
      app!.innerHTML = headerButtons + renderQuestion(state, config, false, -1, settings.confirmBeforeSubmitting);
      openSettings();

      let pendingIndex: number | null = null;

      document.querySelectorAll('.answer-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const target = e.target as HTMLButtonElement;
          const selectedIndex = parseInt(target.dataset.index || '0');
          
          if (settings.confirmBeforeSubmitting) {
            pendingIndex = selectedIndex;
            document.querySelectorAll('.answer-btn').forEach(b => b.classList.remove('selected'));
            target.classList.add('selected');
            const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement | null;
            if (submitBtn) submitBtn.disabled = false;
          } else {
            submitAnswer(selectedIndex);
          }
        });
      });
      
      document.getElementById('submit-btn')?.addEventListener('click', () => {
        if (pendingIndex === null) return;

        const question = state.questions[state.currentQuestionIndex];
        const isCorrect = question.answers[pendingIndex].isCorrect;
        
        const currentCat = getCategoryForQuestion(state, state.currentQuestionIndex);
        if (isCorrect) {
          state.categoryScores[currentCat] = (state.categoryScores[currentCat] || 0) + 1;
        }
        
        state.answers.push({
          question: question.question,
          selected: pendingIndex,
          correct: isCorrect
        });
        
        state.showFeedback = true;
        state.lastSelectedIndex = pendingIndex;
        
        render();
      });
    }
  }

  render();
}

document.addEventListener('DOMContentLoaded', renderApp);