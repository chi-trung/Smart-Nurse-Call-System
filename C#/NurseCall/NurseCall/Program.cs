using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace NurseCall
{
    internal static class Program
    {
        /// <summary>
        /// The main entry point for the application.
        /// </summary>
        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            try
            {
                DatabaseHelper.InitializeDatabase();
                DatabaseHelper.EnsureDefaultNurseUser();
            }
            catch (Exception ex)
            {
                MessageBox.Show("Khong the khoi tao he thong: " + ex.Message, "Loi", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }

            using (LoginForm loginForm = new LoginForm())
            {
                if (loginForm.ShowDialog() == DialogResult.OK && loginForm.LoginSuccess)
                {
                    Application.Run(new Form1(LoginForm.LoggedInFullName));
                }
            }
        }
    }
}
