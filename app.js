const API_BASE = 'http://localhost:3000/api';

// DOM Elements
const slotsGrid = document.getElementById('slotsGrid');
const slotSelect = document.getElementById('slotSelect');
const activeList = document.getElementById('activeList');
const entryForm = document.getElementById('entryForm');

// Initialize Dashboard
async function init() {
  await fetchSlots();
  await fetchActiveVehicles();
}

// Fetch and render parking slots
async function fetchSlots() {
  try {
    const res = await fetch(`${API_BASE}/slots`);
    const slots = await res.json();
    
    slotsGrid.innerHTML = '';
    slotSelect.innerHTML = '<option value="" disabled selected>Select a slot...</option>';
    
    slots.forEach(slot => {
      // Create slot card
      const card = document.createElement('div');
      card.className = `slot-card ${slot.Status}`;
      card.innerHTML = `
        <div class="slot-id">Slot ${slot.SlotID}</div>
        <div class="slot-type">${slot.SlotType}</div>
        <div style="margin-top: 10px; font-weight: 600; font-size: 0.85rem; color: ${slot.Status === 'Available' ? 'var(--success)' : 'var(--danger)'}">
          ${slot.Status}
        </div>
      `;
      slotsGrid.appendChild(card);

      // Populate select dropdown for available slots
      if (slot.Status === 'Available') {
        const option = document.createElement('option');
        option.value = slot.SlotID;
        option.textContent = `Slot ${slot.SlotID} - ${slot.SlotType}`;
        slotSelect.appendChild(option);
      }
    });

    if(slots.length === 0) {
      slotsGrid.innerHTML = '<div style="color:var(--text-muted); grid-column: 1/-1;">No slots configured in database.</div>';
    }
  } catch (error) {
    console.error('Error fetching slots:', error);
    slotsGrid.innerHTML = `<div style="color:var(--danger); grid-column: 1/-1;">Failed to load slots. Is the backend running?</div>`;
  }
}

// Fetch and render active parked vehicles
async function fetchActiveVehicles() {
  try {
    const res = await fetch(`${API_BASE}/park/active`);
    const vehicles = await res.json();
    
    activeList.innerHTML = '';
    
    if (vehicles.length === 0) {
      activeList.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">No vehicles currently parked.</p>';
      return;
    }
    
    vehicles.forEach(v => {
      const item = document.createElement('div');
      item.className = 'active-item';
      
      const entryTime = new Date(v.EntryTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      
      item.innerHTML = `
        <div class="active-info">
          <strong>${v.OwnerName} (${v.VehicleType})</strong>
          <span>Slot ${v.SlotID} &bull; Entered: ${entryTime}</span>
        </div>
        <button type="button" class="btn danger-btn" onclick="exitVehicle(${v.RecordID}, ${v.SlotID})" style="width: auto; margin-top: 0;">Exit</button>
      `;
      activeList.appendChild(item);
    });
  } catch (error) {
    console.error('Error fetching active vehicles:', error);
    activeList.innerHTML = '<p style="color: var(--danger);">Failed to load vehicles.</p>';
  }
}

// Handle Entry Form Submission
entryForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const ownerName = document.getElementById('ownerName').value;
  const vehicleType = document.getElementById('vehicleType').value;
  const slotId = document.getElementById('slotSelect').value;
  
  if (!slotId) return alert('Please select an available slot');

  // Add brief loading state to button
  const submitBtn = entryForm.querySelector('button[type="submit"]');
  const orgText = submitBtn.textContent;
  submitBtn.textContent = 'Processing...';
  submitBtn.disabled = true;

  try {
    // 1. Register vehicle
    const vRes = await fetch(`${API_BASE}/vehicles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ownerName, type: vehicleType })
    });
    const vehicle = await vRes.json();
    
    // 2. Create Parking Entry
    await fetch(`${API_BASE}/park/entry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicleId: vehicle.id, slotId })
    });
    
    // Reset form and refresh UI
    entryForm.reset();
    await init();
    
  } catch (error) {
    console.error('Error during entry:', error);
    alert('Failed to register parking entry.');
  } finally {
    submitBtn.textContent = orgText;
    submitBtn.disabled = false;
  }
});

// Handle Vehicle Exit
window.exitVehicle = async function(recordId, slotId) {
  if (!confirm('Are you sure you want to end this parking session?')) return;
  
  try {
    const res = await fetch(`${API_BASE}/park/exit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recordId, slotId })
    });
    
    if(!res.ok) throw new Error('Failed to process exit');
    
    const data = await res.json();
    
    alert(`Vehicle exited successfully!\n\nTotal Parking Charge: ₹${data.charge}`);
    await init();
    
  } catch (error) {
    console.error('Error during exit:', error);
    alert('Failed to process vehicle exit.');
  }
}

// Start app
init();
