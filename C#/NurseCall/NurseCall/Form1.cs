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

        private async void DgvQueue_CellContentClick(object sender, DataGridViewCellEventArgs e)
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

            await ShowCallDetailPopup(callId, roomId, typeCode, requestTime, row);
        }

        private async System.Threading.Tasks.Task ShowCallDetailPopup(long callId, int roomId, string typeCode, DateTime requestTime, DataGridViewRow row)
        {
            var detail = DatabaseHelper.GetCallDetails(callId);
            string currentStatus = string.IsNullOrWhiteSpace(detail.status) ? "Pending" : detail.status;

            using (CallDetailForm popupForm = new CallDetailForm(callId, roomId, typeCode, requestTime, currentStatus))
            {
                DialogResult result = popupForm.ShowDialog(this);

                if (result == DialogResult.OK)
                {
                    string action = popupForm.ActionRequested;
                    if (action == "Complete")
                    {
                        await ConfirmCallCompletion(callId, roomId, typeCode, row);
                    }
                    else if (action == "Cancel")
                    {
                        await CancelCallWithReason(callId, popupForm.CancelReason, row);
                    }
                    else if (action == "Accept")
                    {
                        await AcceptCall(callId, roomId, typeCode);
                    }
                    else if (action == "Start")
                    {
                        await StartProcessingCall(callId, roomId, typeCode);
                    }
                }
            }
        }

        private string NormalizeStatus(string status)
        {
            string normalized = (status ?? string.Empty).Trim().ToLowerInvariant();
            if (normalized == "accepted") return "accepted";
            if (normalized == "in progress" || normalized == "in_progress" || normalized == "inprogress") return "in-progress";
            if (normalized == "completed") return "completed";
            if (normalized == "cancelled" || normalized == "rejected") return "cancelled";
            return "pending";
        }

        private async System.Threading.Tasks.Task AcceptCall(long callId, int roomId, string typeCode)
        {
            try
            {
                string currentStatus = NormalizeStatus(DatabaseHelper.GetCallDetails(callId).status);
                if (currentStatus != "pending")
                {
                    LogMessage("Nhận ca", $"Call #{callId} không ở trạng thái chờ nhận (hiện tại: {currentStatus})");
                    return;
                }

                DatabaseHelper.AcceptCall(callId);
                LogMessage("Nhận ca", $"Đã nhận ca (Call #{callId})");
                await CallBackendUpdateStatusAPI(callId, "Accepted", roomId, typeCode, null);
            }
            catch (Exception ex)
            {
                LogMessage("Lỗi", $"Lỗi AcceptCall: {ex.Message}");
            }
        }

        private async System.Threading.Tasks.Task StartProcessingCall(long callId, int roomId, string typeCode)
        {
            try
            {
                string currentStatus = NormalizeStatus(DatabaseHelper.GetCallDetails(callId).status);

                if (currentStatus == "pending")
                {
                    DatabaseHelper.AcceptCall(callId);
                    await CallBackendUpdateStatusAPI(callId, "Accepted", roomId, typeCode, null);
                    currentStatus = "accepted";
                }

                if (currentStatus != "accepted")
                {
                    LogMessage("Bắt đầu", $"Call #{callId} chưa thể bắt đầu xử lý (hiện tại: {currentStatus})");
                    return;
                }

                DatabaseHelper.StartProcessing(callId, loggedInNurseName);
                LogMessage("Bắt đầu", $"Bắt đầu xử lý (Call #{callId})");
                await CallBackendUpdateStatusAPI(callId, "In Progress", roomId, typeCode, null);
            }
            catch (Exception ex)
            {
                LogMessage("Lỗi", $"Lỗi StartProcessingCall: {ex.Message}");
            }
        }

        private async System.Threading.Tasks.Task ConfirmCallCompletion(long callId, int roomId, string typeCode, DataGridViewRow row)
        {
            if (!serialPort1.IsOpen)
            {
                MessageBox.Show("Vui lòng kết nối hệ thống trước khi thao tác!", "Cảnh báo", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            try
            {
                string currentStatus = NormalizeStatus(DatabaseHelper.GetCallDetails(callId).status);

                // Quick-complete path: auto transition to keep workflow valid and avoid crashes.
                if (currentStatus == "pending")
                {
                    DatabaseHelper.AcceptCall(callId);
                    await CallBackendUpdateStatusAPI(callId, "Accepted", roomId, typeCode, null);

                    DatabaseHelper.StartProcessing(callId, loggedInNurseName);
                    await CallBackendUpdateStatusAPI(callId, "In Progress", roomId, typeCode, null);
                }
                else if (currentStatus == "accepted")
                {
                    DatabaseHelper.StartProcessing(callId, loggedInNurseName);
                    await CallBackendUpdateStatusAPI(callId, "In Progress", roomId, typeCode, null);
                }
                else if (currentStatus == "completed" || currentStatus == "cancelled")
                {
                    LogMessage("Xử lý", $"Call #{callId} đã kết thúc (trạng thái: {currentStatus})");
                    return;
                }

                serialPort1.WriteLine($"DONE:{roomId}:{typeCode}");
                DatabaseHelper.CompleteCallById(callId, loggedInNurseName);

                bool completedSynced = await CallBackendUpdateStatusAPI(callId, "Completed", roomId, typeCode, null);
                if (!completedSynced)
                {
                    await CallBackendCompleteFallbackAPI(roomId, typeCode, loggedInNurseName);
                }

                LogMessage("Xử lý", $"Đã xử lý xong {row.Cells["Type"].Value} phòng {roomId} - {loggedInNurseName}");
                RemoveCallRow(row, callId);
            }
            catch (Exception ex)
            {
                LogMessage("Lỗi", $"Lỗi khi hoàn tất cuộc gọi: {ex.Message}");
            }
        }

        private async System.Threading.Tasks.Task CancelCallWithReason(long callId, string cancelReason, DataGridViewRow row)
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

                bool cancelledSynced = await CallBackendUpdateStatusAPI(callId, "Cancelled", roomId, typeCode, cancelReason);
                if (!cancelledSynced)
                {
                    await CallBackendCancelFallbackAPI(callId, roomId, typeCode, cancelReason, loggedInNurseName);
                }

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

        private async System.Threading.Tasks.Task<bool> CallBackendUpdateStatusAPI(long callId, string status, int roomId, string typeCode, string cancelReason = null)
        {
            try
            {
                string callType = typeCode == "E" ? "Emergency" : "Normal";
                var payload = new
                {
                    status,
                    nurseName = loggedInNurseName,
                    nurseId = LoginForm.LoggedInUserId,
                    cancelReason = cancelReason,
                    roomId,
                    callType
                };

                string json = JsonConvert.SerializeObject(payload);
                var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
                var request = new HttpRequestMessage(new HttpMethod("PATCH"), $"{BACKEND_URL}/calls/{callId}/status") { Content = content };
                var response = await client.SendAsync(request);
                if (response.IsSuccessStatusCode)
                {
                    LogMessage("Sync", $"Đã đồng bộ trạng thái '{status}' cho Call #{callId} lên backend");
                    return true;
                }
                else
                {
                    if (response.StatusCode == System.Net.HttpStatusCode.Conflict)
                    {
                        // Conflict thường xảy ra khi backend dùng ID khác local hoặc trạng thái đã đổi trước đó.
                        LogMessage("Sync", $"Backend trả về Conflict cho Call #{callId} khi cập nhật '{status}', sẽ thử đồng bộ theo fallback.");
                    }
                    else
                    {
                        LogMessage("Lỗi", $"Không đồng bộ trạng thái lên backend (HTTP {response.StatusCode})");
                    }
                    return false;
                }
            }
            catch (Exception ex)
            {
                LogMessage("Lỗi", $"Lỗi gọi API cập nhật trạng thái: {ex.Message}");
                return false;
            }
        }

        private async System.Threading.Tasks.Task CallBackendCompleteFallbackAPI(int roomId, string typeCode, string nurseName)
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
                    LogMessage("Sync", $"Đã fallback đồng bộ Complete cho phòng {roomId}.");
                }
                else
                {
                    LogMessage("Lỗi", $"Fallback Complete thất bại (HTTP {response.StatusCode}).");
                }
            }
            catch (Exception ex)
            {
                LogMessage("Lỗi", $"Lỗi fallback Complete: {ex.Message}");
            }
        }

        private async System.Threading.Tasks.Task CallBackendCancelFallbackAPI(long callId, int roomId, string typeCode, string cancelReason, string nurseName)
        {
            try
            {
                string callType = typeCode == "E" ? "Emergency" : "Normal";
                var payload = new
                {
                    logId = callId,
                    roomId,
                    callType,
                    cancelReason,
                    nurseName,
                    nurseId = LoginForm.LoggedInUserId
                };

                string json = JsonConvert.SerializeObject(payload);
                var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
                var response = await client.PostAsync($"{BACKEND_URL}/calls/cancel-with-reason", content);

                if (response.IsSuccessStatusCode)
                {
                    LogMessage("Sync", $"Đã fallback đồng bộ Cancel cho phòng {roomId}.");
                }
                else
                {
                    LogMessage("Lỗi", $"Fallback Cancel thất bại (HTTP {response.StatusCode}).");
                }
            }
            catch (Exception ex)
            {
                LogMessage("Lỗi", $"Lỗi fallback Cancel: {ex.Message}");
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
