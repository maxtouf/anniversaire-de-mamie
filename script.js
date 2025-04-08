// Gestion des données
let guests = [];
let tables = [];

// Vérifier le stockage local au chargement
document.addEventListener('DOMContentLoaded', () => {
    // Charger les données depuis localStorage s'il en existe
    if (localStorage.getItem('guests')) {
        guests = JSON.parse(localStorage.getItem('guests'));
    }
    if (localStorage.getItem('tables')) {
        tables = JSON.parse(localStorage.getItem('tables'));
    }

    // Initialiser la navigation
    initNavigation();
    
    // Initialiser les composants
    initGuestForm();
    initFilters();
    initTableControls();
    
    // Initialiser les boutons d'import/export
    initDataControls();
    
    // Mettre à jour l'affichage
    updateGuestList();
    updateTables();
    updateStats();
});

// Sauvegarde des données
function saveData() {
    localStorage.setItem('guests', JSON.stringify(guests));
    localStorage.setItem('tables', JSON.stringify(tables));
}

// Initialisation des contrôles d'import/export
function initDataControls() {
    // Bouton d'exportation
    document.getElementById('exportData').addEventListener('click', exportData);
    
    // Bouton d'importation
    document.getElementById('importData').addEventListener('click', () => {
        document.getElementById('importFile').click();
    });
    
    // Input de fichier caché
    document.getElementById('importFile').addEventListener('change', importData);
}

// Exportation des données
function exportData() {
    // Créer l'objet de données
    const data = {
        guests: guests,
        tables: tables,
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
}

// Importation des données
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            // Vérifier la structure des données
            if (data.guests && Array.isArray(data.guests) && 
                data.tables && Array.isArray(data.tables)) {
                
                // Confirmer l'importation
                showImportConfirmation(data);
            } else {
                throw new Error('Structure de fichier invalide');
            }
        } catch (error) {
            showNotification('Erreur: Fichier invalide', true);
            console.error(error);
        }
        
        // Réinitialiser l'input pour permettre de sélectionner le même fichier à nouveau
        event.target.value = '';
    };
    
    reader.readAsText(file);
}

// Afficher une confirmation avant d'importer
function showImportConfirmation(data) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Confirmer l'importation</h3>
            <p>Cette action remplacera toutes vos données actuelles.</p>
            <p>Exportées le: ${new Date(data.exportDate || Date.now()).toLocaleString()}</p>
            <p>Invités: ${data.guests.length}</p>
            <p>Tables: ${data.tables.length}</p>
            
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
        
        // Sauvegarder et mettre à jour l'affichage
        saveData();
        updateGuestList();
        updateTables();
        updateStats();
        
        modal.remove();
        showNotification('Données importées avec succès');
    });
}

