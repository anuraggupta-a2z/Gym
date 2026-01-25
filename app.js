// Exercise data with categories
let exercises = [
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
let cardioChecklist = [
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

let isEditMode = false;


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
            reps: '',
            alternate: null
        };
    });

    // Initialize cardio state
    cardioChecklist.forEach(item => {
        cardioState.completed[item.id] = false;
    });

    // Load custom exercise names
    const savedExercises = localStorage.getItem('blueprint-exercises');
    if (savedExercises) {
        const customData = JSON.parse(savedExercises);
        if (customData.strength) {
            // Merge names into existing exercises to preserve structure/order if we update code later
            // Or just replace if strict. Let's map over IDs to be safe.
            exercises = exercises.map(ex => {
                const custom = customData.strength.find(c => c.id === ex.id);
                return custom ? { ...ex, name: custom.name, sets: custom.sets } : ex;
            });
        }
        if (customData.cardio) {
            cardioChecklist = cardioChecklist.map(item => {
                const custom = customData.cardio.find(c => c.id === item.id);
                return custom ? { ...item, name: custom.name } : item;
            });
        }
    }

    // Load partial progress (auto-saved)
    const savedProgress = localStorage.getItem('blueprint-progress');
    if (savedProgress) {
        try {
            const progress = JSON.parse(savedProgress);
            const today = new Date().toDateString();

            // Only restore if it's from today
            if (progress.date === today) {
                if (progress.workoutState) workoutState = progress.workoutState;
                if (progress.cardioState) cardioState = progress.cardioState;
                console.log('Restored daily progress');
            }
        } catch (e) {
            console.error('Error loading progress', e);
        }
    }
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

    // Add Edit Toggle to header if not present
    if (!document.getElementById('editToggle')) {
        const header = document.querySelector('.dashboard');
        const toggle = document.createElement('button');
        toggle.id = 'editToggle';
        toggle.className = 'edit-toggle';
        toggle.innerHTML = '✏️ Clean';
        toggle.onclick = toggleEditMode;
        // Insert before tabs
        const tabs = document.querySelector('.tabs');
        header.insertBefore(toggle, tabs);
    }

    updateEditToggle();

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

            const state = workoutState[exercise.id];
            const isAlt = !!state.alternate;
            const displayName = isAlt ? state.alternate : exercise.name;

            exerciseEl.innerHTML = `
                <label class="checkbox-wrapper">
                    <input type="checkbox" data-id="${exercise.id}">
                    <span class="checkbox-custom"></span>
                </label>
                <div class="exercise-info">
                    ${isEditMode
                    ? `<input type="text" class="edit-name-input" data-id="${exercise.id}" value="${exercise.name}" placeholder="Exercise Name">
                           <input type="text" class="edit-sets-input" data-id="${exercise.id}" value="${exercise.sets}" placeholder="Sets">`
                    : `
                            <div class="exercise-header-row">
                                <div class="exercise-name ${isAlt ? 'is-alt' : ''}">
                                    ${displayName}
                                    ${isAlt ? `<span class="original-name-sub">(Sub for: ${exercise.name})</span>` : ''}
                                </div>
                                <button class="swap-btn" data-id="${exercise.id}" title="${isAlt ? 'Revert to original' : 'Swap exercise'}">
                                    ${isAlt ? '↺' : '⇄'}
                                </button>
                            </div>
                          `
                }
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
                        ${isEditMode
            ? `<input type="text" class="edit-name-input" data-type="cardio" data-id="${item.id}" value="${item.name}">`
            : `<div class="exercise-name">${item.name}</div>`
        }
                    </div>
                </div>
            `).join('')}

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
            saveProgress();
        }
    });

    // Tab Buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            renderApp(btn.dataset.mode);
        });
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
        saveProgress();
    });

    // Swap button clicks
    document.getElementById('workoutSections').addEventListener('click', (e) => {
        if (e.target.classList.contains('swap-btn')) {
            const id = e.target.dataset.id;
            const state = workoutState[id];

            if (state.alternate) {
                // Revert
                if (confirm(`Revert back to ${exercises.find(ex => ex.id === id).name}?`)) {
                    state.alternate = null;
                    renderApp('strength');
                    saveProgress();
                }
            } else {
                // Swap
                const newName = prompt('Enter alternate exercise name:');
                if (newName && newName.trim()) {
                    state.alternate = newName.trim();
                    renderApp('strength');
                    saveProgress();
                }
            }
        }
    });

    // Save btn logic handled in renderApp


    // History modal
    document.getElementById('viewHistory').addEventListener('click', showHistory);
    document.getElementById('closeHistory').addEventListener('click', hideHistory);
    document.getElementById('historyModal').addEventListener('click', (e) => {
        if (e.target.id === 'historyModal') hideHistory();
    });

    // Settings modal
    document.getElementById('openSettings').addEventListener('click', () => {
        document.getElementById('settingsModal').classList.add('active');
    });
    document.getElementById('closeSettings').addEventListener('click', () => {
        document.getElementById('settingsModal').classList.remove('active');
    });
    document.getElementById('settingsModal').addEventListener('click', (e) => {
        if (e.target.id === 'settingsModal') document.getElementById('settingsModal').classList.remove('active');
    });

    // Data Actions
    document.getElementById('exportData').addEventListener('click', exportData);
    document.getElementById('importBtn').addEventListener('click', () => {
        document.getElementById('importFile').click();
    });
    document.getElementById('importFile').addEventListener('change', importData);
}

