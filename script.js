// Initialisation des données
let guests = JSON.parse(localStorage.getItem('guests')) || [];
let tables = JSON.parse(localStorage.getItem('tables')) || [];

// Sauvegarde des données dans le stockage local
function saveData() {
    localStorage.setItem('guests', JSON.stringify(guests));
    localStorage.setItem('tables', JSON.stringify(tables));
}

// Initialisation des contrôles d'importation/exportation
function initDataControls() {
    document.getElementById('exportBtn').addEventListener('click', exportData);
    document.getElementById('importBtn').addEventListener('click', () => document.getElementById('importFile').click());
    document.getElementById('importFile').addEventListener('change', importData);
}

// Exportation des données
function exportData() {
    const data = {
        guests: guests,
        tables: tables,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const dataUrl = URL.createObjectURL(dataBlob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = dataUrl;
    downloadLink.download = `anniversaire-invites-${new Date().toLocaleDateString().replace(/\//g, '-')}.json`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
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
            
            // Validation basique
            if (!data.guests || !Array.isArray(data.guests) || !data.tables || !Array.isArray(data.tables)) {
                throw new Error('Format de fichier invalide');
            }
            
            // Afficher une confirmation
            showImportConfirmation(data);
            
        } catch (error) {
            showNotification(`Erreur: ${error.message}`, true);
        }
        
        // Réinitialiser l'input file
        event.target.value = '';
    };
    
    reader.readAsText(file);
}

// Afficher la confirmation d'importation
function showImportConfirmation(data) {
    const modal = document.getElementById('importConfirmModal');
    const confirmBtn = document.getElementById('confirmImport');
    const cancelBtn = document.getElementById('cancelImport');
    const guestCountEl = document.getElementById('importGuestCount');
    const tableCountEl = document.getElementById('importTableCount');
    const dateEl = document.getElementById('importDate');
    
    // Mettre à jour les informations
    guestCountEl.textContent = data.guests.length;
    tableCountEl.textContent = data.tables.length;
    
    // Formater la date d'exportation si disponible
    if (data.exportDate) {
        const exportDate = new Date(data.exportDate);
        dateEl.textContent = exportDate.toLocaleString();
    } else {
        dateEl.textContent = 'Non disponible';
    }
    
    // Action de confirmation
    const confirmAction = () => {
        // Remplacer les données
        guests = data.guests;
        tables = data.tables;
        saveData();
        
        // Mettre à jour l'interface
        updateGuestList();
        updateTables();
        updateStats();
        
        showNotification('Données importées avec succès');
        
        // Fermer la modal
        modal.classList.remove('show');
        
        // Nettoyer
        confirmBtn.removeEventListener('click', confirmAction);
        cancelBtn.removeEventListener('click', cancelAction);
    };
    
    // Action d'annulation
    const cancelAction = () => {
        modal.classList.remove('show');
        confirmBtn.removeEventListener('click', confirmAction);
        cancelBtn.removeEventListener('click', cancelAction);
    };
    
    // Ajouter les écouteurs d'événements
    confirmBtn.addEventListener('click', confirmAction);
    cancelBtn.addEventListener('click', cancelAction);
    
    // Afficher la modal
    modal.classList.add('show');
}

// Initialisation de la navigation
function initNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('section');
    
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetSection = button.getAttribute('data-section');
            
            // Mettre à jour les classes actives
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            sections.forEach(section => {
                if (section.id === targetSection) {
                    section.classList.add('active');
                } else {
                    section.classList.remove('active');
                }
            });
            
            // Actions spécifiques selon la section
            if (targetSection === 'guests-section') {
                updateGuestList();
            } else if (targetSection === 'tables-section') {
                updateTables();
            }
        });
    });
}

