// Exercise data with categories
const exercises = [
    // Legs
    { id: 'sled-pull', name: 'Backward Sled Pull', sets: '5 min', category: 'legs', hasWeight: false },
    { id: 'dead-hang', name: 'Dead Hang', sets: '60s', category: 'legs', hasWeight: false },
    { id: 'poliquin-stepups', name: 'Poliquin Step-Ups', sets: '3x10/leg', category: 'legs', hasWeight: true },
    { id: 'slant-squats', name: 'Slant Board Squats', sets: '3x15', category: 'legs', hasWeight: true },
    { id: 'split-squats', name: 'Split Squats', sets: '3x10/leg', category: 'legs', hasWeight: true },
    { id: 'nordic-curls', name: 'Nordic Hamstring Curls', sets: '1x10', category: 'legs', hasWeight: false },
    { id: 'reverse-nordic', name: 'Reverse Nordic Curls', sets: '1x10', category: 'legs', hasWeight: false },
    { id: 'tibialis-raises', name: 'Tibialis Raises', sets: '1x25', category: 'legs', hasWeight: true },
    { id: 'isotib-rotations', name: 'IsoTib Rotations', sets: '1x15/way', category: 'legs', hasWeight: true },
    { id: 'seated-calf', name: 'Seated Calf Raises', sets: '1x25', category: 'legs', hasWeight: true },

    // Upper Body
    { id: 'chin-ups', name: 'Chin-Ups', sets: '1x15', category: 'upper', hasWeight: true },
    { id: 'pull-ups', name: 'Pull-Ups', sets: '1x15', category: 'upper', hasWeight: true },
    { id: 'face-pulls', name: 'Face Pulls', sets: '1x15', category: 'upper', hasWeight: true },
    { id: 'butterfly-pull', name: 'Butterfly Pull', sets: '1x15', category: 'upper', hasWeight: true },
    { id: 'band-pull-aparts', name: 'Band Pull-Aparts', sets: '1x15', category: 'upper', hasWeight: false },
    { id: 'db-ext-rotation', name: 'DB Ext Rotation', sets: '1x15', category: 'upper', hasWeight: true },
    { id: 'tricep-extensions', name: 'Tricep Extensions', sets: '1x25', category: 'upper', hasWeight: true },
    { id: 'bicep-curls', name: 'Bicep Curls', sets: '1x15', category: 'upper', hasWeight: true },

    // Core
    { id: 'hanging-leg-raises', name: 'Hanging Leg Raises', sets: '1x50', category: 'core', hasWeight: false },
    { id: 'oblique-touches', name: 'Oblique Touches', sets: '1x50/side', category: 'core', hasWeight: false },
    { id: 'back-extensions', name: 'Back Extensions', sets: '1x25', category: 'core', hasWeight: true },

    // Stretches
    { id: 'stretches', name: 'Couch, Pigeon, Shin Stretches', sets: '5 min', category: 'stretch', hasWeight: false }
];

const categories = {
    legs: { icon: '🦵', title: 'Legs' },
    upper: { icon: '💪', title: 'Upper Body' },
    core: { icon: '🎯', title: 'Core' },
    stretch: { icon: '🧘', title: 'Stretches' }
};

// State
let workoutState = {};
let history = [];
let weeklyStats = {
    zone2: 0,
    vigorous: 0,
    weekStart: null
};

// Cardio Protocol
const cardioChecklist = [
    { id: 'cardio-warmup', name: 'Warmup (10 min)', type: 'warmup' },
    { id: 'cardio-int-1', name: 'Interval 1 (4m Hard / 4m Easy)', type: 'interval' },
    { id: 'cardio-int-2', name: 'Interval 2 (4m Hard / 4m Easy)', type: 'interval' },
    { id: 'cardio-int-3', name: 'Interval 3 (4m Hard / 4m Easy)', type: 'interval' },
    { id: 'cardio-zone2', name: 'Steady Zone 2 (25 min)', type: 'steady' }
];

let cardioState = {
    completed: {},
    zone2Minutes: 37,
    vigorousMinutes: 12
};


// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    renderApp();
    setupEventListeners();
    registerServiceWorker();
});

