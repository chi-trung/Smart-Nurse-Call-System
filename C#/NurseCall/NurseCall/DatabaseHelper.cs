using System;
using System.Collections.Generic;
using System.Data.SQLite;
using System.IO;
using System.Security.Cryptography;
using System.Text;

public class DatabaseHelper
{
    // Đường dẫn file database nằm ngay trong thư mục chạy của C#
    private static string dbPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "nurse_call.db");
    private static string connectionString = $"Data Source={dbPath};Version=3;";

    public static void InitializeDatabase()
    {
        using (var conn = new SQLiteConnection(connectionString))
        {
            conn.Open();
             
            // Tạo table Logs (đã có, thêm cột NurseName)
            string logsSql = @"CREATE TABLE IF NOT EXISTS Logs (
                        Id INTEGER PRIMARY KEY AUTOINCREMENT,
                        RoomId INTEGER,
                        CallType TEXT,
                        RequestTime DATETIME,
                        ResponseTime DATETIME,
                        Status TEXT DEFAULT 'Pending',
                        NurseName TEXT DEFAULT 'Unknown',
                        CompletedBy TEXT DEFAULT NULL,
                        AcceptedTime DATETIME,
                        StartProcessTime DATETIME,
                        CancelReason TEXT,
                        CancelledTime DATETIME
                      )";
            using (SQLiteCommand cmd = new SQLiteCommand(logsSql, conn))
            {
                cmd.ExecuteNonQuery();
            }

            // Migration for old databases: add missing columns without dropping existing data.
            EnsureLogsColumn(conn, "NurseName", "TEXT DEFAULT 'Unknown'");
            EnsureLogsColumn(conn, "CompletedBy", "TEXT DEFAULT NULL");
            EnsureLogsColumn(conn, "AcceptedTime", "DATETIME");
            EnsureLogsColumn(conn, "StartProcessTime", "DATETIME");
            EnsureLogsColumn(conn, "CancelReason", "TEXT");
            EnsureLogsColumn(conn, "CancelledTime", "DATETIME");

            // Tạo table Users (NEW)
            string usersSql = @"CREATE TABLE IF NOT EXISTS Users (
                        Id INTEGER PRIMARY KEY AUTOINCREMENT,
                        Username TEXT UNIQUE NOT NULL,
                        Password TEXT NOT NULL,
                        FullName TEXT,
                        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                        IsActive INTEGER DEFAULT 1
                      )";
            using (SQLiteCommand cmd = new SQLiteCommand(usersSql, conn))
            {
                cmd.ExecuteNonQuery();
            }

            // Tạo table NurseStats (thống kê theo y tá)
            string statsSql = @"CREATE TABLE IF NOT EXISTS NurseStats (
                        Id INTEGER PRIMARY KEY AUTOINCREMENT,
                        UserId INTEGER,
                        TotalCalls INTEGER DEFAULT 0,
                        CompletedCalls INTEGER DEFAULT 0,
                        AverageResponseTime REAL DEFAULT 0,
                        LastUpdate DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY(UserId) REFERENCES Users(Id)
                      )";
            using (SQLiteCommand cmd = new SQLiteCommand(statsSql, conn))
            {
                cmd.ExecuteNonQuery();
            }

            conn.Close();
        }
    }

    // ============= USER MANAGEMENT =============

    private static void EnsureLogsColumn(SQLiteConnection conn, string columnName, string columnType)
    {
        using (SQLiteCommand cmd = new SQLiteCommand("PRAGMA table_info(Logs)", conn))
        using (SQLiteDataReader reader = cmd.ExecuteReader())
        {
            HashSet<string> columns = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            while (reader.Read())
            {
                if (!reader.IsDBNull(1))
                {
                    columns.Add(reader.GetString(1));
                }
            }

            if (columns.Contains(columnName))
            {
                return;
            }
        }

        string alterSql = $"ALTER TABLE Logs ADD COLUMN {columnName} {columnType}";
        using (SQLiteCommand alterCmd = new SQLiteCommand(alterSql, conn))
        {
            alterCmd.ExecuteNonQuery();
        }
    }

    // Hàm mã hóa password (simple hash)
    private static string HashPassword(string password)
    {
        using (SHA256 sha256 = SHA256.Create())
        {
            byte[] hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToBase64String(hashedBytes);
        }
    }

    // Hàm tạo user mới (cho Admin Web)
    public static bool CreateUser(string username, string password, string fullName = "")
    {
        try
        {
            using (var conn = new SQLiteConnection(connectionString))
            {
                conn.Open();
                string sql = @"INSERT INTO Users (Username, Password, FullName) 
                            VALUES (@username, @password, @fullname)";
                using (SQLiteCommand cmd = new SQLiteCommand(sql, conn))
                {
                    cmd.Parameters.AddWithValue("@username", username);
                    cmd.Parameters.AddWithValue("@password", HashPassword(password));
                    cmd.Parameters.AddWithValue("@fullname", fullName ?? "");
                    cmd.ExecuteNonQuery();
                }

                // Tạo record thống kê cho user mới
                long userId = GetLastInsertedId(conn);
                string statsSQL = "INSERT INTO NurseStats (UserId) VALUES (@userId)";
                using (SQLiteCommand cmd = new SQLiteCommand(statsSQL, conn))
                {
                    cmd.Parameters.AddWithValue("@userId", userId);
                    cmd.ExecuteNonQuery();
                }

                conn.Close();
                return true;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Lỗi tạo user: {ex.Message}");
            return false;
        }
    }

    // Hàm đăng nhập (cho C# WinForms)
    public static (bool success, int userId, string fullName) LoginUser(string username, string password)
    {
        try
        {
            using (var conn = new SQLiteConnection(connectionString))
            {
                conn.Open();
                string sql = @"SELECT Id, FullName, Password, IsActive FROM Users WHERE Username = @username";
                using (SQLiteCommand cmd = new SQLiteCommand(sql, conn))
                {
                    cmd.Parameters.AddWithValue("@username", username);
                    using (SQLiteDataReader reader = cmd.ExecuteReader())
                    {
                        if (reader.Read())
                        {
                            int isActive = reader.GetInt32(3);
                            if (isActive == 0)
                            {
                                return (false, -1, "");
                            }

                            string storedHash = reader.GetString(2);
                            string inputHash = HashPassword(password);
                            
                            if (storedHash == inputHash)
                            {
                                int userId = reader.GetInt32(0);
                                string fullName = reader.IsDBNull(1) ? username : reader.GetString(1);
                                return (true, userId, fullName);
                            }
                        }
                    }
                }
                conn.Close();
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Lỗi đăng nhập: {ex.Message}");
        }

        return (false, -1, "");
    }

    // Tạo tài khoản mặc định nếu hệ thống chưa có user nào
    public static void EnsureDefaultNurseUser()
    {
        using (var conn = new SQLiteConnection(connectionString))
        {
            conn.Open();
            string countSql = "SELECT COUNT(1) FROM Users";
            using (SQLiteCommand cmd = new SQLiteCommand(countSql, conn))
            {
                long userCount = (long)cmd.ExecuteScalar();
                if (userCount == 0)
                {
                    // Gọi CreateUser để đồng bộ với logic hash + NurseStats.
                    CreateUser("nurse1", "123456", "Nurse Default");
                }
            }
            conn.Close();
        }
    }

    // Hàm lấy ID user từ username
    public static int GetUserId(string username)
    {
        using (var conn = new SQLiteConnection(connectionString))
        {
            conn.Open();
            string sql = "SELECT Id FROM Users WHERE Username = @username";
            using (SQLiteCommand cmd = new SQLiteCommand(sql, conn))
            {
                cmd.Parameters.AddWithValue("@username", username);
                object result = cmd.ExecuteScalar();
                conn.Close();
                return result != null ? Convert.ToInt32(result) : -1;
            }
        }
    }

    // ============= CALL MANAGEMENT =============

    // Hàm thêm mới yêu cầu gọi
    public static long InsertCall(int roomId, string type)
    {
        using (var conn = new SQLiteConnection(connectionString))
        {
            conn.Open();
            string sql = @"INSERT INTO Logs (RoomId, CallType, RequestTime, Status, NurseName) 
                         VALUES (@room, @type, @time, 'Pending', 'Chờ xử lý'); 
                         SELECT last_insert_rowid();";
            SQLiteCommand cmd = new SQLiteCommand(sql, conn);
            cmd.Parameters.AddWithValue("@room", roomId);
            cmd.Parameters.AddWithValue("@type", type);
            cmd.Parameters.AddWithValue("@time", DateTime.Now);
            long lastId = (long)cmd.ExecuteScalar();
            conn.Close();
            return lastId;
        }
    }

    // Hàm cập nhật khi y tá xử lý xong
    public static void CompleteCall(int roomId, string type, string nurseName = "Unknown")
    {
        using (var conn = new SQLiteConnection(connectionString))
        {
            conn.Open();
            string sql = @"UPDATE Logs SET ResponseTime = @resTime, Status = 'Completed', 
                          NurseName = @nurseName, CompletedBy = @nurseName
                          WHERE RoomId = @room AND CallType = @type AND Status = 'Pending'";
            SQLiteCommand cmd = new SQLiteCommand(sql, conn);
            cmd.Parameters.AddWithValue("@resTime", DateTime.Now);
            cmd.Parameters.AddWithValue("@room", roomId);
            cmd.Parameters.AddWithValue("@type", type);
            cmd.Parameters.AddWithValue("@nurseName", nurseName);
            cmd.ExecuteNonQuery();
            conn.Close();
        }
    }

    // Hàm cập nhật khi y tá xử lý xong (với logId)
    public static void CompleteCallById(long logId, string nurseName = "Unknown")
    {
        using (var conn = new SQLiteConnection(connectionString))
        {
            conn.Open();
            string sql = @"UPDATE Logs SET ResponseTime = @resTime, Status = 'Completed', 
                          NurseName = @nurseName, CompletedBy = @nurseName, StartProcessTime = @startTime
                          WHERE Id = @logId";
            SQLiteCommand cmd = new SQLiteCommand(sql, conn);
            cmd.Parameters.AddWithValue("@resTime", DateTime.Now);
            cmd.Parameters.AddWithValue("@startTime", DateTime.Now);
            cmd.Parameters.AddWithValue("@logId", logId);
            cmd.Parameters.AddWithValue("@nurseName", nurseName);
            cmd.ExecuteNonQuery();
            conn.Close();
        }
    }

    // ============= NEW METHODS FOR CALL DETAIL POPUP =============

    // Hàm accept call (khi nurse nhấn accept trong popup)
    public static void AcceptCall(long logId)
    {
        using (var conn = new SQLiteConnection(connectionString))
        {
            conn.Open();
            string sql = @"UPDATE Logs SET AcceptedTime = @acceptTime, Status = 'Accepted' 
                          WHERE Id = @logId";
            SQLiteCommand cmd = new SQLiteCommand(sql, conn);
            cmd.Parameters.AddWithValue("@acceptTime", DateTime.Now);
            cmd.Parameters.AddWithValue("@logId", logId);
            cmd.ExecuteNonQuery();
            conn.Close();
        }
    }

    // Hàm hủy call (khi nurse nhấn cancel trong popup)
    public static void CancelCall(long logId, string cancelReason)
    {
        using (var conn = new SQLiteConnection(connectionString))
        {
            conn.Open();
            string sql = @"UPDATE Logs SET Status = 'Cancelled', ResponseTime = @cancelTime, CancelledTime = @cancelTime, 
                          CancelReason = @reason
                          WHERE Id = @logId";
            SQLiteCommand cmd = new SQLiteCommand(sql, conn);
            cmd.Parameters.AddWithValue("@cancelTime", DateTime.Now);
            cmd.Parameters.AddWithValue("@reason", cancelReason ?? "");
            cmd.Parameters.AddWithValue("@logId", logId);
            cmd.ExecuteNonQuery();
            conn.Close();
        }
    }

    // Hàm lấy chi tiết call từ ID
    public static (long id, int roomId, string callType, DateTime requestTime, string status, 
                   string nurseName, DateTime? acceptedTime) GetCallDetails(long logId)
    {
        using (var conn = new SQLiteConnection(connectionString))
        {
            conn.Open();
            string sql = @"SELECT Id, RoomId, CallType, RequestTime, Status, NurseName, AcceptedTime 
                          FROM Logs WHERE Id = @logId";
            using (SQLiteCommand cmd = new SQLiteCommand(sql, conn))
            {
                cmd.Parameters.AddWithValue("@logId", logId);
                using (SQLiteDataReader reader = cmd.ExecuteReader())
                {
                    if (reader.Read())
                    {
                        long id = reader.GetInt64(0);
                        int roomId = reader.GetInt32(1);
                        string callType = reader.GetString(2);
                        DateTime requestTime = reader.GetDateTime(3);
                        string status = reader.GetString(4);
                        string nurseName = reader.IsDBNull(5) ? "Unknown" : reader.GetString(5);
                        DateTime? acceptedTime = reader.IsDBNull(6) ? (DateTime?)null : reader.GetDateTime(6);
                        
                        return (id, roomId, callType, requestTime, status, nurseName, acceptedTime);
                    }
                }
            }
        }
        return (0, 0, "", DateTime.Now, "", "", null);
    }

    // Hàm helper
    private static long GetLastInsertedId(SQLiteConnection conn)
    {
        string sql = "SELECT last_insert_rowid();";
        using (SQLiteCommand cmd = new SQLiteCommand(sql, conn))
        {
            return (long)cmd.ExecuteScalar();
        }
    }
}