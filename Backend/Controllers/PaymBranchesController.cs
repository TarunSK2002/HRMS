using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HRMSAPPLICATION.Models;

namespace HRMSAPPLICATION.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [AllowAnonymousJwt]
    public class PaymBranchesController : ControllerBase
    {
        private readonly HrmsystemContext _context;

        public PaymBranchesController(HrmsystemContext context)
        {
            _context = context;
        }

        // GET: api/PaymBranches
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PaymBranch>>> GetPaymBranches()
        {
            return await _context.PaymBranches.ToListAsync();
        }

        // GET: api/PaymBranches/5
        [HttpGet("{id}")]
        public async Task<ActionResult<PaymBranch>> GetPaymBranch(int id)
        {
            var paymBranch = await _context.PaymBranches.FindAsync(id);

            if (paymBranch == null)
            {
                return NotFound();
            }

            return paymBranch;
        }

        // PUT: api/PaymBranches/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutPaymBranch(int id, PaymBranch paymBranch)
        {
            if (id != paymBranch.PnCompanyId)
            {
                return BadRequest();
            }

            _context.Entry(paymBranch).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!PaymBranchExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // POST: api/PaymBranches
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public String PostPaymBranch(PaymBranch paymBranch)
        {

            String query = "insert into paym_branch values(" + paymBranch.PnCompanyId + ", '" + paymBranch.BranchCode + "', '" + paymBranch.BranchName + "', '" + paymBranch.AddressLine1 + "', '" + paymBranch.AddressLine2 + "', '" + paymBranch.City + "', '" + paymBranch.ZipCode + "', '" + paymBranch.Country + "', '" + paymBranch.State + "', '" + paymBranch.PhoneNo + "', '" + paymBranch.FaxNo + "', '" + paymBranch.EmailId + "', '" + paymBranch.AlternateEmailId + "', '" + paymBranch.BranchUserId + "', '" + paymBranch.BranchPassword + "', '" + paymBranch.Status + "', '" + paymBranch.StartDate + "','" + paymBranch.EndDate + "')";

            var result = _context.Database.ExecuteSqlRaw(query);


            /*
            _context.PaymBranches.Add(paymBranch);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                if (PaymBranchExists(paymBranch.PnCompanyId))
                {
                    return Conflict();
                }
                else
                {
                    throw;
                }
            }
            */
            return "Branch created successfully";
        }

        // DELETE: api/PaymBranches/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePaymBranch(int id)
        {
            var paymBranch = await _context.PaymBranches.FindAsync(id);
            if (paymBranch == null)
            {
                return NotFound();
            }

            _context.PaymBranches.Remove(paymBranch);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool PaymBranchExists(int id)
        {
            return _context.PaymBranches.Any(e => e.PnCompanyId == id);
        }
    }
}