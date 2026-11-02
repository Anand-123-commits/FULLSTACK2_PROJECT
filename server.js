const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Serve the dashboard files alongside the server.
app.use(express.static(__dirname));

const demoState = {
  slots: Array.from({ length: 10 }, (_, index) => ({
    SlotID: index + 1,
    SlotType: 'Car',
    Status: [2, 7].includes(index + 1) ? 'Occupied' : 'Available'
  })),
  vehicles: [
    { VehicleID: 1, OwnerName: 'JK02CR6062', Type: 'Car' },
    { VehicleID: 2, OwnerName: 'PB03W0090', Type: 'Car' }
  ],
  records: [
    { RecordID: 1, VehicleID: 1, SlotID: 2, EntryTime: new Date().toISOString(), ExitTime: null },
    { RecordID: 2, VehicleID: 2, SlotID: 7, EntryTime: new Date().toISOString(), ExitTime: null }
  ],
  nextVehicleId: 3,
  nextRecordId: 3
};
let demoMode = false;

// API: Get all vehicles
app.get('/api/vehicles', async (req, res) => {
  if (demoMode) return res.json(demoState.vehicles);

  try {
    const [rows] = await db.query('SELECT * FROM Vehicle');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Register new vehicle
app.post('/api/vehicles', async (req, res) => {
  const { ownerName, type } = req.body;
  if (demoMode) {
    const vehicle = { VehicleID: demoState.nextVehicleId++, OwnerName: ownerName, Type: type };
    demoState.vehicles.push(vehicle);
    return res.json({ id: vehicle.VehicleID, ownerName, type });
  }

  try {
    const [result] = await db.query('INSERT INTO Vehicle (OwnerName, Type) VALUES (?, ?)', [ownerName, type]);
    res.json({ id: result.insertId, ownerName, type });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Get all slots
app.get('/api/slots', async (req, res) => {
  if (demoMode) return res.json(demoState.slots);

  try {
    const [rows] = await db.query('SELECT * FROM ParkingSlot');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Get active parked vehicles (where ExitTime is NULL)
app.get('/api/park/active', async (req, res) => {
  if (demoMode) {
    const activeVehicles = demoState.records
      .filter(record => !record.ExitTime)
      .map(record => {
        const vehicle = demoState.vehicles.find(item => item.VehicleID === record.VehicleID);
        const slot = demoState.slots.find(item => item.SlotID === record.SlotID);
        return {
          RecordID: record.RecordID,
          EntryTime: record.EntryTime,
          OwnerName: vehicle.OwnerName,
          VehicleType: vehicle.Type,
          SlotID: slot.SlotID,
          SlotType: slot.SlotType
        };
      });
    return res.json(activeVehicles);
  }

  try {
    const query = `
      SELECT pr.RecordID, pr.EntryTime, v.OwnerName, v.Type as VehicleType, ps.SlotID, ps.SlotType
      FROM ParkingRecord pr
      JOIN Vehicle v ON pr.VehicleID = v.VehicleID
      JOIN ParkingSlot ps ON pr.SlotID = ps.SlotID
      WHERE pr.ExitTime IS NULL
    `;
    const [rows] = await db.query(query);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Vehicle Entry
app.post('/api/park/entry', async (req, res) => {
  const { vehicleId, slotId } = req.body;
  if (demoMode) {
    const slot = demoState.slots.find(item => item.SlotID === Number(slotId));
    const vehicle = demoState.vehicles.find(item => item.VehicleID === Number(vehicleId));
    if (!slot || slot.Status !== 'Available' || !vehicle) {
      return res.status(400).json({ error: 'Vehicle or available slot not found' });
    }
    demoState.records.push({
      RecordID: demoState.nextRecordId++,
      VehicleID: vehicle.VehicleID,
      SlotID: slot.SlotID,
      EntryTime: new Date().toISOString(),
      ExitTime: null
    });
    slot.Status = 'Occupied';
    return res.json({ message: 'Vehicle parked successfully' });
  }

  try {
    // Insert into ParkingRecord
    await db.query('INSERT INTO ParkingRecord (VehicleID, SlotID, EntryTime) VALUES (?, ?, NOW())', [vehicleId, slotId]);
    // Mark slot as Occupied
    await db.query("UPDATE ParkingSlot SET Status = 'Occupied' WHERE SlotID = ?", [slotId]);
    res.json({ message: 'Vehicle parked successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Vehicle Exit
app.post('/api/park/exit', async (req, res) => {
  const { recordId, slotId } = req.body;
  if (demoMode) {
    const record = demoState.records.find(item => item.RecordID === Number(recordId) && !item.ExitTime);
    const slot = demoState.slots.find(item => item.SlotID === Number(slotId));
    if (!record || !slot) return res.status(404).json({ error: 'Active parking record not found' });
    record.ExitTime = new Date().toISOString();
    slot.Status = 'Available';
    const elapsedHours = Math.floor((Date.now() - new Date(record.EntryTime).getTime()) / 3600000);
    const charge = Math.max(20, elapsedHours * 20);
    return res.json({ message: 'Vehicle exited successfully', charge });
  }

  try {
    // Mark exit time
    await db.query('UPDATE ParkingRecord SET ExitTime = NOW() WHERE RecordID = ?', [recordId]);
    // Release slot
    await db.query("UPDATE ParkingSlot SET Status = 'Available' WHERE SlotID = ?", [slotId]);
    
    // Calculate charge: (TIMESTAMPDIFF in HOUR * 20). If less than 1 hour, charge minimum of 20
    const [rows] = await db.query(`
      SELECT TIMESTAMPDIFF(HOUR, EntryTime, ExitTime) * 20 AS charge 
      FROM ParkingRecord WHERE RecordID = ?
    `, [recordId]);
    
    let charge = rows[0]?.charge || 0;
    if (charge < 20) charge = 20; // Ensure minimum charge

    // Insert into Payments
    await db.query('INSERT INTO Payments (RecordID, Amount) VALUES (?, ?)', [recordId, charge]);
    
    res.json({ message: 'Vehicle exited successfully', charge });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start the server
const port = process.env.SERVER_PORT || 3000;
async function startServer() {
  try {
    await db.query('SELECT * FROM ParkingSlot LIMIT 0');
  } catch (error) {
    demoMode = true;
    console.warn(`MySQL unavailable; using temporary demo data: ${error.message}`);
  }

  app.listen(port, () => console.log(`Smart Parking Server running on port ${port}`));
}

startServer();
