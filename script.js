document.addEventListener('DOMContentLoaded', function() {
    // Initialiser les données
    let guests = JSON.parse(localStorage.getItem('guests')) || [];
    let tables = JSON.parse(localStorage.getItem('tables')) || [];
    
    // Initialiser les composants
    initNavigation();
    initGuestForm();
    initFilters();
    initDataControls();
    initTableControls();
    
    // Gérer l'option couple
    const coupleToggle = document.getElementById('couple');
    const partnerField = document.getElementById('partner-field');
    
    if (coupleToggle) {
        coupleToggle.addEventListener('change', function() {
            partnerField.classList.toggle('hidden', !this.checked);
        });
    }
    
    // Mise à jour responsive du footer
    adjustContentHeight();
    window.addEventListener('resize', adjustContentHeight);
    
    // Mettre à jour les listes et stats
    updateGuestList();
    updateTables();
    updateStats();
    
    // Fonction pour ajuster la taille du contenu en fonction du footer
    function adjustContentHeight() {
        const footer = document.querySelector('footer');
        if (footer) {
            const footerHeight = footer.offsetHeight;
            document.body.style.paddingBottom = `${footerHeight + 10}px`;
            
            // Ajuster la position des notifications
            const notifications = document.querySelectorAll('.notification');
            notifications.forEach(notification => {
                notification.style.bottom = `${footerHeight + 10}px`;
            });
        }
    }
    
    // Fonction pour sauvegarder les données
    function saveData() {
        localStorage.setItem('guests', JSON.stringify(guests));
        localStorage.setItem('tables', JSON.stringify(tables));
    }
    
    // Initialiser les contrôles d'import/export
    function initDataControls() {
        // Export
        document.getElementById('export-btn').addEventListener('click', exportData);
        
        // Import
        document.getElementById('import-btn').addEventListener('change', importData);
    }
    
    // Fonction pour exporter les données
    function exportData() {
        const data = {
            guests: guests,
            tables: tables,
            version: '1.0'
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `invites-anniversaire-${new Date().toISOString().slice(0,10)}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        showNotification("Données exportées avec succès");
    }
    
    // Fonction pour importer des données
    function importData(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                
                // Valider la structure des données
                if (!data.guests || !Array.isArray(data.guests) || 
                    !data.tables || !Array.isArray(data.tables)) {
                    throw new Error("Format de fichier invalide");
                }
                
                // Afficher la confirmation
                showImportConfirmation(data);
                
            } catch (err) {
                showNotification("Erreur lors de l'importation : " + err.message, true);
            }
            
            // Réinitialiser l'input file
            event.target.value = '';
        };
        reader.readAsText(file);
    }
    
    // Fonction pour afficher la confirmation d'importation
    function showImportConfirmation(data) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                <h3>Confirmer l'importation</h3>
                <p>Vous êtes sur le point d'importer :</p>
                <ul>
                    <li>${data.guests.length} invités</li>
                    <li>${data.tables.length} tables</li>
                </ul>
                <p>Cette action remplacera toutes vos données actuelles. Voulez-vous continuer ?</p>
                <div class="modal-actions">
                    <button class="secondary" id="cancel-import">Annuler</button>
                    <button id="confirm-import">Confirmer</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);
        
        // Événements
        modal.querySelector('.close').addEventListener('click', () => {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        });
        
        modal.querySelector('#cancel-import').addEventListener('click', () => {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        });
        
        modal.querySelector('#confirm-import').addEventListener('click', () => {
            // Importer les données
            guests = data.guests;
            tables = data.tables;
            saveData();
            
            // Mettre à jour l'interface
            updateGuestList();
            updateTables();
            updateStats();
            
            // Fermer le modal
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
            
            showNotification("Données importées avec succès");
        });
    }
    
    // Fonction pour initialiser la navigation
    function initNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        const sections = document.querySelectorAll('.section');
        
        navButtons.forEach(button => {
            button.addEventListener('click', function() {
                const target = this.dataset.target;
                
                // Mettre à jour les boutons
                navButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                // Afficher la section
                sections.forEach(section => {
                    section.classList.remove('active');
                    if (section.id === target) {
                        section.classList.add('active');
                    }
                });
                
                // Mettre à jour les tables si nécessaire
                if (target === 'tables-section') {
                    updateTables();
                }
            });
        });
    }
    
    // Fonction pour initialiser le formulaire d'ajout d'invité
    function initGuestForm() {
        const form = document.getElementById('guest-form');
        if (!form) return;
        
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const nameInput = document.getElementById('name');
            const statusInput = document.getElementById('status');
            const coupleToggle = document.getElementById('couple');
            const partnerInput = document.getElementById('partner-name');
            
            // Valider les entrées
            if (!nameInput.value.trim()) {
                showNotification("Veuillez entrer un nom", true);
                return;
            }
            
            const guestId = form.dataset.editing || Date.now().toString();
            const isCouple = coupleToggle && coupleToggle.checked;
            
            const guest = {
                id: guestId,
                name: nameInput.value.trim(),
                status: statusInput.value,
                isCouple: isCouple,
                partnerName: isCouple ? partnerInput.value.trim() : '',
                tableId: null,
                seatIndex: null
            };
            
            // Ajouter ou mettre à jour
            if (form.dataset.editing) {
                const index = guests.findIndex(g => g.id === guestId);
                if (index !== -1) {
                    // Conserver le placement à table
                    guest.tableId = guests[index].tableId;
                    guest.seatIndex = guests[index].seatIndex;
                    guests[index] = guest;
                }
                delete form.dataset.editing;
                form.querySelector('button[type="submit"]').textContent = 'Ajouter';
            } else {
                guests.push(guest);
            }
            
            // Sauvegarder et mettre à jour
            saveData();
            form.reset();
            
            // Cacher le champ partenaire si visible
            if (partnerInput && !partnerInput.classList.contains('hidden')) {
                partnerInput.parentElement.classList.add('hidden');
            }
            
            updateGuestList();
            updateStats();
            
            showNotification("Invité " + (form.dataset.editing ? "modifié" : "ajouté") + " avec succès");
        });
    }
    
    // Fonction pour mettre à jour la liste des invités
    function updateGuestList(filter = 'all') {
        const guestList = document.getElementById('guest-list');
        if (!guestList) return;
        
        // Filtrer les invités
        let filteredGuests = guests;
        if (filter !== 'all') {
            filteredGuests = guests.filter(guest => guest.status === filter);
        }
        
        // Mettre à jour les filtres actifs
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        
        // Vider la liste
        guestList.innerHTML = '';
        
        if (filteredGuests.length === 0) {
            guestList.innerHTML = `
                <div class="empty-list">
                    <i class="fas fa-user-slash"></i>
                    <p>Aucun invité ${filter !== 'all' ? 'avec ce statut' : ''}</p>
                </div>
            `;
            return;
        }
        
        // Remplir la liste
        filteredGuests.forEach(guest => {
            const card = document.createElement('div');
            card.className = 'guest-card';
            card.innerHTML = `
                <div class="guest-info">
                    <div>
                        <strong>${guest.name}</strong>
                        ${guest.isCouple ? `<span class="badge-couple"><i class="fas fa-heart"></i> +1</span>` : ''}
                    </div>
                    ${guest.isCouple && guest.partnerName ? `<div class="partner-name">avec ${guest.partnerName}</div>` : ''}
                    <span class="status ${guest.status}">${
                        guest.status === 'pending' ? 'En attente' :
                        guest.status === 'confirmed' ? 'Confirmé' : 'Décliné'
                    }</span>
                </div>
                <div class="guest-actions">
                    <button class="icon-btn edit-guest" data-id="${guest.id}"><i class="fas fa-edit"></i></button>
                    <button class="icon-btn danger delete-guest" data-id="${guest.id}"><i class="fas fa-trash"></i></button>
                </div>
            `;
            
            guestList.appendChild(card);
        });
        
        // Ajouter les événements
        document.querySelectorAll('.edit-guest').forEach(btn => {
            btn.addEventListener('click', () => editGuest(btn.dataset.id));
        });
        
        document.querySelectorAll('.delete-guest').forEach(btn => {
            btn.addEventListener('click', () => deleteGuest(btn.dataset.id));
        });
    }
    
    // Fonction pour initialiser les filtres
    function initFilters() {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                updateGuestList(this.dataset.filter);
            });
        });
    }
    
    // Fonction pour éditer un invité
    function editGuest(id) {
        const guest = guests.find(g => g.id === id);
        if (!guest) return;
        
        const form = document.getElementById('guest-form');
        const nameInput = document.getElementById('name');
        const statusInput = document.getElementById('status');
        const coupleToggle = document.getElementById('couple');
        const partnerInput = document.getElementById('partner-name');
        const partnerField = document.getElementById('partner-field');
        
        form.dataset.editing = id;
        nameInput.value = guest.name;
        statusInput.value = guest.status;
        
        if (coupleToggle) {
            coupleToggle.checked = guest.isCouple;
            partnerField.classList.toggle('hidden', !guest.isCouple);
            
            if (guest.isCouple && partnerInput) {
                partnerInput.value = guest.partnerName || '';
            }
        }
        
        form.querySelector('button[type="submit"]').textContent = 'Modifier';
        
        // Faire défiler jusqu'au formulaire
        form.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Fonction pour supprimer un invité
    function deleteGuest(id) {
        const guest = guests.find(g => g.id === id);
        if (!guest) return;
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                <h3>Confirmer la suppression</h3>
                <p>Êtes-vous sûr de vouloir supprimer ${guest.name} ${guest.isCouple ? `et ${guest.partnerName || 'son/sa partenaire'}` : ''} ?</p>
                <div class="modal-actions">
                    <button class="secondary" id="cancel-delete">Annuler</button>
                    <button class="danger" id="confirm-delete">Supprimer</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);
        
        // Événements
        modal.querySelector('.close').addEventListener('click', () => {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        });
        
        modal.querySelector('#cancel-delete').addEventListener('click', () => {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        });
        
        modal.querySelector('#confirm-delete').addEventListener('click', () => {
            // Supprimer l'invité
            const index = guests.findIndex(g => g.id === id);
            if (index !== -1) {
                // Si l'invité est placé à une table, libérer la place
                const guest = guests[index];
                if (guest.tableId !== null && guest.seatIndex !== null) {
                    const table = tables.find(t => t.id === guest.tableId);
                    if (table && table.seats[guest.seatIndex]) {
                        table.seats[guest.seatIndex].guestId = null;
                    }
                }
                
                guests.splice(index, 1);
                saveData();
                updateGuestList();
                updateTables();
                updateStats();
            }
            
            // Fermer le modal
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
            
            showNotification("Invité supprimé avec succès");
        });
    }
    
    // Fonction pour initialiser les contrôles de tables
    function initTableControls() {
        const tableForm = document.getElementById('table-form');
        if (!tableForm) return;
        
        tableForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const seatsInput = document.getElementById('seats-count');
            const seatsCount = parseInt(seatsInput.value);
            
            if (isNaN(seatsCount) || seatsCount < 1 || seatsCount > 20) {
                showNotification("Veuillez entrer un nombre de places valide (1-20)", true);
                return;
            }
            
            addTable(seatsCount);
            tableForm.reset();
        });
    }
    
    // Fonction pour ajouter une table
    function addTable(seatsCount) {
        const tableId = Date.now().toString();
        
        const seats = Array(seatsCount).fill().map(() => ({
            guestId: null
        }));
        
        const table = {
            id: tableId,
            seats: seats
        };
        
        tables.push(table);
        saveData();
        updateTables();
        updateStats();
        
        showNotification(`Table de ${seatsCount} places ajoutée`);
    }
    
    // Fonction pour mettre à jour l'affichage des tables
    function updateTables() {
        const tablesContainer = document.getElementById('tables-container');
        if (!tablesContainer) return;
        
        // Vider le conteneur
        tablesContainer.innerHTML = '';
        
        if (tables.length === 0) {
            tablesContainer.innerHTML = `
                <div class="empty-list">
                    <i class="fas fa-chair"></i>
                    <p>Aucune table</p>
                </div>
            `;
            return;
        }
        
        // Afficher les tables
        tables.forEach((table, tableIndex) => {
            const tableEl = document.createElement('div');
            tableEl.className = 'table';
            tableEl.innerHTML = `
                <h3>Table ${tableIndex + 1}</h3>
                <div class="seats" id="table-${table.id}"></div>
                <button class="delete-table" data-id="${table.id}">Supprimer la table</button>
            `;
            
            tablesContainer.appendChild(tableEl);
            
            const seatsContainer = document.getElementById(`table-${table.id}`);
            
            // Ajouter les places
            table.seats.forEach((seat, seatIndex) => {
                const seatEl = document.createElement('div');
                seatEl.className = `seat${seat.guestId ? ' occupied' : ''}`;
                seatEl.dataset.tableId = table.id;
                seatEl.dataset.seatIndex = seatIndex;
                
                // Afficher le nom de l'invité si la place est occupée
                if (seat.guestId) {
                    const guest = guests.find(g => g.id === seat.guestId);
                    if (guest) {
                        seatEl.textContent = guest.name;
                        if (guest.isCouple) {
                            seatEl.textContent += guest.partnerName ? ` & ${guest.partnerName}` : ' +1';
                        }
                    }
                } else {
                    seatEl.textContent = 'Libre';
                }
                
                seatsContainer.appendChild(seatEl);
                
                // Événement de clic sur la place
                seatEl.addEventListener('click', function() {
                    // Si la place est occupée, la libérer
                    if (seat.guestId) {
                        const guest = guests.find(g => g.id === seat.guestId);
                        if (guest) {
                            guest.tableId = null;
                            guest.seatIndex = null;
                            seat.guestId = null;
                            saveData();
                            updateTables();
                            updateStats();
                            showNotification("Place libérée");
                        }
                    } else {
                        // Sinon, ouvrir le modal pour assigner un invité
                        assignGuest(table.id, seatIndex);
                    }
                });
            });
            
            // Événement pour supprimer la table
            tableEl.querySelector('.delete-table').addEventListener('click', function() {
                const tableId = this.dataset.id;
                
                const modal = document.createElement('div');
                modal.className = 'modal';
                modal.innerHTML = `
                    <div class="modal-content">
                        <span class="close">&times;</span>
                        <h3>Confirmer la suppression</h3>
                        <p>Êtes-vous sûr de vouloir supprimer cette table ?</p>
                        <div class="modal-actions">
                            <button class="secondary" id="cancel-delete">Annuler</button>
                            <button class="danger" id="confirm-delete">Supprimer</button>
                        </div>
                    </div>
                `;
                
                document.body.appendChild(modal);
                setTimeout(() => modal.classList.add('show'), 10);
                
                // Événements
                modal.querySelector('.close').addEventListener('click', () => {
                    modal.classList.remove('show');
                    setTimeout(() => modal.remove(), 300);
                });
                
                modal.querySelector('#cancel-delete').addEventListener('click', () => {
                    modal.classList.remove('show');
                    setTimeout(() => modal.remove(), 300);
                });
                
                modal.querySelector('#confirm-delete').addEventListener('click', () => {
                    // Supprimer la table
                    const index = tables.findIndex(t => t.id === tableId);
                    if (index !== -1) {
                        // Libérer les invités assis à cette table
                        const table = tables[index];
                        table.seats.forEach((seat, i) => {
                            if (seat.guestId) {
                                const guest = guests.find(g => g.id === seat.guestId);
                                if (guest) {
                                    guest.tableId = null;
                                    guest.seatIndex = null;
                                }
                            }
                        });
                        
                        tables.splice(index, 1);
                        saveData();
                        updateTables();
                        updateStats();
                    }
                    
                    // Fermer le modal
                    modal.classList.remove('show');
                    setTimeout(() => modal.remove(), 300);
                    
                    showNotification("Table supprimée avec succès");
                });
            });
        });
    }
    
    // Fonction pour assigner un invité à une place
    function assignGuest(tableId, seatIndex) {
        // Filtrer les invités sans place assignée
        const availableGuests = guests.filter(guest => guest.tableId === null);
        
        if (availableGuests.length === 0) {
            showNotification("Aucun invité disponible", true);
            return;
        }
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                <h3>Assigner un invité</h3>
                <p>Choisissez un invité à placer :</p>
                ${availableGuests.some(g => g.isCouple) ? 
                    `<p class="couple-note">Note: Les couples occuperont une seule place.</p>` : ''}
                <div class="guest-select"></div>
            </div>
        `;
        
        // Ajouter les options d'invités
        const guestSelect = modal.querySelector('.guest-select');
        availableGuests.forEach(guest => {
            const option = document.createElement('div');
            option.className = 'guest-option';
            option.dataset.id = guest.id;
            option.innerHTML = `
                <strong>${guest.name}</strong>
                ${guest.isCouple ? `<span class="badge-couple"><i class="fas fa-heart"></i> +1</span>` : ''}
                ${guest.isCouple && guest.partnerName ? `<div class="partner-name">avec ${guest.partnerName}</div>` : ''}
                <span class="status ${guest.status}">${
                    guest.status === 'pending' ? 'En attente' :
                    guest.status === 'confirmed' ? 'Confirmé' : 'Décliné'
                }</span>
            `;
            
            guestSelect.appendChild(option);
            
            // Événement de clic sur l'option
            option.addEventListener('click', function() {
                const guestId = this.dataset.id;
                const guest = guests.find(g => g.id === guestId);
                if (guest) {
                    // Assigner l'invité à la place
                    guest.tableId = tableId;
                    guest.seatIndex = seatIndex;
                    
                    // Mettre à jour la place
                    const table = tables.find(t => t.id === tableId);
                    if (table && table.seats[seatIndex]) {
                        table.seats[seatIndex].guestId = guestId;
                    }
                    
                    saveData();
                    updateTables();
                    updateStats();
                    
                    showNotification(`${guest.name} assigné à la place`);
                }
                
                // Fermer le modal
                modal.classList.remove('show');
                setTimeout(() => modal.remove(), 300);
            });
        });
        
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);
        
        // Événement pour fermer le modal
        modal.querySelector('.close').addEventListener('click', () => {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        });
    }
    
    // Fonction pour mettre à jour les statistiques
    function updateStats() {
        // Compter les invités par statut
        const totalGuests = guests.length;
        const confirmedGuests = guests.filter(g => g.status === 'confirmed').length;
        const pendingGuests = guests.filter(g => g.status === 'pending').length;
        const declinedGuests = guests.filter(g => g.status === 'declined').length;
        
        // Compter les invités placés
        const seatedGuests = guests.filter(g => g.tableId !== null).length;
        
        // Compter les places totales et disponibles
        const totalSeats = tables.reduce((total, table) => total + table.seats.length, 0);
        const availableSeats = totalSeats - seatedGuests;
        
        // Mettre à jour les statistiques
        document.getElementById('total-guests').textContent = totalGuests;
        document.getElementById('confirmed-guests').textContent = confirmedGuests;
        document.getElementById('pending-guests').textContent = pendingGuests;
        document.getElementById('declined-guests').textContent = declinedGuests;
        document.getElementById('seated-guests').textContent = seatedGuests;
        document.getElementById('total-seats').textContent = totalSeats;
        document.getElementById('available-seats').textContent = availableSeats;
    }
    
    // Fonction pour afficher une notification
    function showNotification(message, isError = false) {
        const notification = document.createElement('div');
        notification.className = `notification${isError ? ' error' : ''}`;
        notification.textContent = message;
        
        // Ajuster la position en fonction du footer
        const footer = document.querySelector('footer');
        if (footer) {
            notification.style.bottom = `${footer.offsetHeight + 10}px`;
        }
        
        document.body.appendChild(notification);
        
        // Afficher
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Cacher et supprimer après 3 secondes
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
});