// Configuration de la table en U
let uTable = {
    leftSeats: 8,
    rightSeats: 8,
    bottomSeats: 6,
    seats: [] // Tableau des sièges avec leurs occupants
};

// Initialisation de la table en U
function initUTableControls() {
    const updateBtn = document.getElementById('updateUTable');
    const leftInput = document.getElementById('leftSideSeats');
    const rightInput = document.getElementById('rightSideSeats');
    const bottomInput = document.getElementById('bottomSideSeats');
    
    // Charger les données depuis localStorage s'il en existe
    if (localStorage.getItem('uTable')) {
        uTable = JSON.parse(localStorage.getItem('uTable'));
        leftInput.value = uTable.leftSeats;
        rightInput.value = uTable.rightSeats;
        bottomInput.value = uTable.bottomSeats;
    } else {
        // Initialiser le tableau des sièges si c'est la première fois
        resetUTableSeats();
    }
    
    // Bouton de mise à jour
    updateBtn.addEventListener('click', () => {
        // Récupérer les valeurs
        uTable.leftSeats = parseInt(leftInput.value) || 8;
        uTable.rightSeats = parseInt(rightInput.value) || 8;
        uTable.bottomSeats = parseInt(bottomInput.value) || 6;
        
        // Vérifier si le nombre total de sièges a changé
        const totalSeats = uTable.leftSeats + uTable.rightSeats + uTable.bottomSeats;
        if (totalSeats !== uTable.seats.length) {
            // Réinitialiser les sièges en conservant les occupants si possible
            const oldSeats = [...uTable.seats];
            resetUTableSeats();
            
            // Restaurer les occupants dans les nouveaux sièges s'ils existent encore
            for (let i = 0; i < Math.min(oldSeats.length, uTable.seats.length); i++) {
                if (oldSeats[i]) {
                    uTable.seats[i] = oldSeats[i];
                }
            }
        }
        
        // Sauvegarder et mettre à jour l'affichage
        saveUTableData();
        renderUTable();
        showNotification('Table en U mise à jour');
    });
    
    // Rendre la table initiale
    renderUTable();
}

// Réinitialiser les sièges de la table en U
function resetUTableSeats() {
    const totalSeats = uTable.leftSeats + uTable.rightSeats + uTable.bottomSeats;
    uTable.seats = new Array(totalSeats).fill(null);
}

// Sauvegarder les données de la table en U
function saveUTableData() {
    localStorage.setItem('uTable', JSON.stringify(uTable));
}

// Rendu de la table en U
function renderUTable() {
    const container = document.getElementById('uTableVisualizer');
    container.innerHTML = '';
    
    // Créer le conteneur de la table en U
    const tableDiv = document.createElement('div');
    tableDiv.className = 'u-table';
    
    // Ajouter les côtés de la table
    const leftSide = document.createElement('div');
    leftSide.className = 'u-table-left';
    
    const rightSide = document.createElement('div');
    rightSide.className = 'u-table-right';
    
    const bottomSide = document.createElement('div');
    bottomSide.className = 'u-table-bottom';
    
    tableDiv.appendChild(leftSide);
    tableDiv.appendChild(rightSide);
    tableDiv.appendChild(bottomSide);
    
    // Ajouter à la page
    container.appendChild(tableDiv);
    
    // Dimensionner la table en fonction du nombre de sièges
    const maxSideSeats = Math.max(uTable.leftSeats, uTable.rightSeats);
    const tableHeight = maxSideSeats * 70 + 100; // 70px par siège + espace
    const tableWidth = uTable.bottomSeats * 70 + 160; // 70px par siège + espace pour les côtés
    
    tableDiv.style.height = `${tableHeight}px`;
    tableDiv.style.width = `${tableWidth}px`;
    
    // Ajuster les dimensions des côtés
    leftSide.style.height = `${tableHeight - 80}px`;
    rightSide.style.height = `${tableHeight - 80}px`;
    bottomSide.style.width = `${tableWidth - 160}px`;
    
    // Créer et positionner les sièges
    let seatIndex = 0;
    
    // Sièges du côté gauche
    for (let i = 0; i < uTable.leftSeats; i++) {
        const seat = createSeat(seatIndex, leftSide.offsetWidth + 10, i * 70 + 10);
        seat.dataset.position = 'left';
        seat.dataset.relativeIndex = i;
        container.appendChild(seat);
        seatIndex++;
    }
    
    // Sièges du côté bas
    for (let i = 0; i < uTable.bottomSeats; i++) {
        const seat = createSeat(seatIndex, leftSide.offsetWidth + 80 + i * 70, tableHeight - 80 - 10 - 60);
        seat.dataset.position = 'bottom';
        seat.dataset.relativeIndex = i;
        container.appendChild(seat);
        seatIndex++;
    }
    
    // Sièges du côté droit
    for (let i = 0; i < uTable.rightSeats; i++) {
        const seat = createSeat(seatIndex, tableWidth - rightSide.offsetWidth - 10 - 60, i * 70 + 10);
        seat.dataset.position = 'right';
        seat.dataset.relativeIndex = i;
        container.appendChild(seat);
        seatIndex++;
    }
    
    // Ajouter une légende
    const legend = document.createElement('div');
    legend.className = 'u-table-legend';
    legend.textContent = "Cliquez sur un siège pour y assigner un invité";
    container.appendChild(legend);
}