// Initialisation du formulaire d'invité
function initGuestForm() {
    const form = document.getElementById('guestForm');
    const nameInput = document.getElementById('guestName');
    const statusSelect = document.getElementById('guestStatus');
    const coupleCheckbox = document.getElementById('isCouple');
    const partnerNameInput = document.getElementById('partnerName');
    
    // Gérer l'option couple
    coupleCheckbox.addEventListener('change', function() {
        const partnerField = document.getElementById('partnerNameField');
        if (this.checked) {
            partnerField.classList.remove('hidden');
        } else {
            partnerField.classList.add('hidden');
            partnerNameInput.value = '';
        }
    });
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = nameInput.value.trim();
        const status = statusSelect.value;
        
        if (!name) {
            showNotification('Veuillez entrer un nom', true);
            return;
        }
        
        // Gestion de l'option couple
        const isCouple = coupleCheckbox.checked;
        const partnerName = isCouple ? partnerNameInput.value.trim() : '';
        
        if (isCouple && !partnerName) {
            showNotification('Veuillez entrer le nom du partenaire', true);
            return;
        }
        
        const existingGuestIndex = guests.findIndex(g => g.id === currentEditingGuest);
        
        if (existingGuestIndex !== -1) {
            // Mise à jour d'un invité existant
            guests[existingGuestIndex].name = name;
            guests[existingGuestIndex].status = status;
            guests[existingGuestIndex].isCouple = isCouple;
            guests[existingGuestIndex].partnerName = partnerName;
            
            showNotification('Invité mis à jour avec succès');
        } else {
            // Ajout d'un nouvel invité
            const newGuest = {
                id: Date.now().toString(),
                name: name,
                status: status,
                isCouple: isCouple,
                partnerName: partnerName,
                tableId: null,
                seatIndex: null
            };
            
            guests.push(newGuest);
            showNotification('Invité ajouté avec succès');
        }
        
        // Réinitialiser le formulaire
        form.reset();
        partnerNameInput.closest('.form-group').classList.add('hidden');
        currentEditingGuest = null;
        
        // Mettre à jour les données et l'affichage
        saveData();
        updateGuestList();
        updateStats();
    });
}

// Variable pour suivre l'invité en cours d'édition
let currentEditingGuest = null;

