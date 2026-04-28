using System;
using System.Data.SQLite;
using System.IO;

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
            // Thêm IF NOT EXISTS để an toàn
            string sql = @"CREATE TABLE IF NOT EXISTS Logs (
                        Id INTEGER PRIMARY KEY AUTOINCREMENT,
                        RoomId INTEGER,
                        CallType TEXT,
                        RequestTime DATETIME,
                        ResponseTime DATETIME,
                        Status TEXT
                      )";
            using (SQLiteCommand cmd = new SQLiteCommand(sql, conn))
            {
                cmd.ExecuteNonQuery();
            }
            conn.Close();
        }
    }

    // Hàm thêm mới yêu cầu gọi
    public static long InsertCall(int roomId, string type)
    {
        using (var conn = new SQLiteConnection(connectionString))
        {
            conn.Open();
            string sql = "INSERT INTO Logs (RoomId, CallType, RequestTime, Status) VALUES (@room, @type, @time, 'Pending'); SELECT last_insert_rowid();";
            SQLiteCommand cmd = new SQLiteCommand(sql, conn);
            cmd.Parameters.AddWithValue("@room", roomId);
            cmd.Parameters.AddWithValue("@type", type);
            cmd.Parameters.AddWithValue("@time", DateTime.Now);
            long lastId = (long)cmd.ExecuteScalar();
            conn.Close();
            return lastId; // Trả về ID để lát nữa mình Update
        }
    }

    // Hàm cập nhật khi y tá xử lý xong
    public static void CompleteCall(int roomId, string type)
    {
        using (var conn = new SQLiteConnection(connectionString))
        {
            conn.Open();
            string sql = "UPDATE Logs SET ResponseTime = @resTime, Status = 'Completed' " +
                         "WHERE RoomId = @room AND CallType = @type AND Status = 'Pending'";
            SQLiteCommand cmd = new SQLiteCommand(sql, conn);
            cmd.Parameters.AddWithValue("@resTime", DateTime.Now);
            cmd.Parameters.AddWithValue("@room", roomId);
            cmd.Parameters.AddWithValue("@type", type);
            cmd.ExecuteNonQuery();
            conn.Close();
        }
    }
}