// Créer un siège individuel
function createSeat(index, left, top) {
    const seat = document.createElement('div');
    seat.className = 'u-table-seat';
    seat.style.left = `${left}px`;
    seat.style.top = `${top}px`;
    seat.dataset.index = index;
    
    // Vérifier si le siège est occupé
    if (uTable.seats[index]) {
        seat.classList.add('occupied');
        
        // Afficher le nom de l'invité ou du couple
        const guest = uTable.seats[index];
        
        if (guest.isCouple && guest.partner && guest.seatPart === undefined) {
            seat.innerHTML = `${guest.name}<br><small>& ${guest.partner}</small>`;
        } else if (guest.seatPart === 'partner') {
            seat.textContent = guest.partner;
        } else {
            seat.textContent = guest.name;
        }
    } else {
        seat.innerHTML = '<i class="fas fa-plus"></i>';
    }
    
    // Ajouter un écouteur d'événement pour assigner/retirer un invité
    seat.addEventListener('click', () => assignUTableSeat(index));
    
    return seat;
}

// Assigner un invité à un siège
function assignUTableSeat(seatIndex) {
    // Si le siège est occupé, le libérer
    if (uTable.seats[seatIndex]) {
        // Vérifier si c'est un couple pour libérer les deux sièges
        const currentGuest = uTable.seats[seatIndex];
        
        if (currentGuest.isCouple && !currentGuest.seatPart) {
            // Chercher le siège du partenaire
            for (let i = 0; i < uTable.seats.length; i++) {
                if (uTable.seats[i] && uTable.seats[i].id === currentGuest.id && uTable.seats[i].seatPart === 'partner') {
                    uTable.seats[i] = null;
                    break;
                }
            }
        } else if (currentGuest.seatPart === 'partner') {
            // Chercher le siège principal du couple
            for (let i = 0; i < uTable.seats.length; i++) {
                if (uTable.seats[i] && uTable.seats[i].id === currentGuest.id && !uTable.seats[i].seatPart) {
                    uTable.seats[i] = null;
                    break;
                }
            }
        }
        
        // Libérer le siège actuel
        uTable.seats[seatIndex] = null;
        saveUTableData();
        renderUTable();
        return;
    }
    
    // Filtrer les invités disponibles (confirmés et pas déjà assignés à cette table)
    const assignedGuestIds = uTable.seats
        .filter(seat => seat !== null)
        .map(seat => seat.id);
        
    const availableGuests = guests.filter(g => 
        g.status === 'confirmed' && 
        !assignedGuestIds.includes(g.id)
    );
    
    if (availableGuests.length === 0) {
        showNotification('Aucun invité confirmé disponible', true);
        return;
    }
    
    // Afficher une modale pour sélectionner un invité
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Assigner un invité</h3>
            <p class="couple-note">Note: Les couples peuvent être placés côte à côte si vous le souhaitez.</p>
            <div class="guest-select">
                ${availableGuests.map(guest => {
                    // Afficher le statut couple
                    const coupleInfo = guest.isCouple && guest.partner 
                        ? `<span class="badge-couple"><i class="fas fa-heart"></i> Couple</span><div class="partner-name">avec ${guest.partner}</div>` 
                        : '';
                    
                    return `
                        <div class="guest-option" data-id="${guest.id}">
                            ${guest.name} ${coupleInfo}
                        </div>
                    `;
                }).join('')}
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
                // Placer l'invité sur le siège sélectionné
                uTable.seats[seatIndex] = guest;
                
                // Si c'est un couple et que l'utilisateur veut placer le partenaire à côté
                if (guest.isCouple && guest.partner) {
                    // Demander si l'utilisateur veut placer le partenaire à côté
                    showCoupleOptions(guest, seatIndex);
                } else {
                    saveUTableData();
                    renderUTable();
                }
                
                modal.remove();
            }
        });
    });
}

