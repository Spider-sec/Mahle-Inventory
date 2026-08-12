const defaultParts = [
    { id: 1, name: "Carcaça CC694", containerType: "Cesto", capacity: 110, containers: 0, loose: 0 },
    { id: 2, name: "Tampa CC694", containerType: "Caixa", capacity: 216, containers: 0, loose: 0 },
    { id: 3, name: "KC620", containerType: "Cesto", capacity: 186, containers: 0, loose: 0 }
];

let parts = [];
const STORAGE_KEY = 'mahle_bu2_user_session_v1';

window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        if (splash) splash.classList.add('fade-out');
    }, 2200);

    initApp();
});

function initApp() {
    loadSavedData();
    setupEventListeners();
    renderUI();
}

function setupEventListeners() {
    document.getElementById('add-part-form').addEventListener('submit', addNewPart);
    document.getElementById('search-input').addEventListener('keyup', filterTable);
    document.getElementById('shift-select').addEventListener('change', saveData);
    document.getElementById('btn-reset').addEventListener('click', resetCounts);
    document.getElementById('btn-export').addEventListener('click', exportPDF);
}

function loadSavedData() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try { parts = JSON.parse(saved); } 
        catch (e) { parts = JSON.parse(JSON.stringify(defaultParts)); }
    } else {
        parts = JSON.parse(JSON.stringify(defaultParts));
    }
}

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parts));
    updateTimestamp();
}

function updateTimestamp() {
    const now = new Date();
    document.getElementById('last-update').innerText = `Atualizado: ${now.toLocaleTimeString('pt-BR')}`;
}

