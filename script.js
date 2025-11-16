let isAdminMode = false;
let currentPhone = null; 
let currentData = null;
let allClientsData = {}; // Pour stocker toutes les données clients

function toggleAdminMode() {
    const adminBtn = document.getElementById("adminToggleBtn");
    const inputCard = document.querySelector(".tt-input-card");
    
    if (isAdminMode) {
        // Désactiver le mode admin
        isAdminMode = false;
        alert("Mode Client activé 👤");
        
        if (adminBtn) {
            adminBtn.innerHTML = "🔓 Client";
            adminBtn.classList.remove("admin-active");
        }
        
        // Réafficher la barre de recherche
        if (inputCard) {
            inputCard.style.display = "block";
        }
        
        // Réinitialiser l'interface client
        resetClientInterface();
        return;
    }
    
    // Activer le mode admin
    const code = prompt("Entrez le code admin:");
    if (code === "admin2025") { 
        isAdminMode = true;
        alert("Mode Chef activé ✅");
        
        if (adminBtn) {
            adminBtn.innerHTML = "🔒 Admin";
            adminBtn.classList.add("admin-active");
        }
        
        // Masquer la barre de recherche
        if (inputCard) {
            inputCard.style.display = "none";
        }
        
        // Charger le tableau de bord admin
        loadAdminDashboard();
    } else if (code !== null) {
        alert("Code incorrect ❌");
    }
}

function resetClientInterface() {
    const phoneInput = document.getElementById("phone");
    const resultsDiv = document.getElementById("results");
    const checkButton = document.getElementById("checkButton");
    const newButton = document.getElementById("newButton");
    
    currentPhone = null;
    currentData = null;
    phoneInput.value = "";
    resultsDiv.innerHTML = "";
    
    if (checkButton) {
        checkButton.style.display = "inline-block";
        checkButton.textContent = "Vérifier";
        checkButton.className = "btn btn-primary";
        checkButton.setAttribute("onclick", "checkProblem()");
    }
    
    if (newButton) {
        newButton.style.display = "none";
    }
}

function loadAdminDashboard() {
    const resultsDiv = document.getElementById("results");
    const checkButton = document.getElementById("checkButton");
    const newButton = document.getElementById("newButton");
    const inputCard = document.querySelector(".tt-input-card");
    
    // Masquer la barre de recherche et les boutons
    if (inputCard) inputCard.style.display = "none";
    if (checkButton) checkButton.style.display = "none";
    if (newButton) newButton.style.display = "none";
    
    resultsDiv.innerHTML = `
        <div class="placeholder">
            <div class="loader"></div>
            <p>Chargement du tableau de bord...</p>
        </div>
    `;
    
    // Charger toutes les données clients
    fetch("/get_all_clients", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        }
    })
    .then(response => response.json())
    .then(data => {
        allClientsData = data;
        displayAdminDashboard(data);
    })
    .catch(error => {
        resultsDiv.innerHTML = `
            <div class="problem-alert problem-error">
                <h3>Erreur</h3>
                <p>Impossible de charger les données du tableau de bord</p>
            </div>
        `;
    });
}

