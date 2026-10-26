using HRMSAPPLICATION.DTO;
using HRMSAPPLICATION.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.VisualStudio.Web.CodeGenerators.Mvc.Templates.BlazorIdentity.Pages;
using System.Linq;

namespace HRMSAPPLICATION.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [AllowAnonymousJwt]

    public class CompanyLoginController : ControllerBase
    {
        private readonly HrmsystemContext _context;
        private Models.TokenHandler tokenHandler;

        public CompanyLoginController(HrmsystemContext context, Models.TokenHandler tokenHandler)
        {
            _context = context;
            this.tokenHandler = tokenHandler;
        }

        //[HttpPost]
        //public IActionResult Login([FromBody] CompanyLoginModelcs login)
        //{
        //    var isCompany = _context.PaymCompanies.Any(x => x.CompanyUserId == login.username && x.CompanyPassword == login.password);
        //    if (isCompany)
        //    {
        //        return Ok(new { message = "Company Login Successful", token = _tokenHandler.GenerateJwtToken(login.username) });
        //    }

        //    var isUser = _context.Registers.Any(x => x.Username == login.username && x.PasswordHash == login.password);
        //    if (isUser)
        //    {
        //        return Ok(new { message = "User Login Successful", token = _tokenHandler.GenerateJwtToken(login.username) });
        //    }

        //    return Unauthorized(new { message = "Invalid username or password" });
        //}




        [HttpPost]
        public async Task<IActionResult> Login([FromBody] CompanyDTO model)
        {
            if (model == null || string.IsNullOrWhiteSpace(model.Username) || string.IsNullOrWhiteSpace(model.Password))
                return BadRequest(new { message = "Username and password are required." });

            try
            {
               
                var user = await _context.signups
                    .FirstOrDefaultAsync(x => x.Username == model.Username && x.Password == model.Password);

                if (user == null)
                    return Unauthorized(new { message = "Invalid username or password." });

                string databaseName = user.DatabaseName?.Trim();
                if (string.IsNullOrEmpty(databaseName))
                    return BadRequest(new { message = "Database name not assigned for this user. Contact admin." });

               
                string masterConn = _context.Database.GetConnectionString();

                bool dbExists = false;
                using (var connection = new SqlConnection(masterConn))
                {
                    await connection.OpenAsync();

                    string checkDbQuery = @"
                SELECT COUNT(*)  FROM signup WHERE DatabaseName = @DbName";

                    using (var cmd = new SqlCommand(checkDbQuery, connection))
                    {
                        cmd.Parameters.AddWithValue("@DbName", databaseName);
                        var result = await cmd.ExecuteScalarAsync();
                        dbExists = Convert.ToInt32(result) > 0;
                    }
                }
                

                if (!dbExists)
                {
                    return BadRequest(new
                    {
                        message = $"Database '{databaseName}' not found for user '{model.Username}'. Please contact admin."
                    });
                }
                string token = tokenHandler.GenerateJwtToken(model.Username);

                return Ok(new
                {
                    message = "Login successful.",
                    database = databaseName,
                    token
                    
                });
            }
            catch (SqlException ex)
            {
                return StatusCode(500, new
                {
                    message = "SQL Server connection error. Please verify SQL service or credentials.",
                    error = ex.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Unexpected error occurred.",
                    error = ex.Message
                });
            }
        }


    }
}
    
