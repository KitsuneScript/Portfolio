document.addEventListener('DOMContentLoaded', () => {
    // Load the quiz list on the index.html
    if (document.getElementById('quiz-list')) {
        fetch('data/quizzes.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok ' + response.statusText);
                }
                return response.json();
            })
            .then(data => {
                const quizList = document.getElementById('quiz-list');
                data.forEach(quiz => {
                    const button = document.createElement('button');
                    button.innerText = quiz.title;
                    button.classList.add('btn');
                    button.addEventListener('click', () => {
                        localStorage.setItem('currentQuiz', JSON.stringify(quiz));
                        window.location.href = 'quiz.html';
                    });
                    quizList.appendChild(button);
                });
            })
            .catch(error => console.error('Error loading quizzes:', error));
    }

    // Load the selected quiz on quiz.html
    if (document.getElementById('question-container')) {
        let currentQuiz = JSON.parse(localStorage.getItem('currentQuiz'));
        if (currentQuiz) {
            document.getElementById('quiz-title').innerText = currentQuiz.title;
            let questions = shuffle(currentQuiz.questions);
            if (questions.length > 50) {
                questions = questions.slice(0, 50);
            }
            let currentQuestionIndex = 0;
            let userAnswers = Array(questions.length).fill(null);
            showQuestion(questions, currentQuestionIndex, userAnswers);
            renderQuestionBar(questions, userAnswers);

            document.getElementById('prev-btn').addEventListener('click', () => {
                if (currentQuestionIndex > 0) {
                    currentQuestionIndex--;
                    showQuestion(questions, currentQuestionIndex, userAnswers);
                }
            });

            document.getElementById('next-btn').addEventListener('click', () => {
                if (currentQuestionIndex < questions.length - 1) {
                    currentQuestionIndex++;
                    showQuestion(questions, currentQuestionIndex, userAnswers);
                }
            });

            document.getElementById('finish-btn').addEventListener('click', () => {
                showConfirmPopup();
            });

            document.getElementById('confirm-yes').addEventListener('click', () => {
                localStorage.setItem('userAnswers', JSON.stringify(userAnswers));
                window.location.href = 'result.html';
            });

            document.getElementById('confirm-no').addEventListener('click', () => {
                hideConfirmPopup();
            });

            updateNavigationButtons(currentQuestionIndex, questions.length);
        }
    }

    // Load the results on result.html
    if (document.getElementById('result-container')) {
        let currentQuiz = JSON.parse(localStorage.getItem('currentQuiz'));
        let userAnswers = JSON.parse(localStorage.getItem('userAnswers'));

        if (currentQuiz && userAnswers) {
            const resultContainer = document.getElementById('result-container');
            let correctAnswersCount = 0;
            let totalCorrectOptions = 0;
            let userCorrectOptions = 0;

            currentQuiz.questions.forEach((question, questionIndex) => {
                const questionElement = document.createElement('div');
                questionElement.classList.add('result-question');
                questionElement.innerText = question.question;
                resultContainer.appendChild(questionElement);

                question.answers.forEach((answer, answerIndex) => {
                    const answerElement = document.createElement('div');
                    answerElement.classList.add('result-answer');
                    if (userAnswers[questionIndex] && userAnswers[questionIndex].includes(answerIndex)) {
                        answerElement.classList.add(answer.correct ? 'correct' : 'wrong');
                        if (answer.correct) {
                            userCorrectOptions++;
                        }
                    }
                    if (answer.correct) {
                        totalCorrectOptions++;
                    }
                    answerElement.innerText = answer.text;
                    resultContainer.appendChild(answerElement);
                });
            });

            // Calculate percentage of correct answers
            const percentageCorrect = (userCorrectOptions / totalCorrectOptions) * 100;

            // Display the score
            const scoreContainer = document.getElementById('score-container');
            const scoreElement = document.createElement('div');
            scoreElement.classList.add('score');
            scoreElement.innerHTML = `Du hast <span><b>${userCorrectOptions}</b></span> von <span><b>${totalCorrectOptions}</b></span> möglichen Antworten richtig ausgewählt. Das sind <span><b>${percentageCorrect.toFixed(2)}%</b></span>.`;
            scoreContainer.appendChild(scoreElement);

            document.getElementById('restart-btn').addEventListener('click', () => {
                localStorage.removeItem('currentQuiz');
                localStorage.removeItem('userAnswers');
                window.location.href = 'index.html';
            });
        }
    }
});

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function showQuestion(questions, currentQuestionIndex, userAnswers) {
    const question = questions[currentQuestionIndex];
    document.getElementById('question').innerText = question.question;
    const questionImage = document.getElementById('question-image');
    if (question.image) {
        questionImage.src = question.image;
        questionImage.style.display = 'block';
    } else {
        questionImage.style.display = 'none';
    }
    const answerButtons = document.getElementById('answer-buttons');
    answerButtons.innerHTML = '';
    question.answers.forEach((answer, index) => {
        const button = document.createElement('button');
        button.innerText = answer.text;
        button.classList.add('btn');
        if (userAnswers[currentQuestionIndex] && userAnswers[currentQuestionIndex].includes(index)) {
            button.classList.add('selected');
        }
        button.addEventListener('click', () => {
            if (!userAnswers[currentQuestionIndex]) {
                userAnswers[currentQuestionIndex] = [];
            }
            const answerIndex = userAnswers[currentQuestionIndex].indexOf(index);
            if (answerIndex > -1) {
                userAnswers[currentQuestionIndex].splice(answerIndex, 1);
                button.classList.remove('selected');
            } else {
                userAnswers[currentQuestionIndex].push(index);
                button.classList.add('selected');
            }
            renderQuestionBar(questions, userAnswers);
        });
        answerButtons.appendChild(button);
    });
    updateNavigationButtons(currentQuestionIndex, questions.length);
}

function renderQuestionBar(questions, userAnswers) {
    const questionBar = document.getElementById('question-bar');
    questionBar.innerHTML = '';
    questions.forEach((_, index) => {
        const questionBarItem = document.createElement('div');
        questionBarItem.classList.add('question-bar-item');
        questionBarItem.innerText = index + 1;
        if (userAnswers[index] && userAnswers[index].length > 0) {
            questionBarItem.classList.add('answered');
        }
        questionBarItem.addEventListener('click', () => {
            showQuestion(questions, index, userAnswers);
        });
        questionBar.appendChild(questionBarItem);
    });
}

function updateNavigationButtons(currentQuestionIndex, totalQuestions) {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    if (currentQuestionIndex === 0) {
        prevBtn.style.display = 'none';
    } else {
        prevBtn.style.display = 'inline-block';
    }

    if (currentQuestionIndex === totalQuestions - 1) {
        nextBtn.style.display = 'none';
    } else {
        nextBtn.style.display = 'inline-block';
    }
}

function showConfirmPopup() {
    document.getElementById('confirm-popup').style.display = 'block';
}

function hideConfirmPopup() {
    document.getElementById('confirm-popup').style.display = 'none';
}
