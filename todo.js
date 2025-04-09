// Gestion des tâches (todo list)
let tasks = [];

// Initialisation des contrôles de la liste de tâches
function initTodoList() {
    // Charger les données depuis localStorage s'il en existe
    if (localStorage.getItem('tasks')) {
        tasks = JSON.parse(localStorage.getItem('tasks'));
    }
    
    // Initialiser le formulaire d'ajout de tâche
    const todoForm = document.getElementById('todoForm');
    todoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const taskInput = document.getElementById('taskInput');
        const taskCategory = document.getElementById('taskCategory');
        const taskDeadline = document.getElementById('taskDeadline');
        const taskPriority = document.getElementById('taskPriority');
        
        if (taskInput.value.trim() === '') return;
        
        // Créer une nouvelle tâche
        const task = {
            id: Date.now(),
            text: taskInput.value.trim(),
            category: taskCategory.value,
            deadline: taskDeadline.value || null,
            priority: taskPriority.value,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        // Ajouter la tâche et mettre à jour l'affichage
        tasks.push(task);
        saveTasks();
        updateTodoList();
        
        // Réinitialiser le formulaire
        todoForm.reset();
        showNotification('Tâche ajoutée avec succès');
    });
    
    // Initialiser les filtres
    const todoFilterSelect = document.getElementById('todoFilter');
    todoFilterSelect.addEventListener('change', updateTodoList);
    
    const todoCategoryFilter = document.getElementById('todoCategoryFilter');
    todoCategoryFilter.addEventListener('change', updateTodoList);
    
    // Afficher la liste initiale
    updateTodoList();
}

// Sauvegarder les tâches dans le localStorage
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Mettre à jour l'affichage de la liste de tâches
function updateTodoList() {
    const todoList = document.getElementById('todoList');
    const todoFilterSelect = document.getElementById('todoFilter');
    const todoCategoryFilter = document.getElementById('todoCategoryFilter');
    
    // Filtrer les tâches
    const filter = todoFilterSelect.value;
    const categoryFilter = todoCategoryFilter.value;
    
    let filteredTasks = [...tasks];
    
    // Appliquer le filtre de statut
    if (filter === 'completed') {
        filteredTasks = filteredTasks.filter(task => task.completed);
    } else if (filter === 'active') {
        filteredTasks = filteredTasks.filter(task => !task.completed);
    }
    
    // Appliquer le filtre de catégorie
    if (categoryFilter !== 'all') {
        filteredTasks = filteredTasks.filter(task => task.category === categoryFilter);
    }
    
    // Trier les tâches: d'abord par priorité, puis non complétées en premier, puis par date
    filteredTasks.sort((a, b) => {
        // Priorité (high, medium, low)
        const priorityOrder = { high: 1, medium: 2, low: 3 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        
        // Tâches non complétées en premier
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        
        // Par date (les plus récentes en premier)
        return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    // Afficher les tâches
    todoList.innerHTML = '';
    
    if (filteredTasks.length === 0) {
        todoList.innerHTML = `
            <div class="empty-list">
                <i class="fas fa-tasks"></i>
                <p>Aucune tâche dans cette catégorie</p>
            </div>
        `;
        return;
    }
    
    filteredTasks.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.className = `task-item ${task.completed ? 'completed' : ''}`;
        
        // Ajouter une classe pour la priorité
        taskElement.classList.add(`priority-${task.priority}`);
        
        // Calculer l'état de la deadline
        let deadlineStatus = '';
        let deadlineClass = '';
        
        if (task.deadline) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const deadline = new Date(task.deadline);
            deadline.setHours(0, 0, 0, 0);
            
            const diffDays = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
            
            if (diffDays < 0) {
                deadlineStatus = 'En retard';
                deadlineClass = 'overdue';
            } else if (diffDays === 0) {
                deadlineStatus = "Aujourd'hui";
                deadlineClass = 'today';
            } else if (diffDays === 1) {
                deadlineStatus = 'Demain';
                deadlineClass = 'soon';
            } else if (diffDays <= 7) {
                deadlineStatus = `Dans ${diffDays} jours`;
                deadlineClass = 'upcoming';
            } else {
                deadlineStatus = new Date(task.deadline).toLocaleDateString();
            }
        }
        
        // Déterminer l'icône de la catégorie
        let categoryIcon = 'fa-list-check';
        if (task.category === 'food') categoryIcon = 'fa-utensils';
        if (task.category === 'decoration') categoryIcon = 'fa-palette';
        if (task.category === 'contact') categoryIcon = 'fa-phone';
        if (task.category === 'shopping') categoryIcon = 'fa-shopping-cart';
        if (task.category === 'transport') categoryIcon = 'fa-car';
        if (task.category === 'entertainment') categoryIcon = 'fa-music';
        
        // Créer l'élément HTML
        taskElement.innerHTML = `
            <div class="task-checkbox">
                <input type="checkbox" id="task-${task.id}" ${task.completed ? 'checked' : ''}>
                <label for="task-${task.id}"></label>
            </div>
            <div class="task-content">
                <div class="task-text">${task.text}</div>
                <div class="task-meta">
                    <span class="task-category">
                        <i class="fas ${categoryIcon}"></i> 
                        ${getCategoryName(task.category)}
                    </span>
                    ${task.deadline ? `
                        <span class="task-deadline ${deadlineClass}">
                            <i class="fas fa-calendar-alt"></i> 
                            ${deadlineStatus}
                        </span>
                    ` : ''}
                    <span class="task-priority priority-${task.priority}">
                        <i class="fas fa-flag"></i> 
                        ${getPriorityName(task.priority)}
                    </span>
                </div>
            </div>
            <div class="task-actions">
                <button class="edit-task" data-id="${task.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-task" data-id="${task.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        todoList.appendChild(taskElement);
        
        // Ajouter les gestionnaires d'événements
        const checkbox = taskElement.querySelector(`#task-${task.id}`);
        checkbox.addEventListener('change', () => {
            toggleTaskCompletion(task.id);
        });
        
        const editBtn = taskElement.querySelector('.edit-task');
        editBtn.addEventListener('click', () => {
            editTask(task.id);
        });
        
        const deleteBtn = taskElement.querySelector('.delete-task');
        deleteBtn.addEventListener('click', () => {
            deleteTask(task.id);
        });
    });
    
    // Mettre à jour le compteur de tâches
    updateTaskCounter();
}

