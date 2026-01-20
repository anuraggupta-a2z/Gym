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

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    renderExercises();
    updateProgress();
    updateDate();
    setupEventListeners();
    registerServiceWorker();
});

function loadState() {
    const savedHistory = localStorage.getItem('blueprint-history');
    if (savedHistory) {
        history = JSON.parse(savedHistory);
    }
    
    // Initialize workout state from last session's weights
    exercises.forEach(ex => {
        workoutState[ex.id] = {
            completed: false,
            weight: ''
        };
    });
}

function getLastWeight(exerciseId) {
    for (let i = history.length - 1; i >= 0; i--) {
        const session = history[i];
        if (session.weights && session.weights[exerciseId]) {
            return session.weights[exerciseId];
        }
    }
    return null;
}

function renderExercises() {
    const container = document.getElementById('workoutSections');
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
            const lastWeight = getLastWeight(exercise.id);
            const exerciseEl = document.createElement('div');
            exerciseEl.className = 'exercise';
            exerciseEl.dataset.id = exercise.id;
            
            exerciseEl.innerHTML = `
                <label class="checkbox-wrapper">
                    <input type="checkbox" data-id="${exercise.id}">
                    <span class="checkbox-custom"></span>
                </label>
                <div class="exercise-info">
                    <div class="exercise-name">${exercise.name}</div>
                    <div class="exercise-meta">
                        <span class="exercise-sets">${exercise.sets}</span>
                        ${lastWeight ? `<span class="exercise-previous">Last: ${lastWeight}</span>` : ''}
                    </div>
                </div>
                ${exercise.hasWeight ? `
                    <div class="weight-input-wrapper">
                        <input type="text" class="weight-input" 
                            data-id="${exercise.id}" 
                            placeholder="${lastWeight || 'Weight'}"
                            value="${workoutState[exercise.id]?.weight || ''}">
                    </div>
                ` : ''}
            `;
            
            section.appendChild(exerciseEl);
        });
        
        container.appendChild(section);
    });
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
            workoutState[id].completed = e.target.checked;
            e.target.closest('.exercise').classList.toggle('completed', e.target.checked);
            updateProgress();
        }
    });
    
    // Weight input changes
    document.getElementById('workoutSections').addEventListener('input', (e) => {
        if (e.target.classList.contains('weight-input')) {
            const id = e.target.dataset.id;
            workoutState[id].weight = e.target.value;
        }
    });
    
    // Save workout
    document.getElementById('saveWorkout').addEventListener('click', saveWorkout);
    
    // History modal
    document.getElementById('viewHistory').addEventListener('click', showHistory);
    document.getElementById('closeHistory').addEventListener('click', hideHistory);
    document.getElementById('historyModal').addEventListener('click', (e) => {
        if (e.target.id === 'historyModal') hideHistory();
    });
}

function saveWorkout() {
    const completedExercises = exercises.filter(ex => workoutState[ex.id].completed);
    
    if (completedExercises.length === 0) {
        showToast('Complete at least one exercise first!');
        return;
    }
    
    const weights = {};
    exercises.forEach(ex => {
        if (workoutState[ex.id].weight) {
            weights[ex.id] = workoutState[ex.id].weight;
        }
    });
    
    const session = {
        date: new Date().toISOString(),
        completed: completedExercises.map(ex => ex.id),
        weights: weights
    };
    
    history.push(session);
    localStorage.setItem('blueprint-history', JSON.stringify(history));
    
    // Reset state
    exercises.forEach(ex => {
        workoutState[ex.id] = { completed: false, weight: '' };
    });
    
    renderExercises();
    updateProgress();
    showToast('Workout saved! 💪');
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
                    return ex ? `${ex.name}: ${weight}` : null;
                })
                .filter(Boolean);
            
            return `
                <div class="history-item">
                    <div class="history-date">${dateStr}</div>
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