function loadState() {
    const savedHistory = localStorage.getItem('blueprint-history');
    if (savedHistory) {
        history = JSON.parse(savedHistory);
    }

    // Load weekly stats
    const savedWeekly = localStorage.getItem('blueprint-weekly');
    if (savedWeekly) {
        weeklyStats = JSON.parse(savedWeekly);
        checkWeeklyReset();
    } else {
        resetWeeklyStats();
    }

    // Initialize strength state
    exercises.forEach(ex => {
        workoutState[ex.id] = {
            completed: false,
            weight: '',
            reps: ''
        };
    });

    // Initialize cardio state
    cardioChecklist.forEach(item => {
        cardioState.completed[item.id] = false;
    });
}

function checkWeeklyReset() {
    const now = new Date();
    const lastReset = new Date(weeklyStats.weekStart);
    const day = now.getDay(); // 0 is Sunday, 1 is Monday

    // Reset if it's Monday and we haven't reset today
    if (day === 1 && now.toDateString() !== lastReset.toDateString()) {
        if (now > lastReset) { // Ensure time moved forward
            resetWeeklyStats();
        }
    }
}

function resetWeeklyStats() {
    weeklyStats = {
        zone2: 0,
        vigorous: 0,
        weekStart: new Date().toISOString()
    };
    localStorage.setItem('blueprint-weekly', JSON.stringify(weeklyStats));
}

function getLastData(exerciseId) {
    for (let i = history.length - 1; i >= 0; i--) {
        const session = history[i];
        if (session.weights && session.weights[exerciseId]) {
            return {
                weight: session.weights[exerciseId],
                reps: session.reps ? session.reps[exerciseId] : null
            };
        }
    }
    return null;
}

const SCHEDULE = {
    0: 'Rest', // Sunday
    1: 'Strength', // Monday
    2: 'Cardio', // Tuesday
    3: 'Strength', // Wednesday
    4: 'Cardio', // Thursday
    5: 'Strength', // Friday
    6: 'Cardio' // Saturday
};

function renderApp(mode = null) {
    if (!mode) {
        const day = new Date().getDay();
        mode = SCHEDULE[day].toLowerCase();
    }

    document.body.dataset.mode = mode;

    // Update active tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    const sections = document.getElementById('workoutSections');
    sections.innerHTML = '';

    if (mode === 'strength') {
        renderStrength(sections);
        document.getElementById('saveWorkout').onclick = saveStrength;
        document.getElementById('saveWorkout').style.display = 'flex';
    } else if (mode === 'cardio') {
        renderCardio(sections);
        document.getElementById('saveWorkout').onclick = saveCardio;
        document.getElementById('saveWorkout').style.display = 'flex';
    } else {
        renderRest(sections);
        document.getElementById('saveWorkout').style.display = 'none';
    }

    updateDashboard();
}

function renderStrength(container) {
    container.innerHTML = '';

    Object.keys(categories).forEach(categoryKey => {
        const categoryExercises = exercises.filter(ex => ex.category === categoryKey);
        if (categoryExercises.length === 0) return;

        const section = document.createElement('div');
        section.className = 'section';
        section.dataset.category = categoryKey;

        const category = categories[categoryKey];
        section.innerHTML = `
            <div class="section-header">
                <span class="section-icon">${category.icon}</span>
                <span class="section-title">${category.title}</span>
            </div>
        `;

        categoryExercises.forEach(exercise => {
            const lastData = getLastData(exercise.id);
            const exerciseEl = document.createElement('div');
            exerciseEl.className = 'exercise';
            exerciseEl.dataset.id = exercise.id;

            let lastText = '';
            if (lastData) {
                lastText = `Last: ${lastData.weight}${lastData.reps ? ` x ${lastData.reps}` : ''}`;
            }

            exerciseEl.innerHTML = `
                <label class="checkbox-wrapper">
                    <input type="checkbox" data-id="${exercise.id}">
                    <span class="checkbox-custom"></span>
                </label>
                <div class="exercise-info">
                    <div class="exercise-name">${exercise.name}</div>
                    <div class="exercise-meta">
                        <span class="exercise-sets">${exercise.sets}</span>
                        ${lastText ? `<span class="exercise-previous">${lastText}</span>` : ''}
                    </div>
                </div>
                <div class="input-group">
                    <input type="text" class="weight-input" 
                        data-id="${exercise.id}" 
                        placeholder="${lastData?.weight || 'lbs'}"
                        value="${workoutState[exercise.id]?.weight || ''}">
                    <span class="input-divider">x</span>
                    <input type="text" class="reps-input" 
                        data-id="${exercise.id}" 
                        placeholder="${lastData?.reps || 'reps'}"
                        value="${workoutState[exercise.id]?.reps || ''}">
                </div>
            `;

            section.appendChild(exerciseEl);
        });

        container.appendChild(section);
    });

    // Sync checkboxes
    document.querySelectorAll('#workoutSections input[type="checkbox"]').forEach(cb => {
        cb.checked = workoutState[cb.dataset.id].completed;
        if (cb.checked) cb.closest('.exercise').classList.add('completed');
    });
}

