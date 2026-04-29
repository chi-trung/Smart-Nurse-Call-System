using System;
using System.Collections.Generic;
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
        private readonly Dictionary<long, (DateTime requestTime, string callType)> callTimesById = new Dictionary<long, (DateTime, string)>();
        private readonly string loggedInNurseName;

        public Form1()
        {
            InitializeComponent();
            loggedInNurseName = "Y ta";
        }

        public Form1(string nurseName)
        {
            InitializeComponent();
            loggedInNurseName = string.IsNullOrWhiteSpace(nurseName) ? "Y ta" : nurseName;
        }

        private void Form1_Load(object sender, EventArgs e)
        {
            try
            {
                DatabaseHelper.InitializeDatabase();
            }
            catch (Exception ex)
            {
                MessageBox.Show("Lỗi khởi tạo Database: " + ex.Message);
            }

            SetupDataGridView();
            ApplyModernTheme();

            lblTitle.Text = $"HE THONG GOI Y TA - {loggedInNurseName}";

            cbComPort.Items.AddRange(SerialPort.GetPortNames());
            if (cbComPort.Items.Count > 0)
            {
                cbComPort.SelectedIndex = 0;
            }

            timerWaitingTime.Start();
        }

        private void SetupDataGridView()
        {
            dgvQueue.ColumnCount = 6;
            dgvQueue.Columns[0].Name = "Priority";
            dgvQueue.Columns[0].Visible = false;

            dgvQueue.Columns[1].Name = "CallId";
            dgvQueue.Columns[1].Visible = false;

            dgvQueue.Columns[2].Name = "Time";
            dgvQueue.Columns[2].HeaderText = "Thời gian";
            dgvQueue.Columns[2].Width = 100;

            dgvQueue.Columns[3].Name = "Room";
            dgvQueue.Columns[3].HeaderText = "Phòng";
            dgvQueue.Columns[3].Width = 70;

            dgvQueue.Columns[4].Name = "Type";
            dgvQueue.Columns[4].HeaderText = "Mức độ gọi";
            dgvQueue.Columns[4].Width = 120;

            dgvQueue.Columns[5].Name = "WaitingTime";
            dgvQueue.Columns[5].HeaderText = "Đã chờ";
            dgvQueue.Columns[5].Width = 90;

            DataGridViewButtonColumn btnColumn = new DataGridViewButtonColumn
            {
                HeaderText = "Hành động",
                Name = "Action",
                Text = "CHI TIẾT",
                UseColumnTextForButtonValue = true,
                FlatStyle = FlatStyle.Flat,
                AutoSizeMode = DataGridViewAutoSizeColumnMode.None,
                Width = 110
            };
            dgvQueue.Columns.Add(btnColumn);

            dgvQueue.AllowUserToAddRows = false;
            dgvQueue.ReadOnly = true;
            dgvQueue.RowTemplate.Height = 40;
            dgvQueue.SelectionMode = DataGridViewSelectionMode.FullRowSelect;

            dgvQueue.CellContentClick -= DgvQueue_CellContentClick;
            dgvQueue.CellContentClick += DgvQueue_CellContentClick;
        }

        private void ApplyModernTheme()
        {
            dgvQueue.EnableHeadersVisualStyles = false;
            dgvQueue.ColumnHeadersDefaultCellStyle.BackColor = Color.FromArgb(32, 73, 125);
            dgvQueue.ColumnHeadersDefaultCellStyle.ForeColor = Color.White;
            dgvQueue.ColumnHeadersDefaultCellStyle.Font = new Font("Segoe UI Semibold", 11F, FontStyle.Bold);
            dgvQueue.RowHeadersVisible = false;
            dgvQueue.AlternatingRowsDefaultCellStyle.BackColor = Color.FromArgb(247, 250, 255);
            dgvQueue.GridColor = Color.FromArgb(220, 228, 238);
            dgvQueue.CellBorderStyle = DataGridViewCellBorderStyle.SingleHorizontal;
            dgvQueue.DefaultCellStyle.SelectionBackColor = Color.FromArgb(225, 237, 252);
            dgvQueue.DefaultCellStyle.SelectionForeColor = Color.FromArgb(20, 34, 60);

            lsbLog.BackColor = Color.FromArgb(248, 251, 255);
            lsbLog.ForeColor = Color.FromArgb(44, 62, 80);
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
                Invoke(new MethodInvoker(delegate
                {
                    ProcessData(data.Trim());
                }));
            }
            catch
            {
            }
        }

        private void ProcessData(string data)
        {
            string[] parts = data.Split(':');
            if (parts.Length != 3 || parts[0] != "REQ")
            {
                return;
            }

            string roomIdText = parts[1];
            string typeCode = parts[2];
            string timeNow = DateTime.Now.ToString("HH:mm:ss");

            foreach (DataGridViewRow existing in dgvQueue.Rows)
            {
                if (existing.Cells["Room"].Value.ToString() == roomIdText && existing.Tag?.ToString() == typeCode)
                {
                    return;
                }
            }

            int roomId = int.Parse(roomIdText);
            string fullType = typeCode == "E" ? "Emergency" : "Normal";
            long callId = DatabaseHelper.InsertCall(roomId, fullType);

            int priority = typeCode == "E" ? 0 : 1;
            string typeText = typeCode == "E" ? "KHẨN CẤP" : "THÔNG THƯỜNG";

            int rowIndex = dgvQueue.Rows.Add(priority, callId, timeNow, roomIdText, typeText, "00m 00s");
            DataGridViewRow row = dgvQueue.Rows[rowIndex];
            row.Tag = typeCode;

            callTimesById[callId] = (DateTime.Now, typeCode);

            if (typeCode == "E")
            {
                row.DefaultCellStyle.BackColor = Color.FromArgb(255, 205, 210);
                row.DefaultCellStyle.ForeColor = Color.DarkRed;
                row.DefaultCellStyle.Font = new Font(dgvQueue.Font, FontStyle.Bold);
                LogMessage("BÁO ĐỘNG", $"Phòng {roomIdText} yêu cầu KHẨN CẤP!");
            }
            else
            {
                row.DefaultCellStyle.BackColor = Color.FromArgb(200, 230, 201);
                row.DefaultCellStyle.ForeColor = Color.DarkGreen;
                LogMessage("Thông báo", $"Phòng {roomIdText} gọi Y tá.");
            }

            dgvQueue.Sort(dgvQueue.Columns["Priority"], ListSortDirection.Ascending);
        }

        private void DgvQueue_CellContentClick(object sender, DataGridViewCellEventArgs e)
        {
            if (e.RowIndex < 0 || e.ColumnIndex != dgvQueue.Columns["Action"].Index)
            {
                return;
            }

            DataGridViewRow row = dgvQueue.Rows[e.RowIndex];
            long callId = Convert.ToInt64(row.Cells["CallId"].Value);
            int roomId = int.Parse(row.Cells["Room"].Value.ToString());
            string typeCode = row.Tag?.ToString() ?? "N";

            DateTime requestTime = DateTime.Now;
            if (callTimesById.TryGetValue(callId, out var callInfo))
            {
                requestTime = callInfo.requestTime;
            }

            ShowCallDetailPopup(callId, roomId, typeCode, requestTime, row);
        }

        private void ShowCallDetailPopup(long callId, int roomId, string typeCode, DateTime requestTime, DataGridViewRow row)
        {
            using (CallDetailForm popupForm = new CallDetailForm(callId, roomId, typeCode, requestTime))
            {
                DialogResult result = popupForm.ShowDialog(this);

                if (result == DialogResult.OK && popupForm.IsConfirmed)
                {
                    ConfirmCallCompletion(callId, roomId, typeCode, row);
                }
                else if (result == DialogResult.Cancel && popupForm.IsCancelled)
                {
                    CancelCallWithReason(callId, popupForm.CancelReason, row);
                }
            }
        }

        private void ConfirmCallCompletion(long callId, int roomId, string typeCode, DataGridViewRow row)
        {
            if (!serialPort1.IsOpen)
            {
                MessageBox.Show("Vui lòng kết nối hệ thống trước khi thao tác!", "Cảnh báo", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            serialPort1.WriteLine($"DONE:{roomId}:{typeCode}");
            CallBackendCompleteAPI(roomId, typeCode, row.Cells["Type"].Value.ToString(), callId, loggedInNurseName);
            RemoveCallRow(row, callId);
        }

        private void CancelCallWithReason(long callId, string cancelReason, DataGridViewRow row)
        {
            try
            {
                int roomId = int.Parse(row.Cells["Room"].Value.ToString());
                string typeCode = row.Tag?.ToString() ?? "N";

                if (serialPort1.IsOpen)
                {
                    // Huy tren GUI/DB cung can clear den o Proteus.
                    serialPort1.WriteLine($"DONE:{roomId}:{typeCode}");
                }

                DatabaseHelper.CancelCall(callId, cancelReason);
                LogMessage("Hủy cuộc gọi", $"Da huy phong {row.Cells["Room"].Value} - Ly do: {cancelReason}");
                RemoveCallRow(row, callId);
            }
            catch (Exception ex)
            {
                LogMessage("Lỗi", $"Loi huy cuoc goi: {ex.Message}");
            }
        }

        private void RemoveCallRow(DataGridViewRow row, long callId)
        {
            callTimesById.Remove(callId);
            if (!row.IsNewRow)
            {
                dgvQueue.Rows.Remove(row);
            }
        }

        private async void CallBackendCompleteAPI(int roomId, string typeCode, string typeText, long callId, string nurseName)
        {
            try
            {
                string callType = typeCode == "E" ? "Emergency" : "Normal";

                var payload = new
                {
                    roomId,
                    callType,
                    nurseName,
                    nurseId = LoginForm.LoggedInUserId
                };

                string json = JsonConvert.SerializeObject(payload);
                var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
                var response = await client.PostAsync($"{BACKEND_URL}/calls/complete-with-nurse", content);

                if (response.IsSuccessStatusCode)
                {
                    DatabaseHelper.CompleteCallById(callId, nurseName);
                    LogMessage("Xử lý", $"Da xu ly xong {typeText} phong {roomId} - {nurseName}");
                }
                else
                {
                    DatabaseHelper.CompleteCallById(callId, nurseName);
                    LogMessage("Lỗi", $"Khong cap nhat duoc Backend (HTTP {response.StatusCode}), da fallback DB local");
                }
            }
            catch (Exception ex)
            {
                try
                {
                    string callType = typeCode == "E" ? "Emergency" : "Normal";
                    DatabaseHelper.CompleteCallById(callId, nurseName);
                }
                catch
                {
                }

                LogMessage("Lỗi", $"Loi goi API: {ex.Message}");
            }
        }

        private void LogMessage(string type, string message)
        {
            string log = $"[{DateTime.Now:HH:mm:ss}] [{type}] {message}";
            lsbLog.Items.Insert(0, log);
        }

        private void TimerWaitingTime_Tick(object sender, EventArgs e)
        {
            try
            {
                foreach (DataGridViewRow row in dgvQueue.Rows)
                {
                    if (row.Cells["CallId"].Value == null)
                    {
                        continue;
                    }

                    long callId = Convert.ToInt64(row.Cells["CallId"].Value);
                    if (!callTimesById.TryGetValue(callId, out var callInfo))
                    {
                        continue;
                    }

                    TimeSpan waitingTime = DateTime.Now - callInfo.requestTime;
                    row.Cells["WaitingTime"].Value = $"{waitingTime.Minutes:D2}m {waitingTime.Seconds:D2}s";

                    if (waitingTime.TotalSeconds > 300)
                    {
                        row.Cells["WaitingTime"].Style.ForeColor = Color.Red;
                        row.Cells["WaitingTime"].Style.Font = new Font(dgvQueue.Font, FontStyle.Bold);
                    }
                    else if (waitingTime.TotalSeconds > 120)
                    {
                        row.Cells["WaitingTime"].Style.ForeColor = Color.Orange;
                        row.Cells["WaitingTime"].Style.Font = new Font(dgvQueue.Font, FontStyle.Regular);
                    }
                    else
                    {
                        row.Cells["WaitingTime"].Style.ForeColor = Color.Green;
                        row.Cells["WaitingTime"].Style.Font = new Font(dgvQueue.Font, FontStyle.Regular);
                    }
                }
            }
            catch
            {
            }
        }
    }
}
