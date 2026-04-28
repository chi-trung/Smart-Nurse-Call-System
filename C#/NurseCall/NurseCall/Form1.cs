using System;
using System.ComponentModel;
using System.Drawing;
using System.IO.Ports;
using System.Net.Http;
using System.Windows.Forms;
using Newtonsoft.Json;

namespace NurseCall
{
    public partial class Form1 : Form
    {
        private static readonly HttpClient client = new HttpClient();
        private const string BACKEND_URL = "http://localhost:5000/api";

        public Form1()
        {
            InitializeComponent();
        }

        private void Form1_Load(object sender, EventArgs e)
        {
            // 1. Khởi tạo Database (Tạo file .db và bảng nếu chưa có)
            try
            {
                DatabaseHelper.InitializeDatabase();
            }
            catch (Exception ex)
            {
                MessageBox.Show("Lỗi khởi tạo Database: " + ex.Message);
            }

            SetupDataGridView();

            cbComPort.Items.AddRange(SerialPort.GetPortNames());
            if (cbComPort.Items.Count > 0) cbComPort.SelectedIndex = 0;
        }

        private void SetupDataGridView()
        {
            dgvQueue.ColumnCount = 5;
            dgvQueue.Columns[0].Name = "Priority";
            dgvQueue.Columns[0].Visible = false;

            dgvQueue.Columns[1].Name = "Time";
            dgvQueue.Columns[1].HeaderText = "Thời gian";
            dgvQueue.Columns[1].Width = 120;

            dgvQueue.Columns[2].Name = "Room";
            dgvQueue.Columns[2].HeaderText = "Phòng";
            dgvQueue.Columns[2].Width = 120;

            dgvQueue.Columns[3].Name = "Type";
            dgvQueue.Columns[3].HeaderText = "Mức độ gọi";
            dgvQueue.Columns[3].AutoSizeMode = DataGridViewAutoSizeColumnMode.Fill;

            DataGridViewButtonColumn btnColumn = new DataGridViewButtonColumn();
            btnColumn.HeaderText = "Hành động";
            btnColumn.Name = "Action";
            btnColumn.Text = "XÁC NHẬN XỬ LÝ";
            btnColumn.UseColumnTextForButtonValue = true;
            btnColumn.FlatStyle = FlatStyle.Flat;
            btnColumn.AutoSizeMode = DataGridViewAutoSizeColumnMode.None;
            btnColumn.Width = 180;
            dgvQueue.Columns.Add(btnColumn);

            dgvQueue.AllowUserToAddRows = false;
            dgvQueue.ReadOnly = true;
            dgvQueue.RowTemplate.Height = 40;
            dgvQueue.SelectionMode = DataGridViewSelectionMode.FullRowSelect;

            dgvQueue.CellContentClick += DgvQueue_CellContentClick;
        }

