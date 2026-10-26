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
    public class PaymDepartmentsController : ControllerBase
    {
        private readonly HrmsystemContext _context;

        public PaymDepartmentsController(HrmsystemContext context)
        {
            _context = context;
        }

        // GET: api/PaymDepartments
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PaymDepartment>>> GetPaymDepartments()
        {
            return await _context.PaymDepartments.ToListAsync();
        }

        // GET: api/PaymDepartments/5
        [HttpGet("{id}")]
        public async Task<ActionResult<PaymDepartment>> GetPaymDepartment(int id)
        {
            var paymDepartment = await _context.PaymDepartments.FindAsync(id);

            if (paymDepartment == null)
            {
                return NotFound();
            }

            return paymDepartment;
        }

        // PUT: api/PaymDepartments/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutPaymDepartment(int id, PaymDepartment paymDepartment)
        {
            if (id != paymDepartment.PnCompanyId)
            {
                return BadRequest();
            }

            _context.Entry(paymDepartment).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!PaymDepartmentExists(id))
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

        // POST: api/PaymDepartments
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<PaymDepartment>> PostPaymDepartment(PaymDepartment paymDepartment)
        {
            _context.PaymDepartments.Add(paymDepartment);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                if (PaymDepartmentExists(paymDepartment.PnCompanyId))
                {
                    return Conflict();
                }
                else
                {
                    throw;
                }
            }

            return CreatedAtAction("GetPaymDepartment", new { id = paymDepartment.PnCompanyId }, paymDepartment);
        }

        // DELETE: api/PaymDepartments/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePaymDepartment(int id)
        {
            var paymDepartment = await _context.PaymDepartments.FindAsync(id);
            if (paymDepartment == null)
            {
                return NotFound();
            }

            _context.PaymDepartments.Remove(paymDepartment);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool PaymDepartmentExists(int id)
        {
            return _context.PaymDepartments.Any(e => e.PnCompanyId == id);
        }
    }
}
