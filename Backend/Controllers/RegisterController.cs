using HRMSAPPLICATION.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using HRMSAPPLICATION.DTO;
using System.Threading.Tasks;

namespace HRMSAPPLICATION.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [AllowAnonymousJwt]
    public class RegisterController : ControllerBase
    {
        private readonly HrmsystemContext _context;

        public RegisterController(HrmsystemContext context)
        {
            _context = context;
        }

        [HttpPost("RegisterWithCompany")]
        public async Task<IActionResult> RegisterWithCompany([FromBody] RegisterWithCompanyDTO model)
        {
            // Check for existing username or email
            if (_context.Registers.Any(x => x.Username == model.RegisterUser.Username))
            {
                return BadRequest(new { message = "Username already exists" });
            }

            if (_context.Registers.Any(x => x.Email == model.RegisterUser.Email))
            {
                return BadRequest(new { message = "Email already exists" });
            }

            if (_context.PaymCompanies.Any(x => x.CompanyUserId == model.CompanyInfo.CompanyUserId))
            {
                return BadRequest(new { message = "Company User ID already exists" });
            }

            using (var transaction = await _context.Database.BeginTransactionAsync())
            {
                try
                {
                    // Save company
                    _context.PaymCompanies.Add(model.CompanyInfo);
                    await _context.SaveChangesAsync();

                    // Optionally set foreign key in user if needed (e.g., CompanyId)
                    // model.RegisterUser.PnCompanyId = model.CompanyInfo.PnCompanyId;

                    // Save user
                    _context.Registers.Add(model.RegisterUser);
                    await _context.SaveChangesAsync();

                    await transaction.CommitAsync();
                    return Ok(new { message = "registered successfully" });
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    return StatusCode(500, new { message = "Registration failed", error = ex.Message });
                }
            }
        }



            [AllowAnonymousJwt]
            [HttpPost("Register")]

            public async Task<IActionResult> Register([FromBody] signupDTO model)
            {
                if (model == null)
                    return BadRequest("Invalid data.");

                // 1️⃣ Check if username exists
                if (await _context.signups.AnyAsync(u => u.Username == model.Username))
                    return BadRequest(new { message = "Username already exists." });

                // 2️⃣ Create a unique DB name
                string newDbName = $"HRMS_{model.CompanyName}";
               using var transaction = await _context.Database.BeginTransactionAsync();
            try
                {
                    // 3️⃣ Insert into master DB
                    var masterUser = new signup
                    {
                        Username = model.Username,
                        Password = model.Password,
                        DatabaseName = newDbName
                    };
                    _context.signups.Add(masterUser);
                    await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // 4️⃣ Create new tenant database
                string masterConn = _context.Database.GetConnectionString();
                using (var connection = new SqlConnection(masterConn))
                    {
                        await connection.OpenAsync();
                        string createDbQuery = $"CREATE DATABASE [{newDbName}]";
                        using (var command = new SqlCommand(createDbQuery, connection))
                        {
                            await command.ExecuteNonQueryAsync();
                        }
                    }

                    // 5️⃣ Load SQL script (tenant schema)
                    string scriptPath = Path.Combine(Directory.GetCurrentDirectory(), "Scricpt", "SCRIPT_SQL.sql");   
                    if (!System.IO.File.Exists(scriptPath))
                        return BadRequest(new { message = "Schema script not found in Script folder." });

                    string scriptContent = await System.IO.File.ReadAllTextAsync(scriptPath);

                    // 6️⃣ Build tenant DB connection string
                    var builder = new SqlConnectionStringBuilder(masterConn)
                    {
                        InitialCatalog = newDbName
                    };
                    string tenantConn = builder.ConnectionString;

                    // 7️⃣ Execute schema script
                    using (var schemaConn = new SqlConnection(tenantConn))
                    {
                        await schemaConn.OpenAsync();
                        var commands = scriptContent.Split(new[] { "GO" }, StringSplitOptions.RemoveEmptyEntries);
                        foreach (var cmdText in commands)
                        {
                            using (var cmd = new SqlCommand(cmdText, schemaConn))
                            {
                                await cmd.ExecuteNonQueryAsync();
                            }
                        }
                    }

                    // 8️⃣ Insert company & register info into tenant DB
                    using (var dbConnection = new SqlConnection(tenantConn))
                    {
                        await dbConnection.OpenAsync();

                        // paym_Company insert
                        string insertCompany = @"
                        INSERT INTO paym_Company (CompanyName, Phone_No, Email_Id, Company_User_Id, Company_Password)
                        VALUES (@CompanyName, @PhoneNumber, @Email, @Username, @Password)";
                        using (var companyCmd = new SqlCommand(insertCompany, dbConnection))
                        {
                            companyCmd.Parameters.AddWithValue("@CompanyName", model.CompanyName ?? (object)DBNull.Value);
                            companyCmd.Parameters.AddWithValue("@PhoneNumber", model.PhoneNumber ?? (object)DBNull.Value);
                            companyCmd.Parameters.AddWithValue("@Email", model.Email ?? (object)DBNull.Value);
                            companyCmd.Parameters.AddWithValue("@Username", model.Username ?? (object)DBNull.Value);
                            companyCmd.Parameters.AddWithValue("@Password", model.Password ?? (object)DBNull.Value);
                            await companyCmd.ExecuteNonQueryAsync();
                        }

                        // Register insert
                        string insertRegister = @"
                        INSERT INTO Register (CompanyName, Email, Username, Passwordhash, MobileNumber, Address, CreatedAt, IsActive)
                        VALUES (@CompanyName, @Email, @Username, @Passwordhash, @MobileNumber, @Address, GETDATE(), 1)";
                        using (var regCmd = new SqlCommand(insertRegister, dbConnection))
                        {
                            regCmd.Parameters.AddWithValue("@CompanyName", model.CompanyName ?? (object)DBNull.Value);
                            regCmd.Parameters.AddWithValue("@Email", model.Email ?? (object)DBNull.Value);
                            regCmd.Parameters.AddWithValue("@Username", model.Username ?? (object)DBNull.Value);
                            regCmd.Parameters.AddWithValue("@Passwordhash", model.Password ?? (object)DBNull.Value);
                            regCmd.Parameters.AddWithValue("@MobileNumber", model.PhoneNumber ?? (object)DBNull.Value);
                            regCmd.Parameters.AddWithValue("@Address", model.Address ?? (object)DBNull.Value);
                            await regCmd.ExecuteNonQueryAsync();
                        }
                    }

                    return Ok(new
                    {
                        message = $"Signup successful! Database '{newDbName}' created.",
                        database = newDbName
                    });
                }
                catch (Exception ex)
                {
                    return StatusCode(500, new { message = "Error occurred.", error = ex.Message });
                }
            }
        }

    }