        private void btnConnect_Click(object sender, EventArgs e)
        {
            try
            {
                if (!serialPort1.IsOpen)
                {
                    serialPort1.PortName = cbComPort.Text;
                    serialPort1.BaudRate = 9600;
                    serialPort1.Open();
                    btnConnect.Text = "NGẮT KẾT NỐI";
                    btnConnect.BackColor = Color.FromArgb(231, 76, 60);
                    LogMessage("Hệ thống", "Đã kết nối thành công với thiết bị!");
                }
                else
                {
                    serialPort1.Close();
                    btnConnect.Text = "KẾT NỐI";
                    btnConnect.BackColor = Color.FromArgb(46, 204, 113);
                    LogMessage("Hệ thống", "Đã ngắt kết nối.");
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show(ex.Message, "Lỗi kết nối", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void serialPort1_DataReceived(object sender, SerialDataReceivedEventArgs e)
        {
            try
            {
                string data = serialPort1.ReadLine();
                this.Invoke(new MethodInvoker(delegate {
                    ProcessData(data.Trim());
                }));
            }
            catch { }
        }

        private void ProcessData(string data)
        {
            string[] parts = data.Split(':');
            if (parts.Length == 3 && parts[0] == "REQ")
            {
                string roomId = parts[1];
                string typeCode = parts[2];
                string timeNow = DateTime.Now.ToString("HH:mm:ss");

                // Kiểm tra xem yêu cầu này đã có trong hàng đợi hiển thị chưa (tránh trùng lặp)
                foreach (DataGridViewRow r in dgvQueue.Rows)
                {
                    if (r.Cells["Room"].Value.ToString() == roomId && r.Tag.ToString() == typeCode) return;
                }

                // 2. GHI VÀO DATABASE (SQLITE) - Bước quan trọng cho Web
                int rId = int.Parse(roomId);
                string fullType = (typeCode == "E") ? "Emergency" : "Normal";
                DatabaseHelper.InsertCall(rId, fullType);

                // Hiển thị lên GUI
                int priority = (typeCode == "E") ? 0 : 1;
                string typeText = (typeCode == "E") ? "KHẨN CẤP" : "THÔNG THƯỜNG";

                int rowIndex = dgvQueue.Rows.Add(priority, timeNow, roomId, typeText);
                DataGridViewRow row = dgvQueue.Rows[rowIndex];
                row.Tag = typeCode;

                if (typeCode == "E")
                {
                    row.DefaultCellStyle.BackColor = Color.FromArgb(255, 205, 210);
                    row.DefaultCellStyle.ForeColor = Color.DarkRed;
                    row.DefaultCellStyle.Font = new Font(dgvQueue.Font, FontStyle.Bold);
                    LogMessage("BÁO ĐỘNG", $"Phòng {roomId} yêu cầu KHẨN CẤP!");
                }
                else
                {
                    row.DefaultCellStyle.BackColor = Color.FromArgb(200, 230, 201);
                    row.DefaultCellStyle.ForeColor = Color.DarkGreen;
                    LogMessage("Thông báo", $"Phòng {roomId} gọi Y tá.");
                }

                dgvQueue.Sort(dgvQueue.Columns["Priority"], ListSortDirection.Ascending);
            }
        }

        private void DgvQueue_CellContentClick(object sender, DataGridViewCellEventArgs e)
        {
            if (e.ColumnIndex == dgvQueue.Columns["Action"].Index && e.RowIndex >= 0)
            {
                DataGridViewRow row = dgvQueue.Rows[e.RowIndex];
                string roomId = row.Cells["Room"].Value.ToString();
                string typeCode = row.Tag.ToString();
                string typeText = row.Cells["Type"].Value.ToString();

                if (serialPort1.IsOpen)
                {
                    // Gửi lệnh xuống Arduino
                    serialPort1.WriteLine($"DONE:{roomId}:{typeCode}");

                    // Gọi API Backend thay vì update DB trực tiếp
                    CallBackendCompleteAPI(roomId, typeCode, typeText);

                    // Xóa khỏi danh sách chờ trên GUI
                    dgvQueue.Rows.Remove(row);
                }
                else
                {
                    MessageBox.Show("Vui lòng kết nối hệ thống trước khi thao tác!", "Cảnh báo", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                }
            }
        }

        private async void CallBackendCompleteAPI(string roomId, string typeCode, string typeText)
        {
            try
            {
                string callType = (typeCode == "E") ? "Emergency" : "Normal";

                var payload = new
                {
                    roomId = roomId,
                    callType = callType
                };

                string json = JsonConvert.SerializeObject(payload);
                var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

                var response = await client.PostAsync($"{BACKEND_URL}/calls/complete", content);

                if (response.IsSuccessStatusCode)
                {
                    LogMessage("Xử lý", $"✓ Y tá đã xử lý xong {typeText} phòng {roomId}");
                    LogMessage("Xử lý", "✓ Backend đã cập nhật - Web sẽ nhận cảnh báo");
                }
                else
                {
                    LogMessage("Lỗi", $"✗ Không thể cập nhật Backend (HTTP {response.StatusCode})");
                    // Fallback: vẫn update DB trực tiếp
                    int rId = int.Parse(roomId);
                    string fullType = (typeCode == "E") ? "Emergency" : "Normal";
                    DatabaseHelper.CompleteCall(rId, fullType);
                    LogMessage("Xử lý", "✓ DB đã được cập nhật trực tiếp (Fallback mode)");
                }
            }
            catch (Exception ex)
            {
                LogMessage("Lỗi", $"✗ Lỗi gọi API: {ex.Message}");
                // Fallback: vẫn update DB trực tiếp
                try
                {
                    int rId = int.Parse(roomId);
                    string fullType = (typeCode == "E") ? "Emergency" : "Normal";
                    DatabaseHelper.CompleteCall(rId, fullType);
                    LogMessage("Xử lý", "✓ DB đã được cập nhật trực tiếp (Fallback mode)");
                }
                catch { }
            }
        }

        private void LogMessage(string type, string msg)
        {
            string log = $"[{DateTime.Now:HH:mm:ss}] [{type}] {msg}";
            lsbLog.Items.Insert(0, log);
        }
    }
}