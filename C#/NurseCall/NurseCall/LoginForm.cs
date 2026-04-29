using System;
using System.Drawing;
using System.Windows.Forms;

namespace NurseCall
{
    public class LoginForm : Form
    {
        public static int LoggedInUserId { get; private set; } = -1;
        public static string LoggedInUserName { get; private set; } = string.Empty;
        public static string LoggedInFullName { get; private set; } = string.Empty;

        public bool LoginSuccess { get; private set; }

        private TextBox txtUsername;
        private TextBox txtPassword;
        private Label lblHint;

        public LoginForm()
        {
            BuildUI();
        }

        private void BuildUI()
        {
            Text = "Dang nhap y ta";
            ClientSize = new Size(460, 300);
            StartPosition = FormStartPosition.CenterScreen;
            FormBorderStyle = FormBorderStyle.FixedDialog;
            MaximizeBox = false;
            MinimizeBox = false;
            BackColor = Color.FromArgb(238, 242, 248);
            Font = new Font("Segoe UI", 10F, FontStyle.Regular, GraphicsUnit.Point);

            Panel card = new Panel
            {
                Width = 410,
                Height = 245,
                Left = 25,
                Top = 25,
                BackColor = Color.White,
                BorderStyle = BorderStyle.FixedSingle
            };

            Label lblTitle = new Label
            {
                Left = 20,
                Top = 18,
                Width = 360,
                Text = "NURSE LOGIN",
                Font = new Font("Segoe UI Semibold", 16F, FontStyle.Bold, GraphicsUnit.Point),
                ForeColor = Color.FromArgb(28, 79, 140)
            };

            Label lblSub = new Label
            {
                Left = 20,
                Top = 52,
                Width = 360,
                Text = "Dang nhap truoc khi vao man hinh dieu phoi.",
                ForeColor = Color.FromArgb(96, 106, 122)
            };

            Label lblUser = new Label { Left = 20, Top = 88, Width = 100, Text = "Tai khoan" };
            txtUsername = new TextBox
            {
                Left = 20,
                Top = 108,
                Width = 365,
                Height = 30,
                Font = new Font("Segoe UI", 11F, FontStyle.Regular, GraphicsUnit.Point)
            };

            Label lblPass = new Label { Left = 20, Top = 145, Width = 100, Text = "Mat khau" };
            txtPassword = new TextBox
            {
                Left = 20,
                Top = 165,
                Width = 365,
                Height = 30,
                PasswordChar = '*',
                Font = new Font("Segoe UI", 11F, FontStyle.Regular, GraphicsUnit.Point)
            };

            Button btnLogin = new Button
            {
                Left = 20,
                Top = 205,
                Width = 175,
                Height = 34,
                Text = "Dang nhap",
                BackColor = Color.FromArgb(33, 150, 243),
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat
            };
            btnLogin.FlatAppearance.BorderSize = 0;
            btnLogin.Click += BtnLogin_Click;

            Button btnCancel = new Button
            {
                Left = 210,
                Top = 205,
                Width = 175,
                Height = 34,
                Text = "Thoat",
                BackColor = Color.FromArgb(236, 239, 241),
                ForeColor = Color.FromArgb(55, 71, 79),
                FlatStyle = FlatStyle.Flat
            };
            btnCancel.FlatAppearance.BorderColor = Color.FromArgb(189, 198, 207);
            btnCancel.Click += (s, e) => Close();

            lblHint = new Label
            {
                Left = 20,
                Top = 248,
                Width = 365,
                Height = 20,
                ForeColor = Color.FromArgb(113, 128, 150),
                Text = "Mac dinh: nurse1 / 123456"
            };

            txtUsername.KeyDown += Input_KeyDown;
            txtPassword.KeyDown += Input_KeyDown;

            card.Controls.Add(lblTitle);
            card.Controls.Add(lblSub);
            card.Controls.Add(lblUser);
            card.Controls.Add(txtUsername);
            card.Controls.Add(lblPass);
            card.Controls.Add(txtPassword);
            card.Controls.Add(btnLogin);
            card.Controls.Add(btnCancel);
            Controls.Add(card);
            Controls.Add(lblHint);

            AcceptButton = btnLogin;
            CancelButton = btnCancel;
            Shown += (s, e) => txtUsername.Focus();
        }

        private void Input_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.KeyCode == Keys.Enter)
            {
                BtnLogin_Click(this, EventArgs.Empty);
            }
        }

        private void BtnLogin_Click(object sender, EventArgs e)
        {
            string username = txtUsername.Text.Trim();
            string password = txtPassword.Text.Trim();

            if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
            {
                MessageBox.Show("Vui long nhap tai khoan va mat khau.", "Canh bao", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            var (success, userId, fullName) = DatabaseHelper.LoginUser(username, password);

            if (!success)
            {
                MessageBox.Show("Tai khoan hoac mat khau khong dung.", "Dang nhap that bai", MessageBoxButtons.OK, MessageBoxIcon.Error);
                txtPassword.Clear();
                txtPassword.Focus();
                return;
            }

            LoggedInUserId = userId;
            LoggedInUserName = username;
            LoggedInFullName = string.IsNullOrWhiteSpace(fullName) ? username : fullName;
            LoginSuccess = true;
            DialogResult = DialogResult.OK;
            Close();
        }
    }
}
