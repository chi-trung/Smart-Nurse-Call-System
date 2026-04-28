using System;
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
                        Status TEXT,
                        NurseName TEXT DEFAULT 'Unknown',
                        CompletedBy TEXT DEFAULT NULL
                      )";
            using (SQLiteCommand cmd = new SQLiteCommand(logsSql, conn))
            {
                cmd.ExecuteNonQuery();
            }

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
                          NurseName = @nurseName, CompletedBy = @nurseName
                          WHERE Id = @logId";
            SQLiteCommand cmd = new SQLiteCommand(sql, conn);
            cmd.Parameters.AddWithValue("@resTime", DateTime.Now);
            cmd.Parameters.AddWithValue("@logId", logId);
            cmd.Parameters.AddWithValue("@nurseName", nurseName);
            cmd.ExecuteNonQuery();
            conn.Close();
        }
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