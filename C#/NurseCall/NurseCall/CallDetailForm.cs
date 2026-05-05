using System;
using System.Drawing;
using System.Windows.Forms;

namespace NurseCall
{
    public class CallDetailForm : Form
    {
        private readonly long callId;
        private readonly int roomId;
        private readonly string typeCode;
        private readonly DateTime requestTime;
        private readonly string currentStatus;

        private Label lblCallId;
        private Label lblRoom;
        private Label lblType;
        private Label lblRequestTime;
        private Label lblWaiting;
        private Label lblCancelReason;
        private TextBox txtCancelReason;
        private Button btnConfirm;
        private Button btnCancel;
            private Button btnAccept;
            private Button btnStart;
        private Button btnCancelConfirm;
        private Button btnCancelBack;

        public bool IsConfirmed { get; private set; }
        public bool IsCancelled { get; private set; }
        public string CancelReason { get; private set; } = string.Empty;
        public string ActionRequested { get; private set; } = string.Empty;

        public CallDetailForm(long callId, int roomId, string typeCode, DateTime requestTime, string currentStatus = "Pending")
        {
            this.callId = callId;
            this.roomId = roomId;
            this.typeCode = typeCode;
            this.requestTime = requestTime;
            this.currentStatus = currentStatus ?? "Pending";

            InitializeLayout();
            Load += CallDetailForm_Load;
        }

        private void InitializeLayout()
        {
            Text = "Chi tiet cuoc goi";
            StartPosition = FormStartPosition.CenterParent;
            FormBorderStyle = FormBorderStyle.FixedDialog;
            MaximizeBox = false;
            MinimizeBox = false;
            ClientSize = new Size(460, 380);
            Font = new Font("Segoe UI", 10F, FontStyle.Regular, GraphicsUnit.Point);

            lblCallId = new Label { Left = 20, Top = 20, Width = 420 };
            lblRoom = new Label { Left = 20, Top = 50, Width = 420 };
            lblType = new Label { Left = 20, Top = 80, Width = 420 };
            lblRequestTime = new Label { Left = 20, Top = 110, Width = 420 };
            lblWaiting = new Label { Left = 20, Top = 140, Width = 420, ForeColor = Color.DarkRed, Font = new Font("Segoe UI", 10F, FontStyle.Bold) };

            btnConfirm = new Button
            {
                Left = 20,
                Top = 222,
                Width = 130,
                Height = 36,
                Text = "Xac nhan xu ly",
                BackColor = Color.FromArgb(46, 204, 113),
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat
            };
            btnConfirm.FlatAppearance.BorderSize = 0;
            btnConfirm.Click += btnConfirm_Click;

            btnAccept = new Button
            {
                Left = 20,
                Top = 180,
                Width = 130,
                Height = 36,
                Text = "Nhận ca",
                BackColor = Color.FromArgb(255, 193, 7),
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat,
                Visible = true
            };
            btnAccept.FlatAppearance.BorderSize = 0;
            btnAccept.Click += btnAccept_Click;

            btnStart = new Button
            {
                Left = 165,
                Top = 180,
                Width = 130,
                Height = 36,
                Text = "Bắt đầu xử lý",
                BackColor = Color.FromArgb(52, 152, 219),
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat,
                Visible = true
            };
            btnStart.FlatAppearance.BorderSize = 0;
            btnStart.Click += btnStart_Click;

            btnCancel = new Button
            {
                Left = 165,
                Top = 222,
                Width = 130,
                Height = 36,
                Text = "Huy cuoc goi",
                BackColor = Color.FromArgb(231, 76, 60),
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat
            };
            btnCancel.FlatAppearance.BorderSize = 0;
            btnCancel.Click += btnCancel_Click;

            lblCancelReason = new Label
            {
                Left = 20,
                Top = 270,
                Width = 420,
                Text = "Ly do huy:",
                Visible = false
            };

            txtCancelReason = new TextBox
            {
                Left = 20,
                Top = 292,
                Width = 420,
                Height = 24,
                Visible = false
            };

            btnCancelConfirm = new Button
            {
                Left = 300,
                Top = 332,
                Width = 65,
                Height = 36,
                Text = "OK",
                Visible = false
            };
            btnCancelConfirm.Click += btnCancelConfirm_Click;

            btnCancelBack = new Button
            {
                Left = 375,
                Top = 332,
                Width = 65,
                Height = 36,
                Text = "Back",
                Visible = false
            };
            btnCancelBack.Click += btnCancelBack_Click;

            Controls.Add(lblCallId);
            Controls.Add(lblRoom);
            Controls.Add(lblType);
            Controls.Add(lblRequestTime);
            Controls.Add(lblWaiting);
            Controls.Add(btnConfirm);
            Controls.Add(btnAccept);
            Controls.Add(btnStart);
            Controls.Add(btnCancel);
            Controls.Add(lblCancelReason);
            Controls.Add(txtCancelReason);
            Controls.Add(btnCancelConfirm);
            Controls.Add(btnCancelBack);
        }