// Obtenir le nom de la catégorie
function getCategoryName(category) {
    const categories = {
        general: 'Général',
        food: 'Nourriture',
        decoration: 'Décoration',
        contact: 'Contacts',
        shopping: 'Achats',
        transport: 'Transport',
        entertainment: 'Animation'
    };
    
    return categories[category] || 'Autre';
}

// Obtenir le nom de la priorité
function getPriorityName(priority) {
    const priorities = {
        high: 'Haute',
        medium: 'Moyenne',
        low: 'Basse'
    };
    
    return priorities[priority] || 'Normal';
}

// Basculer l'état de complétion d'une tâche
function toggleTaskCompletion(id) {
    const taskIndex = tasks.findIndex(task => task.id === id);
    
    if (taskIndex !== -1) {
        tasks[taskIndex].completed = !tasks[taskIndex].completed;
        saveTasks();
        updateTodoList();
    }
}

// Éditer une tâche
function editTask(id) {
    const task = tasks.find(task => task.id === id);
    
    if (!task) return;
    
    // Créer une boîte de dialogue modale pour l'édition
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Modifier la tâche</h3>
            <form id="editTaskForm">
                <div class="form-group">
                    <label for="editTaskText">Description</label>
                    <input type="text" id="editTaskText" value="${task.text}" required>
                </div>
                
                <div class="form-group">
                    <label for="editTaskCategory">Catégorie</label>
                    <select id="editTaskCategory">
                        <option value="general" ${task.category === 'general' ? 'selected' : ''}>Général</option>
                        <option value="food" ${task.category === 'food' ? 'selected' : ''}>Nourriture</option>
                        <option value="decoration" ${task.category === 'decoration' ? 'selected' : ''}>Décoration</option>
                        <option value="contact" ${task.category === 'contact' ? 'selected' : ''}>Contacts</option>
                        <option value="shopping" ${task.category === 'shopping' ? 'selected' : ''}>Achats</option>
                        <option value="transport" ${task.category === 'transport' ? 'selected' : ''}>Transport</option>
                        <option value="entertainment" ${task.category === 'entertainment' ? 'selected' : ''}>Animation</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="editTaskDeadline">Échéance</label>
                    <input type="date" id="editTaskDeadline" value="${task.deadline || ''}">
                </div>
                
                <div class="form-group">
                    <label for="editTaskPriority">Priorité</label>
                    <select id="editTaskPriority">
                        <option value="high" ${task.priority === 'high' ? 'selected' : ''}>Haute</option>
                        <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>Moyenne</option>
                        <option value="low" ${task.priority === 'low' ? 'selected' : ''}>Basse</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="editTaskCompleted" ${task.completed ? 'checked' : ''}>
                        Marquer comme terminée
                    </label>
                </div>
                
                <div class="modal-actions">
                    <button type="button" id="cancelEditTask">Annuler</button>
                    <button type="submit" class="primary">Enregistrer</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Gérer l'annulation
    document.getElementById('cancelEditTask').addEventListener('click', () => {
        modal.remove();
    });
    
    // Gérer la soumission
    document.getElementById('editTaskForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Mettre à jour la tâche
        task.text = document.getElementById('editTaskText').value;
        task.category = document.getElementById('editTaskCategory').value;
        task.deadline = document.getElementById('editTaskDeadline').value || null;
        task.priority = document.getElementById('editTaskPriority').value;
        task.completed = document.getElementById('editTaskCompleted').checked;
        
        saveTasks();
        updateTodoList();
        modal.remove();
        showNotification('Tâche modifiée avec succès');
    });
}