// Mise à jour de la liste des invités
function updateGuestList(filter = 'all') {
    const guestListContainer = document.getElementById('guestList');
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    // Mettre à jour les filtres
    filterButtons.forEach(btn => {
        if (btn.getAttribute('data-filter') === filter) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Filtrer les invités
    let filteredGuests = guests;
    if (filter !== 'all') {
        filteredGuests = guests.filter(guest => guest.status === filter);
    }
    
    // Vider la liste actuelle
    guestListContainer.innerHTML = '';
    
    // Afficher l'état vide si nécessaire
    if (filteredGuests.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-list';
        emptyState.innerHTML = `
            <i class="fas fa-users-slash"></i>
            <h3>Aucun invité ${filter !== 'all' ? `avec le statut "${filter}"` : ''}</h3>
            <p>Ajoutez des invités en utilisant le formulaire ci-dessus</p>
        `;
        guestListContainer.appendChild(emptyState);
        return;
    }
    
    // Créer les cartes d'invités
    filteredGuests.forEach(guest => {
        const card = document.createElement('div');
        card.className = 'guest-card';
        
        // Déterminer le label de statut
        let statusLabel = '';
        let statusClass = '';
        
        switch (guest.status) {
            case 'pending':
                statusLabel = 'En attente';
                statusClass = 'pending';
                break;
            case 'confirmed':
                statusLabel = 'Confirmé';
                statusClass = 'confirmed';
                break;
            case 'declined':
                statusLabel = 'Décliné';
                statusClass = 'declined';
                break;
        }
        
        // Carte d'invité avec ou sans partenaire
        let partnerHtml = '';
        if (guest.isCouple && guest.partnerName) {
            partnerHtml = `
                <div class="partner-name">
                    avec <span>${guest.partnerName}</span>
                </div>
            `;
        }
        
        // Information sur la table si assignée
        let tableInfo = '';
        if (guest.tableId !== null) {
            const table = tables.find(t => t.id === guest.tableId);
            if (table) {
                tableInfo = `<div><small>Table ${table.number}, Place ${guest.seatIndex + 1}</small></div>`;
            }
        }
        
        card.innerHTML = `
            <div class="guest-info">
                <div>
                    <strong>${guest.name}</strong>
                    ${guest.isCouple ? '<span class="badge-couple"><i class="fas fa-heart"></i> Couple</span>' : ''}
                </div>
                ${partnerHtml}
                <div class="status ${statusClass}">${statusLabel}</div>
                ${tableInfo}
            </div>
            <div class="guest-actions">
                <button class="icon-btn secondary edit-guest" data-id="${guest.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="icon-btn danger delete-guest" data-id="${guest.id}">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
        
        guestListContainer.appendChild(card);
        
        // Ajouter les écouteurs d'événements
        card.querySelector('.edit-guest').addEventListener('click', () => editGuest(guest.id));
        card.querySelector('.delete-guest').addEventListener('click', () => deleteGuest(guest.id));
    });
}

// Initialisation des filtres
function initFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filter = button.getAttribute('data-filter');
            updateGuestList(filter);
        });
    });
}

// Édition d'un invité
function editGuest(id) {
    const guest = guests.find(g => g.id === id);
    if (!guest) return;
    
    document.getElementById('guestName').value = guest.name;
    document.getElementById('guestStatus').value = guest.status;
    
    // Gestion de l'option couple
    const coupleCheckbox = document.getElementById('isCouple');
    const partnerField = document.getElementById('partnerNameField');
    
    coupleCheckbox.checked = guest.isCouple;
    if (guest.isCouple) {
        partnerField.classList.remove('hidden');
        document.getElementById('partnerName').value = guest.partnerName || '';
    } else {
        partnerField.classList.add('hidden');
    }
    
    // Mettre à jour la variable d'édition
    currentEditingGuest = id;
    
    // Faire défiler jusqu'au formulaire
    document.getElementById('guestForm').scrollIntoView({ behavior: 'smooth' });
}

// Suppression d'un invité
function deleteGuest(id) {
    const guest = guests.find(g => g.id === id);
    if (!guest) return;
    
    const modal = document.getElementById('deleteConfirmModal');
    const confirmBtn = document.getElementById('confirmDelete');
    const cancelBtn = document.getElementById('cancelDelete');
    const guestNameEl = document.getElementById('deleteGuestName');
    
    // Mettre à jour le nom
    guestNameEl.textContent = guest.name;
    
    // Action de confirmation
    const confirmAction = () => {
        // Supprimer l'invité des tables s'il est assigné
        if (guest.tableId) {
            const table = tables.find(t => t.id === guest.tableId);
            if (table && table.seats[guest.seatIndex] === guest.id) {
                table.seats[guest.seatIndex] = null;
            }
        }
        
        // Supprimer l'invité
        guests = guests.filter(g => g.id !== id);
        saveData();
        
        // Mettre à jour l'interface
        updateGuestList();
        updateTables();
        updateStats();
        
        showNotification('Invité supprimé avec succès');
        
        // Fermer la modal
        modal.classList.remove('show');
        
        // Nettoyer
        confirmBtn.removeEventListener('click', confirmAction);
        cancelBtn.removeEventListener('click', cancelAction);
    };
    
    // Action d'annulation
    const cancelAction = () => {
        modal.classList.remove('show');
        confirmBtn.removeEventListener('click', confirmAction);
        cancelBtn.removeEventListener('click', cancelAction);
    };
    
    // Ajouter les écouteurs d'événements
    confirmBtn.addEventListener('click', confirmAction);
    cancelBtn.addEventListener('click', cancelAction);
    
    // Afficher la modal
    modal.classList.add('show');
}

// Initialisation des contrôles de table
function initTableControls() {
    const tableForm = document.getElementById('tableForm');
    const seatsInput = document.getElementById('tableSeats');
    
    tableForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const seatsCount = parseInt(seatsInput.value);
        
        if (isNaN(seatsCount) || seatsCount < 1) {
            showNotification('Veuillez entrer un nombre valide de places', true);
            return;
        }
        
        addTable(seatsCount);
        tableForm.reset();
    });
}

// Ajout d'une table
function addTable(seatsCount) {
    const tableNumber = tables.length + 1;
    
    const newTable = {
        id: Date.now().toString(),
        number: tableNumber,
        seats: Array(seatsCount).fill(null)
    };
    
    tables.push(newTable);
    saveData();
    updateTables();
    updateStats();
    
    showNotification(`Table ${tableNumber} ajoutée avec ${seatsCount} places`);
}

// Mise à jour de l'affichage des tables
function updateTables() {
    const tablesContainer = document.getElementById('tablesContainer');
    
    // Vider le conteneur
    tablesContainer.innerHTML = '';
    
    // Afficher l'état vide si nécessaire
    if (tables.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-list';
        emptyState.innerHTML = `
            <i class="fas fa-chair"></i>
            <h3>Aucune table</h3>
            <p>Ajoutez des tables en utilisant le formulaire ci-dessus</p>
        `;
        tablesContainer.appendChild(emptyState);
        return;
    }
    
    // Créer chaque table
    tables.forEach(table => {
        const tableEl = document.createElement('div');
        tableEl.className = 'table';
        
        let seatsHtml = '';
        
        table.seats.forEach((guestId, index) => {
            let seatContent = '';
            let seatClass = 'seat';
            
            if (guestId) {
                const guest = guests.find(g => g.id === guestId);
                if (guest) {
                    seatContent = guest.name;
                    seatClass += ' occupied';
                    
                    // Ajouter un indicateur si c'est un couple
                    if (guest.isCouple && guest.partnerName) {
                        seatContent += `<br><small>${guest.partnerName}</small>`;
                    }
                }
            }
            
            seatsHtml += `
                <div class="${seatClass}" data-table-id="${table.id}" data-seat-index="${index}">
                    ${guestId ? seatContent : `<i class="fas fa-plus"></i>`}
                </div>
            `;
        });
        
        tableEl.innerHTML = `
            <div class="table-header">
                <h3>Table ${table.number}</h3>
                <button class="delete-table" data-table-id="${table.id}">
                    <i class="fas fa-trash-alt"></i> Supprimer
                </button>
            </div>
            <div class="seats">
                ${seatsHtml}
            </div>
        `;
        
        tablesContainer.appendChild(tableEl);
        
        // Ajouter les écouteurs d'événements
        tableEl.querySelectorAll('.seat').forEach(seat => {
            seat.addEventListener('click', () => {
                const tableId = seat.getAttribute('data-table-id');
                const seatIndex = parseInt(seat.getAttribute('data-seat-index'));
                assignGuest(tableId, seatIndex);
            });
        });
        
        tableEl.querySelector('.delete-table').addEventListener('click', () => {
            deleteTable(table.id);
        });
    });
}

// Assignation d'un invité à une place
function assignGuest(tableId, seatIndex) {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    
    const currentGuestId = table.seats[seatIndex];
    const modal = document.getElementById('assignGuestModal');
    const guestSelect = document.getElementById('guestSelect');
    const confirmBtn = document.getElementById('confirmAssign');
    const clearBtn = document.getElementById('clearAssign');
    const cancelBtn = document.getElementById('cancelAssign');
    const modalTitle = document.getElementById('assignModalTitle');
    
    // Mettre à jour le titre
    modalTitle.textContent = `Assigner un invité à la Table ${table.number}, Place ${seatIndex + 1}`;
    
    // Vider la sélection actuelle
    guestSelect.innerHTML = '';
    
    // Créer les options d'invités
    const unassignedGuests = guests.filter(guest => 
        (guest.tableId === null) || // Non assigné
        (guest.id === currentGuestId) || // L'invité actuel
        (guest.tableId === tableId && guest.seatIndex === seatIndex) // Même place
    );
    
    if (unassignedGuests.length === 0) {
        const noGuests = document.createElement('div');
        noGuests.className = 'empty-list';
        noGuests.style.padding = '1rem';
        noGuests.innerHTML = `
            <i class="fas fa-user-slash"></i>
            <p>Aucun invité disponible</p>
            <small>Tous les invités sont déjà assignés à des tables</small>
        `;
        guestSelect.appendChild(noGuests);
        confirmBtn.disabled = true;
    } else {
        confirmBtn.disabled = false;
        
        unassignedGuests.forEach(guest => {
            const option = document.createElement('div');
            option.className = 'guest-option';
            option.setAttribute('data-guest-id', guest.id);
            
            // Afficher l'info du partenaire pour les couples
            let partnerInfo = '';
            if (guest.isCouple && guest.partnerName) {
                partnerInfo = `<div class="couple-note"><i class="fas fa-heart"></i> ${guest.name} est en couple avec ${guest.partnerName}</div>`;
            }
            
            option.innerHTML = `
                <div>
                    <strong>${guest.name}</strong>
                    ${guest.isCouple ? '<span class="badge-couple"><i class="fas fa-heart"></i> Couple</span>' : ''}
                </div>
                <div class="status ${guest.status}">
                    ${guest.status === 'pending' ? 'En attente' : 
                      guest.status === 'confirmed' ? 'Confirmé' : 'Décliné'}
                </div>
                ${partnerInfo}
            `;
            
            // Ajouter une class pour l'invité actuellement assigné
            if (guest.id === currentGuestId) {
                option.classList.add('current');
                option.style.background = 'rgba(98, 0, 234, 0.1)';
                option.style.borderLeft = '3px solid var(--primary-color)';
            }
            
            guestSelect.appendChild(option);
            
            // Ajouter un écouteur d'événement
            option.addEventListener('click', () => {
                // Réinitialiser les classes actives
                document.querySelectorAll('.guest-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                
                // Ajouter la classe active
                option.classList.add('selected');
                
                // Stocker l'ID de l'invité sélectionné
                selectedGuestId = guest.id;
            });
        });
    }
    
    // Réinitialiser la sélection
    let selectedGuestId = null;
    
    // Action de confirmation
    const confirmAction = () => {
        if (!selectedGuestId) {
            showNotification('Veuillez sélectionner un invité', true);
            return;
        }
        
        const selectedGuest = guests.find(g => g.id === selectedGuestId);
        
        // Si l'invité est déjà assigné à une autre place, libérer cette place
        if (selectedGuest.tableId !== null) {
            const oldTable = tables.find(t => t.id === selectedGuest.tableId);
            if (oldTable && oldTable.seats[selectedGuest.seatIndex] === selectedGuest.id) {
                oldTable.seats[selectedGuest.seatIndex] = null;
            }
        }
        
        // Assigner l'invité à la nouvelle place
        selectedGuest.tableId = tableId;
        selectedGuest.seatIndex = seatIndex;
        table.seats[seatIndex] = selectedGuest.id;
        
        saveData();
        updateTables();
        updateGuestList();
        
        showNotification(`${selectedGuest.name} assigné à la Table ${table.number}, Place ${seatIndex + 1}`);
        
        // Fermer la modal
        modal.classList.remove('show');
        
        // Nettoyer
        confirmBtn.removeEventListener('click', confirmAction);
        clearBtn.removeEventListener('click', clearAction);
        cancelBtn.removeEventListener('click', cancelAction);
    };
    
    // Action de libération de la place
    const clearAction = () => {
        // Vérifier si la place est occupée
        if (currentGuestId) {
            const currentGuest = guests.find(g => g.id === currentGuestId);
            if (currentGuest) {
                currentGuest.tableId = null;
                currentGuest.seatIndex = null;
            }
            
            table.seats[seatIndex] = null;
            
            saveData();
            updateTables();
            updateGuestList();
            
            showNotification(`Place ${seatIndex + 1} de la Table ${table.number} libérée`);
        }
        
        // Fermer la modal
        modal.classList.remove('show');
        
        // Nettoyer
        confirmBtn.removeEventListener('click', confirmAction);
        clearBtn.removeEventListener('click', clearAction);
        cancelBtn.removeEventListener('click', cancelAction);
    };
    
    // Action d'annulation
    const cancelAction = () => {
        modal.classList.remove('show');
        confirmBtn.removeEventListener('click', confirmAction);
        clearBtn.removeEventListener('click', clearAction);
        cancelBtn.removeEventListener('click', cancelAction);
    };
    
    // Ajouter les écouteurs d'événements
    confirmBtn.addEventListener('click', confirmAction);
    clearBtn.addEventListener('click', clearAction);
    cancelBtn.addEventListener('click', cancelAction);
    
    // Activer/désactiver le bouton de libération
    clearBtn.disabled = !currentGuestId;
    
    // Afficher la modal
    modal.classList.add('show');
}

// Suppression d'une table
function deleteTable(tableId) {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    
    const modal = document.getElementById('deleteTableConfirmModal');
    const confirmBtn = document.getElementById('confirmTableDelete');
    const cancelBtn = document.getElementById('cancelTableDelete');
    const tableNumberEl = document.getElementById('deleteTableNumber');
    
    // Mettre à jour le numéro de table
    tableNumberEl.textContent = table.number;
    
    // Action de confirmation
    const confirmAction = () => {
        // Libérer tous les invités assignés à cette table
        guests.forEach(guest => {
            if (guest.tableId === tableId) {
                guest.tableId = null;
                guest.seatIndex = null;
            }
        });
        
        // Supprimer la table
        tables = tables.filter(t => t.id !== tableId);
        
        // Renuméroter les tables
        tables.forEach((t, index) => {
            t.number = index + 1;
        });
        
        saveData();
        updateTables();
        updateGuestList();
        updateStats();
        
        showNotification(`Table ${table.number} supprimée`);
        
        // Fermer la modal
        modal.classList.remove('show');
        
        // Nettoyer
        confirmBtn.removeEventListener('click', confirmAction);
        cancelBtn.removeEventListener('click', cancelAction);
    };
    
    // Action d'annulation
    const cancelAction = () => {
        modal.classList.remove('show');
        confirmBtn.removeEventListener('click', confirmAction);
        cancelBtn.removeEventListener('click', cancelAction);
    };
    
    // Ajouter les écouteurs d'événements
    confirmBtn.addEventListener('click', confirmAction);
    cancelBtn.addEventListener('click', cancelAction);
    
    // Afficher la modal
    modal.classList.add('show');
}

// Mise à jour des statistiques
function updateStats() {
    // Compter les invités par statut
    const totalGuests = guests.length;
    const pendingGuests = guests.filter(g => g.status === 'pending').length;
    const confirmedGuests = guests.filter(g => g.status === 'confirmed').length;
    const declinedGuests = guests.filter(g => g.status === 'declined').length;
    
    // Compter les invités avec partenaire (couples)
    const coupleCount = guests.filter(g => g.isCouple).length;
    
    // Compter les places et les places occupées
    let totalSeats = 0;
    let occupiedSeats = 0;
    
    tables.forEach(table => {
        totalSeats += table.seats.length;
        occupiedSeats += table.seats.filter(seat => seat !== null).length;
    });
    
    // Mettre à jour les éléments HTML
    document.getElementById('totalGuests').textContent = totalGuests;
    document.getElementById('pendingGuests').textContent = pendingGuests;
    document.getElementById('confirmedGuests').textContent = confirmedGuests;
    document.getElementById('declinedGuests').textContent = declinedGuests;
    document.getElementById('coupleCount').textContent = coupleCount;
    document.getElementById('totalTables').textContent = tables.length;
    document.getElementById('totalSeats').textContent = totalSeats;
    document.getElementById('occupiedSeats').textContent = occupiedSeats;
    
    // Ajuster la position des notifications selon la hauteur du footer
    adjustNotificationPosition();
}

// Fonction pour ajuster la position des notifications par rapport au footer
function adjustNotificationPosition() {
    const footer = document.querySelector('footer');
    if (!footer) return;
    
    const footerHeight = footer.offsetHeight;
    const notificationStyle = document.createElement('style');
    
    notificationStyle.id = 'notification-position-style';
    notificationStyle.textContent = `
        .notification {
            bottom: ${footerHeight + 10}px;
        }
    `;
    
    // Supprimer le style précédent s'il existe
    const oldStyle = document.getElementById('notification-position-style');
    if (oldStyle) {
        oldStyle.remove();
    }
    
    // Ajouter le nouveau style
    document.head.appendChild(notificationStyle);
    
    // Mettre à jour le padding-bottom du body
    document.body.style.paddingBottom = `${footerHeight + 5}px`;
}

// Fonction pour afficher une notification
function showNotification(message, isError = false) {
    const notification = document.createElement('div');
    notification.className = `notification ${isError ? 'error' : ''}`;
    notification.textContent = message;
    
    // Supprimer les notifications existantes
    document.querySelectorAll('.notification').forEach(n => n.remove());
    
    document.body.appendChild(notification);
    
    // Animer l'entrée
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Supprimer après 3 secondes
    setTimeout(() => {
        notification.classList.remove('show');
        
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Événement au chargement du document
document.addEventListener('DOMContentLoaded', function() {
    // Initialiser les composants
    initNavigation();
    initGuestForm();
    initFilters();
    initTableControls();
    initDataControls();
    
    // Mettre à jour les affichages
    updateGuestList();
    updateTables();
    updateStats();
    
    // Ajuster la position des notifications au chargement et au redimensionnement
    adjustNotificationPosition();
    window.addEventListener('resize', adjustNotificationPosition);
    
    // Événements pour les modals (fermeture par clic sur X)
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            const modal = closeBtn.closest('.modal');
            if (modal) modal.classList.remove('show');
        });
    });
    
    // Fermeture des modals en cliquant à l'extérieur
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });
    });
});