function renderUI() {
    const mobileContainer = document.getElementById('mobile-parts-container');
    const desktopTbody = document.getElementById('desktop-table-body');
    
    mobileContainer.innerHTML = '';
    desktopTbody.innerHTML = '';

    let grandTotal = 0;
    let totalContainers = 0;
    let totalLoose = 0;

    const filter = document.getElementById('search-input').value.toLowerCase();

    parts.forEach((part) => {
        if (part.name.toLowerCase().includes(filter)) {
            const rowTotal = (part.containers * part.capacity) + part.loose;
            grandTotal += rowTotal;
            totalContainers += Number(part.containers);
            totalLoose += Number(part.loose);

            const mobileCard = document.createElement('div');
            mobileCard.className = 'part-mobile-card';
            mobileCard.innerHTML = `
                <div class="part-mobile-header">
                    <div class="part-mobile-title">${part.name}</div>
                    <span class="badge-pack">${part.capacity} pçs / ${part.containerType}</span>
                </div>
                <div class="part-mobile-inputs">
                    <div class="input-box-mobile">
                        <label style="font-size:0.7rem; font-weight:700;">${part.containerType}s Cheios</label>
                        <input type="number" min="0" value="${part.containers}" onchange="updateQty(${part.id}, 'containers', this.value)">
                    </div>
                    <div class="input-box-mobile">
                        <label style="font-size:0.7rem; font-weight:700;">Peças Avulsas</label>
                        <input type="number" min="0" value="${part.loose}" onchange="updateQty(${part.id}, 'loose', this.value)">
                    </div>
                </div>
                <div class="part-mobile-footer">
                    <div>
                        <span style="font-size:0.75rem; color:var(--mahle-subtext); font-weight:700;">TOTAL DA PEÇA:</span>
                        <div class="total-mobile-value">${rowTotal.toLocaleString('pt-BR')}</div>
                    </div>
                    <div class="action-btns-group">
                        <button class="btn-label-mobile" onclick="printSingleLabel(${part.id})">🏷️ Etiqueta</button>
                        <button class="btn-delete-mobile" onclick="removePart(${part.id})">🗑️ Excluir</button>
                    </div>
                </div>
            `;
            mobileContainer.appendChild(mobileCard);

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong style="color:var(--mahle-blue);">${part.name}</strong></td>
                <td><span class="badge-pack">${part.capacity} pçs / ${part.containerType}</span></td>
                <td><input type="number" class="input-desktop" min="0" value="${part.containers}" onchange="updateQty(${part.id}, 'containers', this.value)"></td>
                <td><input type="number" class="input-desktop" min="0" value="${part.loose}" onchange="updateQty(${part.id}, 'loose', this.value)"></td>
                <td><strong style="font-size:1.1rem; color:var(--mahle-blue);">${rowTotal.toLocaleString('pt-BR')}</strong></td>
                <td style="text-align: center;">
                    <div class="action-btns-group" style="justify-content: center;">
                        <button class="btn-label-mobile" onclick="printSingleLabel(${part.id})">🏷️ Etiqueta</button>
                        <button class="btn-delete-mobile" onclick="removePart(${part.id})">🗑️ Excluir</button>
                    </div>
                </td>
            `;
            desktopTbody.appendChild(tr);
        }
    });

    document.getElementById('grand-total').innerText = grandTotal.toLocaleString('pt-BR');
    document.getElementById('total-containers').innerText = totalContainers.toLocaleString('pt-BR');
    document.getElementById('total-loose').innerText = totalLoose.toLocaleString('pt-BR');

    saveData();
}

function filterTable() { renderUI(); }

function updateQty(id, field, value) {
    const numValue = Math.max(0, parseInt(value) || 0);
    const part = parts.find(p => p.id === id);
    if (part) {
        part[field] = numValue;
        renderUI();
    }
}

function addNewPart(e) {
    e.preventDefault();
    const nameInput = document.getElementById('part-name');
    const containerTypeInput = document.getElementById('container-type');
    const capacityInput = document.getElementById('part-capacity');

    parts.push({
        id: Date.now(),
        name: nameInput.value.trim(),
        containerType: containerTypeInput.value,
        capacity: parseInt(capacityInput.value) || 0,
        containers: 0,
        loose: 0
    });

    renderUI();
    nameInput.value = '';
    capacityInput.value = '';
}

function removePart(id) {
    if (confirm('Remover esta peça da sua lista?')) {
        parts = parts.filter(p => p.id !== id);
        renderUI();
    }
}

function resetCounts() {
    if (confirm('Zerar toda a sua contagem neste dispositivo?')) {
        parts.forEach(p => { p.containers = 0; p.loose = 0; });
        renderUI();
    }
}

function exportPDF() {
    document.body.classList.remove('printing-label');
    window.print();
}

function printSingleLabel(id) {
    const part = parts.find(p => p.id === id);
    if (!part) return;

    const shift = document.getElementById('shift-select').value;
    const total = (part.containers * part.capacity) + part.loose;
    
    const d = new Date();
    const dateStr = d.toLocaleDateString('pt-BR');
    const timeStr = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const nowFormatted = `${dateStr}, ${timeStr}`;

    const labelArea = document.getElementById('label-print-area');
    labelArea.innerHTML = `
        <div class="tag-card">
            <div class="tag-header">
                <div class="tag-brand">MAHLE</div>
                <div class="tag-plant">BU2 Mogi Guaçu<br>Controle de Inventário</div>
            </div>
            <div class="tag-title">${part.name}</div>
            <div class="tag-info-row">
                <span><strong>Embalagem:</strong> ${part.capacity} pçs / ${part.containerType}</span>
            </div>
            <div class="tag-info-row">
                <span><strong>Cheios:</strong> ${part.containers} (${part.containerType}s)</span>
                <span><strong>Avulsas:</strong> ${part.loose}</span>
            </div>
            <div class="tag-info-row" style="margin-top:2px; font-size:0.75rem; color:#475569;">
                <span><strong>Turno:</strong> ${shift}</span>
            </div>
            <div class="tag-total-box">
                <div style="font-size:0.65rem; font-weight:700;">TOTAL CONTABILIZADO</div>
                <div class="tag-total-val">${total.toLocaleString('pt-BR')} PÇS</div>
            </div>
            <div class="barcode-container">
                <svg id="barcode"></svg>
            </div>
            <div style="font-size:0.6rem; text-align:center; color:#64748b;">
                Impresso em: ${nowFormatted}
            </div>
        </div>
    `;

    try {
        JsBarcode("#barcode", part.name, {
            format: "CODE128",
            width: 1.5,
            height: 30,
            displayValue: true,
            fontSize: 10,
            margin: 0
        });
    } catch(e) {
        console.log("Erro ao gerar código de barras", e);
    }

    document.body.classList.add('printing-label');
    window.print();
    
    setTimeout(() => {
        document.body.classList.remove('printing-label');
    }, 1000);
}