// Afficher les options pour placer le partenaire
function showCoupleOptions(guest, seatIndex) {
    const currentSeat = document.querySelector(`.u-table-seat[data-index="${seatIndex}"]`);
    const position = currentSeat.dataset.position;
    const relIndex = parseInt(currentSeat.dataset.relativeIndex);
    
    // Vérifier si un siège adjacent est disponible
    let adjacentSeatIndex = -1;
    let adjacentSeatElement = null;
    
    // Rechercher le siège adjacent selon la position
    if (position === 'left' || position === 'right') {
        // Regarder en dessous
        if (relIndex + 1 < (position === 'left' ? uTable.leftSeats : uTable.rightSeats)) {
            adjacentSeatElement = document.querySelector(`.u-table-seat[data-position="${position}"][data-relative-index="${relIndex + 1}"]`);
        }
        // Regarder au-dessus
        else if (relIndex > 0) {
            adjacentSeatElement = document.querySelector(`.u-table-seat[data-position="${position}"][data-relative-index="${relIndex - 1}"]`);
        }
    } else if (position === 'bottom') {
        // Regarder à droite
        if (relIndex + 1 < uTable.bottomSeats) {
            adjacentSeatElement = document.querySelector(`.u-table-seat[data-position="bottom"][data-relative-index="${relIndex + 1}"]`);
        }
        // Regarder à gauche
        else if (relIndex > 0) {
            adjacentSeatElement = document.querySelector(`.u-table-seat[data-position="bottom"][data-relative-index="${relIndex - 1}"]`);
        }
    }
    
    // Vérifier si le siège adjacent est libre
    if (adjacentSeatElement) {
        adjacentSeatIndex = parseInt(adjacentSeatElement.dataset.index);
        if (uTable.seats[adjacentSeatIndex]) {
            adjacentSeatIndex = -1; // Le siège n'est pas libre
        }
    }
    
    // Si un siège adjacent est disponible, proposer de placer le partenaire
    if (adjacentSeatIndex !== -1) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Placer le partenaire</h3>
                <p>Souhaitez-vous placer ${guest.partner} sur le siège adjacent ?</p>
                <div class="modal-actions">
                    <button id="placeAlone">Non, seulement ${guest.name}</button>
                    <button id="placeCouple" class="primary">Oui, placer le couple</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Placer seulement l'invité principal
        document.getElementById('placeAlone').addEventListener('click', () => {
            saveUTableData();
            renderUTable();
            modal.remove();
        });
        
        // Placer le couple
        document.getElementById('placeCouple').addEventListener('click', () => {
            // Créer une copie pour le partenaire
            const partnerCopy = {...guest, seatPart: 'partner'};
            uTable.seats[adjacentSeatIndex] = partnerCopy;
            
            saveUTableData();
            renderUTable();
            modal.remove();
        });
    } else {
        // Si pas de place adjacente, informer l'utilisateur
        saveUTableData();
        renderUTable();
        showNotification('Pas de siège adjacent disponible pour le partenaire', true);
    }
}

// Exporter les données de la table en U avec les autres données
const originalExportData = exportData;
exportData = function() {
    // Créer l'objet de données
    const data = {
        guests: guests,
        tables: tables,
        uTable: uTable,
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

// Modifier l'importation pour inclure la table en U
const originalShowImportConfirmation = showImportConfirmation;
showImportConfirmation = function(data) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Confirmer l'importation</h3>
            <p>Cette action remplacera toutes vos données actuelles.</p>
            <p>Exportées le: ${new Date(data.exportDate || Date.now()).toLocaleString()}</p>
            <p>Invités: ${data.guests.length}</p>
            <p>Tables: ${data.tables.length}</p>
            <p>Table en U: ${data.uTable ? 'Oui' : 'Non'}</p>
            
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
        
        // Sauvegarder et mettre à jour l'affichage
        saveData();
        saveUTableData();
        updateGuestList();
        updateTables();
        updateStats();
        
        modal.remove();
        showNotification('Données importées avec succès');
    });
};