function displayAdminDashboard(clients) {
    const resultsDiv = document.getElementById("results");
    
    // Convertir l'objet en tableau et trier par gravité
    const clientsArray = Object.entries(clients).map(([phone, data]) => ({
        phone,
        ...data
    }));
    
    // Ordre de priorité: critical > warning > resolved
    const severityOrder = { critical: 1, warning: 2, resolved: 3 };
    clientsArray.sort((a, b) => {
        const orderA = severityOrder[a.severity] || 999;
        const orderB = severityOrder[b.severity] || 999;
        return orderA - orderB;
    });
    
    // Statistiques
    const criticalCount = clientsArray.filter(c => c.severity === 'critical').length;
    const warningCount = clientsArray.filter(c => c.severity === 'warning').length;
    const resolvedCount = clientsArray.filter(c => c.severity === 'resolved').length;
    
    let dashboardHTML = `
        <div class="admin-dashboard">
            <div class="dashboard-header">
                <h2>📊 Tableau de Bord </h2>
                <button onclick="refreshDashboard()" class="refresh-btn">🔄 Actualiser</button>
            </div>
            
            <div class="dashboard-stats">
                <div class="stat-card stat-critical">
                    <div class="stat-number">${criticalCount}</div>
                    <div class="stat-label">URGENT</div>
                </div>
                <div class="stat-card stat-warning">
                    <div class="stat-number">${warningCount}</div>
                    <div class="stat-label">ALERTE</div>
                </div>
                <div class="stat-card stat-success">
                    <div class="stat-number">${resolvedCount}</div>
                    <div class="stat-label">OK</div>
                </div>
            </div>
            
            <div class="dashboard-table">
                <table class="clients-table">
                    <thead>
                        <tr>
                            <th>Numéro</th>
                            <th>Statut</th>
                            <th>Problème</th>
                            <th>Facture</th>
                            <th>Dernière vérif.</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    clientsArray.forEach(client => {
        const formattedPhone = client.phone.replace(/(\d{2})(\d{3})(\d{3})/, "$1 $2 $3");
        
        let statusBadge = '';
        let statusClass = '';
        switch(client.severity) {
            case "critical":
                statusBadge = '<span class="table-badge badge-critical">URGENT</span>';
                statusClass = 'row-critical';
                break;
            case "warning":
                statusBadge = '<span class="table-badge badge-warning">ALERTE</span>';
                statusClass = 'row-warning';
                break;
            default:
                statusBadge = '<span class="table-badge badge-success">OK</span>';
                statusClass = 'row-resolved';
        }
        
        const billStatus = client.bill_due ? 
            '<span class="bill-status bill-unpaid">🔴 IMPAYÉE</span>' : 
            '<span class="bill-status bill-paid">🟢 À JOUR</span>';
        
        const actionButton = client.severity !== 'resolved' ? 
            `<button onclick="repairFromDashboard('${client.phone}')" class="repair-btn">🔧 Réparer</button>` :
            '<span class="no-action">✓ Résolu</span>';
        
        dashboardHTML += `
            <tr class="${statusClass}">
                <td class="phone-cell">${formattedPhone}</td>
                <td>${statusBadge}</td>
                <td class="problem-cell">${client.problem}</td>
                <td>${billStatus}</td>
                <td>${client.last_checked}</td>
                <td>${actionButton}</td>
            </tr>
        `;
    });
    
    dashboardHTML += `
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    resultsDiv.innerHTML = dashboardHTML;
}

function refreshDashboard() {
    if (!isAdminMode) return;
    loadAdminDashboard();
}

function repairFromDashboard(phone) {
    if (!isAdminMode) {
        alert("⛔ Action réservée au Chef de Département");
        return;
    }
    
    if (!confirm(`Voulez-vous réparer le numéro ${phone.replace(/(\d{2})(\d{3})(\d{3})/, "$1 $2 $3")} ?`)) {
        return;
    }
    
    fetch("/repair", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ phone: phone })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert("Le numéro a été réparé avec succès! ✅");
            // Recharger le tableau de bord
            loadAdminDashboard();
        } else {
            alert("Erreur lors de la réparation: " + data.error);
        }
    })
    .catch(error => {
        alert("Erreur lors de la réparation: " + error);
    });
}

// Fonction pour le mode client normal
document.getElementById("phone").addEventListener("input", function(e) {
    let raw = e.target.value.replace(/\D/g, "").substring(0, 8);
    let formatted = raw;

    if (raw.length > 2 && raw.length <= 5) {
        formatted = raw.slice(0, 2) + " " + raw.slice(2);
    } else if (raw.length > 5) {
        formatted = raw.slice(0, 2) + " " + raw.slice(2, 5) + " " + raw.slice(5);
    }

    e.target.value = formatted;
});

function checkProblem() {
    const input = document.getElementById("phone").value;
    const phone = input.replace(/\s/g, "").trim();
    const resultsDiv = document.getElementById("results");
    const checkButton = document.getElementById("checkButton");
    const newButton = document.getElementById("newButton");

    if (!/^\d{8}$/.test(phone)) {
        alert("Veuillez entrer un numéro de 8 chiffres");
        return;
    }

    resultsDiv.innerHTML = `
        <div class="placeholder">
            <div class="loader"></div>
            <p>Analyse en cours...</p>
        </div>
    `;

    fetch("/check", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ phone: phone })
    })
    .then(response => response.json())
    .then(data => {
        currentPhone = input;
        currentData = data;
        
        displayResults(input, data);
        
        if (checkButton && data.severity !== "resolved" && isAdminMode) {
            checkButton.textContent = "Réparer";
            checkButton.className = "btn btn-warning";
            checkButton.setAttribute("onclick", `repairProblem('${phone}')`);
            
            if (newButton) {
                newButton.style.display = "inline-block";
            }
        } else if (checkButton && !isAdminMode) {
            checkButton.style.display = "none";
            
            if (newButton) {
                newButton.style.display = "inline-block";
            }
        } else if (checkButton && data.severity === "resolved" && isAdminMode) {
            checkButton.style.display = "none";
            
            if (newButton) {
                newButton.style.display = "inline-block";
            }
        }
    })
    .catch(error => {
        resultsDiv.innerHTML = `
            <div class="problem-alert problem-error">
                <h3>Erreur</h3>
                <p>Impossible de charger les données (${error})</p>
            </div>
        `;
    });
}

