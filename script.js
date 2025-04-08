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