window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    const splash = document.getElementById('splash-screen');
    if (splash) splash.classList.add('fade-out');
  }, 2200);
});

const defaultParts = [
  { id: 1, name: 'Carcaça CC064', containerType: 'Cesto', capacity: 110, containers: 0, loose: 0 },
  { id: 2, name: 'Tampa CC064', containerType: 'Caixa', capacity: 255, containers: 0, loose: 0 },
  { id: 3, name: 'KC620', containerType: 'Cesto', capacity: 186, containers: 0, loose: 0 }
];

let parts = [];

// Controle de Versão e Chaves do LocalStorage
const CURRENT_VERSION = 2; // Incremente este número para forçar atualização no cliente se mudar o defaultParts
const STORAGE_KEY = 'mahle_bu2_user_session_v2';
const VERSION_KEY = 'mahle_bu2_schema_version';

function loadSavedData() {
  const savedVersion = localStorage.getItem(VERSION_KEY);
  const savedData = localStorage.getItem(STORAGE_KEY);

  // Se a versão do schema for antiga ou não houver dados, recarrega o modelo padrão
  if (!savedVersion || parseInt(savedVersion, 10) < CURRENT_VERSION || !savedData) {
    parts = JSON.parse(JSON.stringify(defaultParts));
    localStorage.setItem(VERSION_KEY, CURRENT_VERSION.toString());
    saveData();
    return;
  }

  try {
    parts = JSON.parse(savedData);
  } catch (e) {
    parts = JSON.parse(JSON.stringify(defaultParts));
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(parts));
  updateTimestamp();
}

function updateTimestamp() {
  const now = new Date();
  document.getElementById('last-update').innerText = 'Atualizado: ' + now.toLocaleTimeString('pt-BR');
}

function renderUI() {
  const mobileContainer = document.getElementById('mobile-parts-container');
  const desktopBody = document.getElementById('desktop-table-body');

  mobileContainer.innerHTML = '';
  desktopBody.innerHTML = '';

  let grandTotal = 0;
  let totalContainers = 0;
  let totalLoose = 0;

  const filter = document.getElementById('search-input').value.toLowerCase();

  parts.forEach(part => {
    if (part.name.toLowerCase().includes(filter)) {
      const rowTotal = (part.containers * part.capacity) + part.loose;
      grandTotal += rowTotal;
      totalContainers += Number(part.containers);
      totalLoose += Number(part.loose);

      // Card Mobile
      const mobileCard = document.createElement('div');
      mobileCard.className = 'part-mobile-card';
      mobileCard.innerHTML = `
        <div class="part-mobile-header">
          <div class="part-mobile-title">${part.name}</div>
          <span class="badge-pack">${part.capacity} pcs / ${part.containerType}</span>
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
          <span style="font-size:0.78rem; color:var(--mahle-subtext); font-weight:700;">TOTAL DA PEÇA:</span>
          <div class="total-mobile-value">${rowTotal.toLocaleString('pt-BR')}</div>
        </div>
        <div class="action-btns-group">
          <button class="btn-label-mobile" onclick="printSingleLabel(${part.id})">🏷️ Etiqueta</button>
          <button class="btn-delete-mobile" onclick="removePart(${part.id})">🗑️ Excluir</button>
        </div>
      `;
      mobileContainer.appendChild(mobileCard);

      // Tabela Desktop
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong style="color: var(--mahle-blue);">${part.name}</strong></td>
        <td><span class="badge-pack">${part.capacity} pcs / ${part.containerType}</span></td>
        <td><input type="number" class="input-desktop" min="0" value="${part.containers}" onchange="updateQty(${part.id}, 'containers', this.value)"></td>
        <td><input type="number" class="input-desktop" min="0" value="${part.loose}" onchange="updateQty(${part.id}, 'loose', this.value)"></td>
        <td><strong style="font-size: 1.1rem; color: var(--mahle-blue);">${rowTotal.toLocaleString('pt-BR')}</strong></td>
        <td style="text-align: center;">
          <div class="action-btns-group" style="justify-content: center;">
            <button class="btn-label-mobile" onclick="printSingleLabel(${part.id})">🏷️ Etiqueta</button>
            <button class="btn-delete-mobile" onclick="removePart(${part.id})">🗑️ Excluir</button>
          </div>
        </td>
      `;
      desktopBody.appendChild(tr);
    }
  });

  document.getElementById('grand-total').innerText = grandTotal.toLocaleString('pt-BR');
  document.getElementById('total-containers').innerText = totalContainers.toLocaleString('pt-BR');
  document.getElementById('total-loose').innerText = totalLoose.toLocaleString('pt-BR');

  saveData();
}

function filterTable() {
  renderUI();
}

// VALIDAÇÃO DE QUANTIDADE ATUALIZADA
function updateQty(id, field, value) {
  let numValue = parseInt(value, 10);
  
  // Impede valores negativos ou textos inválidos (NaN)
  if (isNaN(numValue) || numValue < 0) {
    numValue = 0;
  }

  const part = parts.find(p => p.id === id);
  if (part) {
    part[field] = numValue;
    renderUI();
  }
}

// VALIDAÇÃO DE CADASTRO ATUALIZADA
function addNewPart(e) {
  e.preventDefault();
  const nameInput = document.getElementById('part-name');
  const containerTypeInput = document.getElementById('container-type');
  const capacityInput = document.getElementById('part-capacity');

  const name = nameInput.value.trim();
  const capacity = parseInt(capacityInput.value, 10);

  // Validação explícita de campos antes de cadastrar
  if (!name) {
    alert('Por favor, digite o nome ou código da peça.');
    return;
  }

  if (isNaN(capacity) || capacity <= 0) {
    alert('A quantidade padrão por embalagem deve ser um número maior que zero.');
    capacityInput.focus();
    return;
  }

  parts.push({
    id: Date.now(),
    name: name,
    containerType: containerTypeInput.value,
    capacity: capacity,
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
  const now = new Date().toLocaleString('pt-BR');

  const labelArea = document.getElementById('label-print-area');
  labelArea.innerHTML = `
    <div class="tag-card">
      <div class="tag-header">
        <div class="tag-brand">MAHLE</div>
        <div class="tag-plant">BU2 Mogi Guaçu<br>Controle de Inventário</div>
      </div>
      <div class="tag-title">${part.name}</div>
      <div class="tag-info-row">
        <span>Embalagem: <strong>${part.capacity} pcs / ${part.containerType}</strong></span>
      </div>
      <div class="tag-info-row">
        <span>Cheios: <strong>${part.containers} (${part.containerType}s)</strong></span>
        <span>Avulsas: <strong>${part.loose}</strong></span>
      </div>
      <div class="tag-info-row" style="margin-top:5px; font-size:0.75rem; color:#475569;">
        <span>Turno: <strong>${shift}</strong></span>
      </div>
      <div class="tag-total-box">
        <div style="font-size:0.75rem; font-weight:700;">TOTAL CONTABILIZADO</div>
        <div class="tag-total-val">${total.toLocaleString('pt-BR')} PCS</div>
      </div>
      <div style="margin-top:8px; font-size:0.65rem; text-align:center; color:#64748b;">
        Impresso em: ${now}
      </div>
    </div>
  `;

  document.body.classList.add('printing-label');
  window.print();

  setTimeout(() => {
    document.body.classList.remove('printing-label');
  }, 1000);
}

loadSavedData();
renderUI();
