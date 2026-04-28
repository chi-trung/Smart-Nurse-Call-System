using System;
using System.Drawing;
using System.Windows.Forms;

namespace NurseCall
{
    public partial class LoginForm : Form
    {
        public static int LoggedInUserId { get; set; } = -1;
        public static string LoggedInUserName { get; set; } = "";
        public static string LoggedInFullName { get; set; } = "";
        public bool LoginSuccess { get; set; } = false;

        public LoginForm()
        {
            InitializeComponent();
            SetupUI();
        }

        private void SetupUI()
        {
            this.Text = "Đăng Nhập - Smart Nurse Call";
            this.Size = new Size(450, 250);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.MinimizeBox = false;

            // Panel chính
            Panel mainPanel = new Panel();
            mainPanel.BackColor = Color.FromArgb(52, 152, 219);
            mainPanel.Dock = DockStyle.Fill;
            this.Controls.Add(mainPanel);

            // Label tiêu đề
            Label lblTitle = new Label();
            lblTitle.Text = "Smart Nurse Call System";
            lblTitle.Font = new Font("Arial", 16, FontStyle.Bold);
            lblTitle.ForeColor = Color.White;
            lblTitle.Bounds = new Rectangle(10, 15, 400, 30);
            mainPanel.Controls.Add(lblTitle);

            // Label username
            Label lblUsername = new Label();
            lblUsername.Text = "Tên đăng nhập:";
            lblUsername.ForeColor = Color.White;
            lblUsername.Font = new Font("Arial", 10);
            lblUsername.Bounds = new Rectangle(20, 65, 100, 25);
            mainPanel.Controls.Add(lblUsername);

            // Textbox username
            TextBox txtUsername = new TextBox();
            txtUsername.Name = "txtUsername";
            txtUsername.Font = new Font("Arial", 11);
            txtUsername.Bounds = new Rectangle(130, 65, 280, 30);
            mainPanel.Controls.Add(txtUsername);

            // Label password
            Label lblPassword = new Label();
            lblPassword.Text = "Mật khẩu:";
            lblPassword.ForeColor = Color.White;
            lblPassword.Font = new Font("Arial", 10);
            lblPassword.Bounds = new Rectangle(20, 110, 100, 25);
            mainPanel.Controls.Add(lblPassword);

            // Textbox password
            TextBox txtPassword = new TextBox();
            txtPassword.Name = "txtPassword";
            txtPassword.Font = new Font("Arial", 11);
            txtPassword.PasswordChar = '*';
            txtPassword.Bounds = new Rectangle(130, 110, 280, 30);
            mainPanel.Controls.Add(txtPassword);

            // Button đăng nhập
            Button btnLogin = new Button();
            btnLogin.Text = "ĐĂNG NHẬP";
            btnLogin.Font = new Font("Arial", 11, FontStyle.Bold);
            btnLogin.BackColor = Color.FromArgb(46, 204, 113);
            btnLogin.ForeColor = Color.White;
            btnLogin.FlatStyle = FlatStyle.Flat;
            btnLogin.Bounds = new Rectangle(130, 165, 130, 40);
            btnLogin.Click += (sender, e) => BtnLogin_Click(sender, e, txtUsername, txtPassword);
            mainPanel.Controls.Add(btnLogin);

            // Button hủy
            Button btnCancel = new Button();
            btnCancel.Text = "HỦY";
            btnCancel.Font = new Font("Arial", 11, FontStyle.Bold);
            btnCancel.BackColor = Color.FromArgb(231, 76, 60);
            btnCancel.ForeColor = Color.White;
            btnCancel.FlatStyle = FlatStyle.Flat;
            btnCancel.Bounds = new Rectangle(270, 165, 130, 40);
            btnCancel.Click += (sender, e) => this.Close();
            mainPanel.Controls.Add(btnCancel);

            // Cho phép Enter để đăng nhập
            txtUsername.KeyDown += (sender, e) => 
            {
                if (e.KeyCode == Keys.Enter) BtnLogin_Click(btnLogin, e, txtUsername, txtPassword);
            };
            txtPassword.KeyDown += (sender, e) => 
            {
                if (e.KeyCode == Keys.Enter) BtnLogin_Click(btnLogin, e, txtUsername, txtPassword);
            };
        }

        private void BtnLogin_Click(object sender, EventArgs e, TextBox txtUsername, TextBox txtPassword)
        {
            string username = txtUsername.Text.Trim();
            string password = txtPassword.Text.Trim();

            if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password))
            {
                MessageBox.Show("Vui lòng nhập tên đăng nhập và mật khẩu!", "Cảnh báo", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            // Gọi hàm đăng nhập từ DatabaseHelper
            var (success, userId, fullName) = DatabaseHelper.LoginUser(username, password);

            if (success)
            {
                LoggedInUserId = userId;
                LoggedInUserName = username;
                LoggedInFullName = fullName;
                LoginSuccess = true;
                
                MessageBox.Show($"Chào mừng {fullName}!", "Đăng nhập thành công", MessageBoxButtons.OK, MessageBoxIcon.Information);
                this.DialogResult = DialogResult.OK;
                this.Close();
            }
            else
            {
                MessageBox.Show("Tên đăng nhập hoặc mật khẩu không chính xác!", "Lỗi đăng nhập", MessageBoxButtons.OK, MessageBoxIcon.Error);
                txtPassword.Clear();
                txtPassword.Focus();
            }
        }
    }
}