// Afficher une notification avec option d'erreur
function showNotification(message, isError = false) {
    // Créer une notification temporaire
    const notification = document.createElement('div');
    notification.className = `notification ${isError ? 'error' : ''}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Afficher avec animation
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Supprimer après 3 secondes
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Gestion de la navigation
function initNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.section');

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const target = button.getAttribute('data-target');
            
            navButtons.forEach(btn => btn.classList.remove('active'));
            sections.forEach(section => section.classList.remove('active'));
            
            button.classList.add('active');
            document.getElementById(target).classList.add('active');
        });
    });

    // Activer la première section par défaut
    navButtons[0].click();
}

// Gestion des invités
function initGuestForm() {
    const form = document.getElementById('guestForm');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const guest = {
            id: Date.now(),
            name: document.getElementById('guestName').value,
            status: document.getElementById('guestStatus').value
        };
        
        guests.push(guest);
        saveData();
        
        form.reset();
        updateGuestList();
        updateStats();
        
        // Animation et notification
        showNotification('Invité ajouté avec succès!');
    });
}

function updateGuestList(filter = 'all') {
    const guestsList = document.getElementById('guestsList');
    guestsList.innerHTML = '';
    
    const filteredGuests = filter === 'all' 
        ? guests 
        : guests.filter(guest => guest.status === filter);
    
    if (filteredGuests.length === 0) {
        guestsList.innerHTML = `
            <div class="empty-list">
                <i class="fas fa-user-slash"></i>
                <p>Aucun invité dans cette catégorie</p>
            </div>
        `;
        return;
    }
    
    filteredGuests.forEach(guest => {
        const card = document.createElement('div');
        card.className = 'guest-card';
        
        // Définir la classe du statut
        let statusClass = '';
        if (guest.status === 'confirmed') statusClass = 'confirmed';
        if (guest.status === 'declined') statusClass = 'declined';
        
        // Traduire le statut
        let statusText = 'En attente';
        if (guest.status === 'confirmed') statusText = 'Confirmé';
        if (guest.status === 'declined') statusText = 'Ne vient pas';
        
        card.innerHTML = `
            <div class="guest-info">
                <strong>${guest.name}</strong>
                <span class="status ${statusClass}">${statusText}</span>
            </div>
            <div class="guest-actions">
                <button onclick="editGuest(${guest.id})"><i class="fas fa-edit"></i></button>
                <button onclick="deleteGuest(${guest.id})"><i class="fas fa-trash"></i></button>
            </div>
        `;
        guestsList.appendChild(card);
    });
}

function initFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filter = button.getAttribute('data-filter');
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            updateGuestList(filter);
        });
    });
}

function editGuest(id) {
    const guest = guests.find(g => g.id === id);
    if (!guest) return;
    
    // Créer une boîte de dialogue modale au lieu d'utiliser prompt
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h3>Modifier l'invité</h3>
            <form id="editForm">
                <label for="editName">Nom</label>
                <input type="text" id="editName" value="${guest.name}" required>
                <label for="editStatus">Statut</label>
                <select id="editStatus">
                    <option value="pending" ${guest.status === 'pending' ? 'selected' : ''}>En attente</option>
                    <option value="confirmed" ${guest.status === 'confirmed' ? 'selected' : ''}>Confirmé</option>
                    <option value="declined" ${guest.status === 'declined' ? 'selected' : ''}>Ne vient pas</option>
                </select>
                <button type="submit">Enregistrer</button>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Gérer la fermeture
    const close = modal.querySelector('.close');
    close.addEventListener('click', () => {
        modal.remove();
    });
    
    // Gérer la soumission
    const form = modal.querySelector('#editForm');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        guest.name = document.getElementById('editName').value;
        guest.status = document.getElementById('editStatus').value;
        
        saveData();
        updateGuestList();
        updateStats();
        updateTables(); // Mettre à jour les tables au cas où un invité assigné change de statut
        
        modal.remove();
        showNotification('Invité modifié avec succès!');
    });
}

function deleteGuest(id) {
    const guest = guests.find(g => g.id === id);
    if (!guest) return;
    
    // Créer une boîte de dialogue de confirmation modale
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Confirmation</h3>
            <p>Êtes-vous sûr de vouloir supprimer "${guest.name}" ?</p>
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
        // Supprimer des tables si assigné
        tables.forEach(table => {
            table.seats = table.seats.map(seat => 
                seat && seat.id === id ? null : seat
            );
        });
        
        // Supprimer de la liste
        guests = guests.filter(g => g.id !== id);
        
        saveData();
        updateGuestList();
        updateTables();
        updateStats();
        
        modal.remove();
        showNotification('Invité supprimé avec succès!');
    });
}

// Gestion des tables
function initTableControls() {
    const addTableBtn = document.getElementById('addTable');
    const seatsInput = document.getElementById('seatsPerTable');
    
    addTableBtn.addEventListener('click', () => {
        const seats = parseInt(seatsInput.value);
        if (seats > 0) {
            addTable(seats);
        }
    });
    
    // Initialiser l'affichage des tables
    updateTables();
}

function addTable(seatsCount) {
    const table = {
        id: Date.now(),
        seats: Array(seatsCount).fill(null),
        number: tables.length + 1
    };
    
    tables.push(table);
    saveData();
    updateTables();
    showNotification('Table ajoutée avec succès!');
}

function updateTables() {
    const tablesContainer = document.getElementById('tablesContainer');
    tablesContainer.innerHTML = '';
    
    if (tables.length === 0) {
        tablesContainer.innerHTML = `
            <div class="empty-list">
                <i class="fas fa-chair"></i>
                <p>Aucune table n'a été créée</p>
            </div>
        `;
        return;
    }
    
    tables.forEach(table => {
        const tableElement = document.createElement('div');
        tableElement.className = 'table';
        tableElement.innerHTML = `
            <h3>Table ${table.number}</h3>
            <div class="seats">
                ${table.seats.map((guest, index) => `
                    <div class="seat ${guest ? 'occupied' : ''}" 
                         onclick="assignGuest(${table.id}, ${index})">
                        ${guest ? guest.name : '<i class="fas fa-plus"></i>'}
                    </div>
                `).join('')}
            </div>
            <button class="delete-table" onclick="deleteTable(${table.id})">
                <i class="fas fa-trash"></i> Supprimer cette table
            </button>
        `;
        tablesContainer.appendChild(tableElement);
    });
}

function deleteTable(tableId) {
    const tableIndex = tables.findIndex(t => t.id === tableId);
    if (tableIndex === -1) return;
    
    // Créer une boîte de dialogue de confirmation modale
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Confirmation</h3>
            <p>Êtes-vous sûr de vouloir supprimer la table ${tables[tableIndex].number} ?</p>
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
        tables.splice(tableIndex, 1);
        
        // Renumérote les tables
        tables.forEach((table, idx) => {
            table.number = idx + 1;
        });
        
        saveData();
        updateTables();
        
        modal.remove();
        showNotification('Table supprimée avec succès!');
    });
}

function assignGuest(tableId, seatIndex) {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    
    if (table.seats[seatIndex]) {
        // Libérer la place
        table.seats[seatIndex] = null;
        saveData();
        updateTables();
        return;
    }
    
    // Filtrer les invités disponibles (confirmés et pas déjà assignés)
    const availableGuests = guests.filter(g => 
        g.status === 'confirmed' && 
        !tables.some(t => t.seats.some(seat => seat && seat.id === g.id))
    );
    
    if (availableGuests.length === 0) {
        showNotification('Aucun invité confirmé disponible');
        return;
    }
    
    // Afficher une modale pour sélectionner un invité
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Assigner un invité</h3>
            <div class="guest-select">
                ${availableGuests.map(guest => `
                    <div class="guest-option" data-id="${guest.id}">
                        ${guest.name}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Gérer la sélection d'un invité
    const options = modal.querySelectorAll('.guest-option');
    options.forEach(option => {
        option.addEventListener('click', () => {
            const guestId = parseInt(option.getAttribute('data-id'));
            const guest = guests.find(g => g.id === guestId);
            
            if (guest) {
                table.seats[seatIndex] = guest;
                saveData();
                updateTables();
                modal.remove();
            }
        });
    });
}