function saveStrength() {
    const completedExercises = exercises.filter(ex => workoutState[ex.id].completed);

    if (completedExercises.length === 0) {
        showToast('Complete at least one exercise first!');
        return;
    }

    const weights = {};
    const reps = {};
    const alternates = {};

    exercises.forEach(ex => {
        if (workoutState[ex.id].weight) {
            weights[ex.id] = workoutState[ex.id].weight;
        }
        if (workoutState[ex.id].reps) {
            reps[ex.id] = workoutState[ex.id].reps;
        }
        if (workoutState[ex.id].alternate) {
            alternates[ex.id] = workoutState[ex.id].alternate;
        }
    });

    const session = {
        type: 'strength',
        date: new Date().toISOString(),
        completed: completedExercises.map(ex => ex.id),
        weights: weights,
        reps: reps,
        alternates: alternates
    };

    history.push(session);
    localStorage.setItem('blueprint-history', JSON.stringify(history));

    // Reset state
    exercises.forEach(ex => {
        workoutState[ex.id] = { completed: false, weight: '', reps: '', alternate: null };
    });

    renderApp('strength');
    saveProgress();
    showToast('Strength workout saved! 💪');
}

function saveCardio() {
    const completedItems = Object.entries(cardioState.completed)
        .filter(([_, val]) => val)
        .map(([key]) => key);

    if (completedItems.length === 0) {
        showToast('Complete at least one item first!');
        return;
    }

    const zone2Credit = 37;
    const vigorousCredit = 12;

    const session = {
        type: 'cardio',
        date: new Date().toISOString(),
        completed: completedItems,
        stats: {
            zone2: zone2Credit,
            vigorous: vigorousCredit
        }
    };

    // Update weekly stats
    weeklyStats.zone2 += zone2Credit;
    weeklyStats.vigorous += vigorousCredit;
    localStorage.setItem('blueprint-weekly', JSON.stringify(weeklyStats));

    history.push(session);
    localStorage.setItem('blueprint-history', JSON.stringify(history));

    // Reset cardio checkmarks
    cardioChecklist.forEach(item => {
        cardioState.completed[item.id] = false;
    });

    renderApp('cardio');
    saveProgress();
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
                    const altName = session.alternates ? session.alternates[id] : null;

                    const nameDisplay = altName ? `${altName} (sub)` : ex.name;
                    return `${nameDisplay}: ${weight}${repsVal ? ` x ${repsVal}` : ''}`;
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

function exportData() {
    const data = {
        history: history,
        weeklyStats: weeklyStats,
        exercises: exercises,
        cardioChecklist: cardioChecklist, // in case names were changed
        exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blueprint-gym-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Data exported successfully! 💾');
}

function importData(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result);

            // Validate basic structure
            if (!data.history || !data.weeklyStats) {
                throw new Error('Invalid backup file format');
            }

            // Restore data
            localStorage.setItem('blueprint-history', JSON.stringify(data.history));
            localStorage.setItem('blueprint-weekly', JSON.stringify(data.weeklyStats));

            // Restore custom names if present
            const customData = {
                strength: data.exercises,
                cardio: data.cardioChecklist
            };
            // Map exercises only to save names/structure, not full object if not needed, 
            // but for simplicity let's save what we had or rebuild the 'blueprint-exercises' format
            // actually we load custom names from 'blueprint-exercises'.

            // To be consistent with loadState, let's reconstruct blueprint-exercises
            const exercisesToSave = {
                strength: data.exercises.map(e => ({ id: e.id, name: e.name, sets: e.sets })),
                cardio: data.cardioChecklist.map(c => ({ id: c.id, name: c.name }))
            };
            localStorage.setItem('blueprint-exercises', JSON.stringify(exercisesToSave));

            alert('Data restored successfully! App will reload.');
            location.reload();

        } catch (err) {
            console.error(err);
            alert('Error importing data: ' + err.message);
        }
    };
    reader.readAsText(file);
    e.target.value = ''; // reset input
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

function saveProgress() {
    const data = {
        date: new Date().toDateString(),
        workoutState: workoutState,
        cardioState: cardioState
    };
    localStorage.setItem('blueprint-progress', JSON.stringify(data));
}

function toggleEditMode() {
    isEditMode = !isEditMode;
    const mode = document.body.dataset.mode;
    renderApp(mode);
}

function updateEditToggle() {
    const btn = document.getElementById('editToggle');
    if (btn) {
        btn.innerHTML = isEditMode ? '✅ Done' : '✏️ Edit';
        btn.classList.toggle('active', isEditMode);
    }
}

// Add event listener for edit inputs
document.addEventListener('change', (e) => {
    if (e.target.classList.contains('edit-name-input') || e.target.classList.contains('edit-sets-input')) {
        saveCustomizations();
    }
});

function saveCustomizations() {
    // Update models from inputs
    document.querySelectorAll('.edit-name-input').forEach(input => {
        const id = input.dataset.id;
        const val = input.value;

        if (input.dataset.type === 'cardio') {
            const item = cardioChecklist.find(c => c.id === id);
            if (item) item.name = val;
        } else {
            const ex = exercises.find(e => e.id === id);
            if (ex) ex.name = val;
        }
    });

    document.querySelectorAll('.edit-sets-input').forEach(input => {
        const id = input.dataset.id;
        const val = input.value;
        const ex = exercises.find(e => e.id === id);
        if (ex) ex.sets = val;
    });

    // Persist
    const data = {
        strength: exercises.map(e => ({ id: e.id, name: e.name, sets: e.sets })),
        cardio: cardioChecklist.map(c => ({ id: c.id, name: c.name }))
    };
    localStorage.setItem('blueprint-exercises', JSON.stringify(data));
}