function repairProblem(phone) {
    if (!isAdminMode) {
        alert("⛔ Action réservée au Chef de Département");
        return;
    }

    const resultsDiv = document.getElementById("results");
    const checkButton = document.getElementById("checkButton");
    const newButton = document.getElementById("newButton");

    resultsDiv.innerHTML = `
        <div class="placeholder">
            <div class="loader"></div>
            <p>Réparation en cours...</p>
        </div>
    `;

    fetch("/repair", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ phone: phone })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const formattedPhone = phone.replace(/(\d{2})(\d{3})(\d{3})/, "$1 $2 $3");
            const repairedData = {
                problem: "Aucun problème",
                severity: "resolved",
                last_checked: new Date().toLocaleDateString('fr-FR'),
                bill_due: false
            };
            
            currentPhone = formattedPhone;
            currentData = repairedData;
            
            displayResults(formattedPhone, repairedData);
            
            if (checkButton) {
                checkButton.style.display = "none";
            }
            
            if (newButton) {
                newButton.style.display = "inline-block";
            }
            
            alert("Le numéro a été réparé avec succès! ✅");
        } else {
            alert("Erreur lors de la réparation: " + data.error);
        }
    })
    .catch(error => {
        resultsDiv.innerHTML = `
            <div class="problem-alert problem-error">
                <h3>Erreur</h3>
                <p>Impossible de réparer le numéro (${error})</p>
            </div>
        `;
    });
}

function newCheck() {
    const phoneInput = document.getElementById("phone");
    const resultsDiv = document.getElementById("results");
    const checkButton = document.getElementById("checkButton");
    const newButton = document.getElementById("newButton");
    
    currentPhone = null;
    currentData = null;
    
    phoneInput.value = "";
    phoneInput.focus();
    resultsDiv.innerHTML = "";
    
    if (checkButton) {
        checkButton.style.display = "inline-block";
        checkButton.textContent = "Vérifier";
        checkButton.className = "btn btn-primary";
        checkButton.setAttribute("onclick", "checkProblem()");
    }
    
    if (newButton) {
        newButton.style.display = "none";
    }
}

function displayResults(phone, data) {
    const resultsDiv = document.getElementById("results");
    
    if (data.problem === "No data found") {
        resultsDiv.innerHTML = `
            <div class="problem-alert">
                <h3>Résultats pour: ${phone}</h3>
                <p><strong>Statut:</strong> Aucune donnée trouvée-Veuillez réessayer</p>
            </div>
        `;
        return;
    }
    
    let severityClass = "";
    let severityBadge = "";

    switch(data.severity) {
        case "critical":
            severityClass = "problem-critical";
            severityBadge = `<span class="status-badge badge-critical">URGENT</span>`;
            break;
        case "warning":
            severityClass = "problem-warning";
            severityBadge = `<span class="status-badge badge-warning">ALERTE</span>`;
            break;
        default:
            severityClass = "problem-resolved";
            severityBadge = `<span class="status-badge badge-success">OK</span>`;
    }

    resultsDiv.innerHTML = `
        <div class="problem-alert ${severityClass}">
            <h3>Résultats pour: ${phone} ${severityBadge}</h3>
            <p><strong>Statut:</strong> ${data.problem}</p>
            <p><strong>Dernier vérifié:</strong> ${data.last_checked}</p>
            ${data.bill_due !== null ? 
                `<p><strong>Facture:</strong> ${data.bill_due ? "IMPAYÉE 🔴" : "À JOUR 🟢"}</p>` : ''
            }
        </div>
    `;
}