// Mise à jour des statistiques
function updateStats() {
    const total = guests.length;
    const confirmed = guests.filter(g => g.status === 'confirmed').length;
    const pending = guests.filter(g => g.status === 'pending').length;
    const declined = guests.filter(g => g.status === 'declined').length;
    
    document.getElementById('totalGuests').textContent = total;
    document.getElementById('confirmedGuests').textContent = confirmed;
    document.getElementById('pendingGuests').textContent = pending;
    document.getElementById('declinedGuests').textContent = declined;
}

// Ajouter ces styles CSS pour les modales
document.head.insertAdjacentHTML('beforeend', `
<style>
.modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-content {
    background-color: white;
    padding: 2rem;
    border-radius: var(--border-radius);
    box-shadow: var(--box-shadow);
    max-width: 500px;
    width: 90%;
}

.close {
    float: right;
    font-size: 1.5rem;
    cursor: pointer;
}

.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 1.5rem;
}

.danger {
    background-color: var(--danger-color);
}

.notification {
    position: fixed;
    top: -50px;
    left: 50%;
    transform: translateX(-50%);
    background-color: var(--primary-color);
    color: white;
    padding: 0.8rem 1.5rem;
    border-radius: 30px;
    box-shadow: var(--box-shadow);
    z-index: 1001;
    transition: top 0.3s ease;
}

.notification.show {
    top: 20px;
}

.guest-select {
    max-height: 300px;
    overflow-y: auto;
    margin-top: 1rem;
}

.guest-option {
    padding: 0.8rem;
    border-bottom: 1px solid #eee;
    cursor: pointer;
    transition: var(--transition);
}

.guest-option:hover {
    background-color: var(--light-color);
}

.empty-list {
    text-align: center;
    padding: 2rem;
    color: var(--gray-color);
}

.empty-list i {
    font-size: 3rem;
    margin-bottom: 1rem;
}

.delete-table {
    margin-top: 1rem;
    background-color: var(--light-color);
    color: var(--gray-color);
}

.delete-table:hover {
    background-color: var(--danger-color);
}
</style>
`);