function renderCardio(container) {
    container.innerHTML = `
        <div class="section">
            <div class="section-header">
                <span class="section-icon">🏃</span>
                <span class="section-title">Protocol</span>
            </div>
            
            ${cardioChecklist.map(item => `
                <div class="exercise ${cardioState.completed[item.id] ? 'completed' : ''}" data-id="${item.id}">
                    <label class="checkbox-wrapper">
                        <input type="checkbox" data-id="${item.id}" ${cardioState.completed[item.id] ? 'checked' : ''}>
                        <span class="checkbox-custom"></span>
                    </label>
                    <div class="exercise-info">
                        <div class="exercise-name">${item.name}</div>
                    </div>
                </div>
            `).join('')}

            <div class="cardio-inputs">
                <h3>Session Data</h3>
                <div class="cardio-input-row">
                    <label>Zone 2 Minutes</label>
                    <input type="number" id="zone2Input" value="${cardioState.zone2Minutes}">
                </div>
                <div class="cardio-input-row">
                    <label>Vigorous Minutes</label>
                    <input type="number" id="vigorousInput" value="${cardioState.vigorousMinutes}">
                </div>
            </div>
        </div>
    `;
}

function renderRest(container) {
    container.innerHTML = `
        <div class="rest-view">
            <div class="rest-icon">😴</div>
            <h2>Rest Day</h2>
            <p>Recover and prepare for the next session.</p>
        </div>
    `;
}

function updateDashboard() {
    document.getElementById('zone2Progress').textContent = `${weeklyStats.zone2} / 150 min`;
    document.getElementById('vigorousProgress').textContent = `${weeklyStats.vigorous} / 75 min`;

    const z2Percent = Math.min(100, (weeklyStats.zone2 / 150) * 100);
    const vigPercent = Math.min(100, (weeklyStats.vigorous / 75) * 100);

    document.getElementById('zone2Bar').style.width = `${z2Percent}%`;
    document.getElementById('vigorousBar').style.width = `${vigPercent}%`;
}

function updateProgress() {
    const completed = Object.values(workoutState).filter(s => s.completed).length;
    const total = exercises.length;
    const percentage = (completed / total) * 100;

    document.getElementById('progressFill').style.width = `${percentage}%`;
    document.getElementById('progressText').textContent = `${completed} / ${total} exercises`;
}

function updateDate() {
    const now = new Date();
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', options);
}

function setupEventListeners() {
    // Checkbox changes
    document.getElementById('workoutSections').addEventListener('change', (e) => {
        if (e.target.type === 'checkbox') {
            const id = e.target.dataset.id;
            const isCardio = document.body.dataset.mode === 'cardio';

            if (isCardio) {
                cardioState.completed[id] = e.target.checked;
            } else {
                workoutState[id].completed = e.target.checked;
                updateProgress();
            }
            e.target.closest('.exercise').classList.toggle('completed', e.target.checked);
        }
    });

    // Tab Buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            renderApp(btn.dataset.mode);
        });
    });

    // Cardio Inputs
    document.getElementById('workoutSections').addEventListener('input', (e) => {
        if (e.target.id === 'zone2Input') {
            cardioState.zone2Minutes = parseInt(e.target.value) || 0;
        } else if (e.target.id === 'vigorousInput') {
            cardioState.vigorousMinutes = parseInt(e.target.value) || 0;
        }
    });

    // Input changes
    document.getElementById('workoutSections').addEventListener('input', (e) => {
        if (e.target.classList.contains('weight-input')) {
            const id = e.target.dataset.id;
            workoutState[id].weight = e.target.value;
        } else if (e.target.classList.contains('reps-input')) {
            const id = e.target.dataset.id;
            workoutState[id].reps = e.target.value;
        }
    });

    // Save btn logic handled in renderApp


    // History modal
    document.getElementById('viewHistory').addEventListener('click', showHistory);
    document.getElementById('closeHistory').addEventListener('click', hideHistory);
    document.getElementById('historyModal').addEventListener('click', (e) => {
        if (e.target.id === 'historyModal') hideHistory();
    });
}

