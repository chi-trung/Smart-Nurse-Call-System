-- SQL Script: Khởi tạo Database cho Smart Nurse Call System

-- Table: Users (Quản lý tài khoản y tá)
CREATE TABLE IF NOT EXISTS Users (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Username TEXT UNIQUE NOT NULL,
    Password TEXT NOT NULL,
    FullName TEXT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    IsActive INTEGER DEFAULT 1
);

-- Table: Logs (Lịch sử gọi)
CREATE TABLE IF NOT EXISTS Logs (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    RoomId INTEGER NOT NULL,
    CallType TEXT NOT NULL,
    RequestTime DATETIME NOT NULL,
    ResponseTime DATETIME,
    Status TEXT DEFAULT 'Pending',
    NurseName TEXT DEFAULT 'Unknown',
    CompletedBy TEXT,
    AcceptedTime DATETIME,
    StartProcessTime DATETIME,
    CancelReason TEXT,
    CancelledTime DATETIME,
    ResponseDurationSeconds INTEGER  -- Tính toán tự động
);

-- Table: NurseStats (Thống kê theo y tá)
CREATE TABLE IF NOT EXISTS NurseStats (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    UserId INTEGER UNIQUE,
    TotalCalls INTEGER DEFAULT 0,
    CompletedCalls INTEGER DEFAULT 0,
    AverageResponseTime REAL DEFAULT 0,
    LastUpdate DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(UserId) REFERENCES Users(Id)
);

-- Thêm trigger để tự động update NurseStats khi tạo log
CREATE TRIGGER IF NOT EXISTS update_nurse_stats_on_complete
AFTER UPDATE OF Status ON Logs
WHEN NEW.Status = 'Completed' AND OLD.Status != 'Completed'
BEGIN
    UPDATE NurseStats
    SET 
        CompletedCalls = CompletedCalls + 1,
        LastUpdate = CURRENT_TIMESTAMP
    WHERE Id = (
        SELECT NurseStats.Id FROM NurseStats
        JOIN Users ON NurseStats.UserId = Users.Id
        WHERE Users.FullName = NEW.NurseName
    );
END;

-- Tạo user mặc định (demo)
INSERT OR IGNORE INTO Users (Username, Password, FullName)
VALUES 
    ('nurse1', 'hashed_password_here', 'Nguyễn Thị Y Tá 1'),
    ('nurse2', 'hashed_password_here', 'Trần Văn Y Tá 2');

-- Tạo NurseStats cho các user
INSERT OR IGNORE INTO NurseStats (UserId)
SELECT Id FROM Users WHERE Id NOT IN (SELECT UserId FROM NurseStats WHERE UserId IS NOT NULL);