        private void CallDetailForm_Load(object sender, EventArgs e)
        {
            string typeText = typeCode == "E" ? "KHAN CAP" : "THONG THUONG";
            TimeSpan waiting = DateTime.Now - requestTime;

            lblCallId.Text = $"Call ID: {callId}";
            lblRoom.Text = $"Phong: {roomId}";
            lblType.Text = $"Loai: {typeText}";
            lblRequestTime.Text = $"Thoi gian goi: {requestTime:HH:mm:ss}";
            lblWaiting.Text = $"Da cho: {waiting.Minutes:D2}m {waiting.Seconds:D2}s";

            ApplyWorkflowButtons();
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

        private void ApplyWorkflowButtons()
        {
            string statusKey = NormalizeStatus(currentStatus);

            btnAccept.Visible = false;
            btnStart.Visible = false;
            btnConfirm.Visible = false;
            btnCancel.Visible = false;

            if (statusKey == "pending")
            {
                // Allow quick completion for simple calls.
                btnAccept.Visible = true;
                btnConfirm.Visible = true;
                btnConfirm.Text = "Xac nhan xu ly";
                btnCancel.Visible = true;
                return;
            }

            if (statusKey == "accepted")
            {
                btnStart.Visible = true;
                btnCancel.Visible = true;
                return;
            }

            if (statusKey == "in-progress")
            {
                btnConfirm.Visible = true;
                btnConfirm.Text = "Xac nhan xu ly";
                btnCancel.Visible = true;
            }
        }

        private void btnConfirm_Click(object sender, EventArgs e)
        {
            IsConfirmed = true;
            IsCancelled = false;
            ActionRequested = "Complete";
            DialogResult = DialogResult.OK;
            Close();
        }

        private void btnAccept_Click(object sender, EventArgs e)
        {
            ActionRequested = "Accept";
            DialogResult = DialogResult.OK;
            Close();
        }

        private void btnStart_Click(object sender, EventArgs e)
        {
            ActionRequested = "Start";
            DialogResult = DialogResult.OK;
            Close();
        }

        private void btnCancel_Click(object sender, EventArgs e)
        {
            lblCancelReason.Visible = true;
            txtCancelReason.Visible = true;
            txtCancelReason.Focus();
            btnCancelConfirm.Visible = true;
            btnCancelBack.Visible = true;

            btnConfirm.Enabled = false;
            btnAccept.Enabled = false;
            btnStart.Enabled = false;
            btnCancel.Enabled = false;
        }

        private void btnCancelConfirm_Click(object sender, EventArgs e)
        {
            string reason = txtCancelReason.Text.Trim();
            if (string.IsNullOrWhiteSpace(reason))
            {
                MessageBox.Show("Vui long nhap ly do huy.", "Can ly do", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            IsConfirmed = false;
            IsCancelled = true;
            CancelReason = reason;
            ActionRequested = "Cancel";
            DialogResult = DialogResult.OK;
            Close();
        }

        private void btnCancelBack_Click(object sender, EventArgs e)
        {
            lblCancelReason.Visible = false;
            txtCancelReason.Visible = false;
            txtCancelReason.Text = string.Empty;
            btnCancelConfirm.Visible = false;
            btnCancelBack.Visible = false;

            ApplyWorkflowButtons();

            btnConfirm.Enabled = btnConfirm.Visible;
            btnAccept.Enabled = btnAccept.Visible;
            btnStart.Enabled = btnStart.Visible;
            btnCancel.Enabled = btnCancel.Visible;
        }
    }
}