function saveStrength() {
    const completedExercises = exercises.filter(ex => workoutState[ex.id].completed);

    if (completedExercises.length === 0) {
        showToast('Complete at least one exercise first!');
        return;
    }

    const weights = {};
    const reps = {};

    exercises.forEach(ex => {
        if (workoutState[ex.id].weight) {
            weights[ex.id] = workoutState[ex.id].weight;
        }
        if (workoutState[ex.id].reps) {
            reps[ex.id] = workoutState[ex.id].reps;
        }
    });

    const session = {
        type: 'strength',
        date: new Date().toISOString(),
        completed: completedExercises.map(ex => ex.id),
        weights: weights,
        reps: reps
    };

    history.push(session);
    localStorage.setItem('blueprint-history', JSON.stringify(history));

    // Reset state
    exercises.forEach(ex => {
        workoutState[ex.id] = { completed: false, weight: '', reps: '' };
    });

    renderApp('strength');
    showToast('Strength workout saved! 💪');
}

function saveCardio() {
    const completedItems = Object.entries(cardioState.completed)
        .filter(([_, val]) => val)
        .map(([key]) => key);

    if (completedItems.length === 0 && cardioState.zone2Minutes === 0) {
        showToast('Track something first!');
        return;
    }

    const session = {
        type: 'cardio',
        date: new Date().toISOString(),
        completed: completedItems,
        stats: {
            zone2: cardioState.zone2Minutes,
            vigorous: cardioState.vigorousMinutes
        }
    };

    // Update weekly stats
    weeklyStats.zone2 += cardioState.zone2Minutes;
    weeklyStats.vigorous += cardioState.vigorousMinutes;
    localStorage.setItem('blueprint-weekly', JSON.stringify(weeklyStats));

    history.push(session);
    localStorage.setItem('blueprint-history', JSON.stringify(history));

    // Reset cardio checkmarks but leave minutes for ease
    cardioChecklist.forEach(item => {
        cardioState.completed[item.id] = false;
    });

    renderApp('cardio');
    showToast('Cardio session saved! 🏃');
}

function showHistory() {
    const modal = document.getElementById('historyModal');
    const list = document.getElementById('historyList');

    if (history.length === 0) {
        list.innerHTML = '<div class="history-empty">No workouts saved yet</div>';
    } else {
        list.innerHTML = history.slice().reverse().map(session => {
            const date = new Date(session.date);
            const dateStr = date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
            });

            const completedNames = session.completed
                .map(id => exercises.find(ex => ex.id === id)?.name)
                .filter(Boolean);

            const weightEntries = Object.entries(session.weights || {})
                .map(([id, weight]) => {
                    const ex = exercises.find(e => e.id === id);
                    if (!ex) return null;
                    const repsVal = session.reps ? session.reps[id] : null;
                    return `${ex.name}: ${weight}${repsVal ? ` x ${repsVal}` : ''}`;
                })
                .filter(Boolean);

            if (session.type === 'cardio') {
                return `
                    <div class="history-item">
                        <div class="history-date">🏃 ${dateStr}</div>
                        <div class="history-stats">Zone 2: ${session.stats.zone2}m • Vigorous: ${session.stats.vigorous}m</div>
                    </div>
                `;
            }

            return `
                <div class="history-item">
                    <div class="history-date">💪 ${dateStr}</div>
                    <div class="history-stats">${session.completed.length} exercises completed</div>
                    ${weightEntries.length > 0 ? `
                        <div class="history-exercises">${weightEntries.join(' • ')}</div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    modal.classList.add('active');
}

function hideHistory() {
    document.getElementById('historyModal').classList.remove('active');
}

function showToast(message) {
    let toast = document.querySelector('.toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js')
            .then(reg => console.log('Service Worker registered'))
            .catch(err => console.log('Service Worker registration failed:', err));
    }
}