// Supprimer une tâche
function deleteTask(id) {
    const taskIndex = tasks.findIndex(task => task.id === id);
    
    if (taskIndex === -1) return;
    
    // Créer une boîte de dialogue de confirmation
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Confirmation</h3>
            <p>Êtes-vous sûr de vouloir supprimer cette tâche ?</p>
            <div class="modal-actions">
                <button id="cancelDelete">Annuler</button>
                <button id="confirmDelete" class="danger">Supprimer</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Gérer les actions
    document.getElementById('cancelDelete').addEventListener('click', () => {
        modal.remove();
    });
    
    document.getElementById('confirmDelete').addEventListener('click', () => {
        // Supprimer la tâche
        tasks.splice(taskIndex, 1);
        saveTasks();
        updateTodoList();
        
        modal.remove();
        showNotification('Tâche supprimée avec succès');
    });
}

// Mettre à jour le compteur de tâches
function updateTaskCounter() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const active = total - completed;
    
    document.getElementById('totalTasks').textContent = total;
    document.getElementById('completedTasks').textContent = completed;
    document.getElementById('activeTasks').textContent = active;
}

// Modifier la fonction d'exportation pour inclure les tâches
const originalExportDataWithTasks = exportData;
exportData = function() {
    // Créer l'objet de données
    const data = {
        guests: guests,
        tables: tables,
        uTable: uTable,
        tasks: tasks,
        exportDate: new Date().toISOString(),
        appVersion: '1.0'
    };
    
    // Convertir en JSON
    const jsonData = JSON.stringify(data, null, 2);
    
    // Créer un blob
    const blob = new Blob([jsonData], { type: 'application/json' });
    
    // Créer un URL pour le blob
    const url = URL.createObjectURL(blob);
    
    // Créer un lien et déclencher le téléchargement
    const a = document.createElement('a');
    a.href = url;
    a.download = `anniversaire-mamie-${new Date().toLocaleDateString().replace(/\//g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    
    // Nettoyer
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 0);
    
    showNotification('Données exportées avec succès');
};

// Modifier l'importation pour inclure les tâches
const originalShowImportConfirmationWithTasks = showImportConfirmation;
showImportConfirmation = function(data) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    
    // Vérifier si les données contiennent des tâches
    const hasTasks = data.tasks && Array.isArray(data.tasks);
    
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Confirmer l'importation</h3>
            <p>Cette action remplacera toutes vos données actuelles.</p>
            <p>Exportées le: ${new Date(data.exportDate || Date.now()).toLocaleString()}</p>
            <p>Invités: ${data.guests.length}</p>
            <p>Tables: ${data.tables.length}</p>
            <p>Table en U: ${data.uTable ? 'Oui' : 'Non'}</p>
            <p>Tâches: ${hasTasks ? data.tasks.length : 'Non'}</p>
            
            <div class="modal-actions">
                <button id="cancelImport">Annuler</button>
                <button id="confirmImport" class="primary">Importer</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Gérer les actions
    document.getElementById('cancelImport').addEventListener('click', () => {
        modal.remove();
    });
    
    document.getElementById('confirmImport').addEventListener('click', () => {
        // Remplacer les données
        guests = data.guests;
        tables = data.tables;
        
        // Importer la table en U si elle existe
        if (data.uTable) {
            uTable = data.uTable;
            
            // Mettre à jour les champs de formulaire
            document.getElementById('leftSideSeats').value = uTable.leftSeats;
            document.getElementById('rightSideSeats').value = uTable.rightSeats;
            document.getElementById('bottomSideSeats').value = uTable.bottomSeats;
            
            // Mettre à jour l'affichage
            renderUTable();
        }
        
        // Importer les tâches si elles existent
        if (hasTasks) {
            tasks = data.tasks;
            updateTodoList();
        }
        
        // Sauvegarder et mettre à jour l'affichage
        saveData();
        saveTasks();
        saveUTableData();
        updateGuestList();
        updateTables();
        updateStats();
        
        modal.remove();
        showNotification('Données importées avec succès');
    });
};