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

        private Label lblCallId;
        private Label lblRoom;
        private Label lblType;
        private Label lblRequestTime;
        private Label lblWaiting;
        private Label lblCancelReason;
        private TextBox txtCancelReason;
        private Button btnConfirm;
        private Button btnCancel;
        private Button btnCancelConfirm;
        private Button btnCancelBack;

        public bool IsConfirmed { get; private set; }
        public bool IsCancelled { get; private set; }
        public string CancelReason { get; private set; } = string.Empty;

        public CallDetailForm(long callId, int roomId, string typeCode, DateTime requestTime)
        {
            this.callId = callId;
            this.roomId = roomId;
            this.typeCode = typeCode;
            this.requestTime = requestTime;

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
            ClientSize = new Size(460, 320);
            Font = new Font("Segoe UI", 10F, FontStyle.Regular, GraphicsUnit.Point);

            lblCallId = new Label { Left = 20, Top = 20, Width = 420 };
            lblRoom = new Label { Left = 20, Top = 50, Width = 420 };
            lblType = new Label { Left = 20, Top = 80, Width = 420 };
            lblRequestTime = new Label { Left = 20, Top = 110, Width = 420 };
            lblWaiting = new Label { Left = 20, Top = 140, Width = 420, ForeColor = Color.DarkRed, Font = new Font("Segoe UI", 10F, FontStyle.Bold) };

            btnConfirm = new Button
            {
                Left = 20,
                Top = 180,
                Width = 130,
                Height = 36,
                Text = "Xac nhan xu ly",
                BackColor = Color.FromArgb(46, 204, 113),
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat
            };
            btnConfirm.FlatAppearance.BorderSize = 0;
            btnConfirm.Click += btnConfirm_Click;

            btnCancel = new Button
            {
                Left = 165,
                Top = 180,
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
                Top = 230,
                Width = 420,
                Text = "Ly do huy:",
                Visible = false
            };

            txtCancelReason = new TextBox
            {
                Left = 20,
                Top = 252,
                Width = 420,
                Height = 24,
                Visible = false
            };

            btnCancelConfirm = new Button
            {
                Left = 300,
                Top = 180,
                Width = 65,
                Height = 36,
                Text = "OK",
                Visible = false
            };
            btnCancelConfirm.Click += btnCancelConfirm_Click;

            btnCancelBack = new Button
            {
                Left = 375,
                Top = 180,
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
        }

        private void btnConfirm_Click(object sender, EventArgs e)
        {
            IsConfirmed = true;
            IsCancelled = false;
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
            DialogResult = DialogResult.Cancel;
            Close();
        }

        private void btnCancelBack_Click(object sender, EventArgs e)
        {
            lblCancelReason.Visible = false;
            txtCancelReason.Visible = false;
            txtCancelReason.Text = string.Empty;
            btnCancelConfirm.Visible = false;
            btnCancelBack.Visible = false;

            btnConfirm.Enabled = true;
            btnCancel.Enabled = true;
        }
    }
}
