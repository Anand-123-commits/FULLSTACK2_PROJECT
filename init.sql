DROP DATABASE IF EXISTS SmartParking1;
CREATE DATABASE IF NOT EXISTS SmartParking1;
USE SmartParking1;

CREATE TABLE IF NOT EXISTS Vehicle (
    VehicleID INT AUTO_INCREMENT PRIMARY KEY,
    OwnerName VARCHAR(255),
    Type VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS ParkingSlot (
    SlotID INT PRIMARY KEY,
    SlotType VARCHAR(50),
    Status VARCHAR(50) DEFAULT 'Available'
);

CREATE TABLE IF NOT EXISTS ParkingRecord (
    RecordID INT AUTO_INCREMENT PRIMARY KEY,
    VehicleID INT,
    SlotID INT,
    EntryTime DATETIME,
    ExitTime DATETIME,
    FOREIGN KEY (VehicleID) REFERENCES Vehicle(VehicleID),
    FOREIGN KEY (SlotID) REFERENCES ParkingSlot(SlotID)
);

CREATE TABLE IF NOT EXISTS Payments (
    PaymentID INT AUTO_INCREMENT PRIMARY KEY,
    RecordID INT,
    Amount DECIMAL(10, 2),
    FOREIGN KEY (RecordID) REFERENCES ParkingRecord(RecordID)
);

-- Generate slots 1 to 10
INSERT IGNORE INTO ParkingSlot (SlotID, SlotType, Status) VALUES 
(1, 'Car', 'Available'), (2, 'Car', 'Available'),
(3, 'Car', 'Available'), (4, 'Car', 'Available'),
(5, 'Car', 'Available'), (6, 'Car', 'Available'),
(7, 'Car', 'Available'), (8, 'Car', 'Available'),
(9, 'Car', 'Available'), (10, 'Car', 'Available');

-- Add 2 parked cars
INSERT INTO Vehicle (OwnerName, Type) VALUES ('JK02CR6062', 'Car'), ('PB03W0090', 'Car');
SET @vart1 = LAST_INSERT_ID();
SET @v2 = LAST_INSERT_ID() + 1;

INSERT INTO ParkingRecord (VehicleID, SlotID, EntryTime) VALUES (@v1, 2, NOW()), (@v2, 7, NOW());

UPDATE ParkingSlot SET Status = 'Occupied' WHERE SlotID IN (2, 7);
