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
    public class PaymDivisionsController : ControllerBase
    {
        private readonly HrmsystemContext _context;

        public PaymDivisionsController(HrmsystemContext context)
        {
            _context = context;
        }

        // GET: api/PaymDivisions
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PaymDivision>>> GetPaymDivisions()
        {
            return await _context.PaymDivisions.ToListAsync();
        }

        // GET: api/PaymDivisions/5
        [HttpGet("{id}")]
        public async Task<ActionResult<PaymDivision>> GetPaymDivision(int id)
        {
            var paymDivision = await _context.PaymDivisions.FindAsync(id);

            if (paymDivision == null)
            {
                return NotFound();
            }

            return paymDivision;
        }

        // PUT: api/PaymDivisions/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutPaymDivision(int id, PaymDivision paymDivision)
        {
            if (id != paymDivision.PnCompanyId)
            {
                return BadRequest();
            }

            _context.Entry(paymDivision).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!PaymDivisionExists(id))
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

        // POST: api/PaymDivisions
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<PaymDivision>> PostPaymDivision(PaymDivision paymDivision)
        {
            _context.PaymDivisions.Add(paymDivision);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                if (PaymDivisionExists(paymDivision.PnCompanyId))
                {
                    return Conflict();
                }
                else
                {
                    throw;
                }
            }

            return CreatedAtAction("GetPaymDivision", new { id = paymDivision.PnCompanyId }, paymDivision);
        }

        // DELETE: api/PaymDivisions/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePaymDivision(int id)
        {
            var paymDivision = await _context.PaymDivisions.FindAsync(id);
            if (paymDivision == null)
            {
                return NotFound();
            }

            _context.PaymDivisions.Remove(paymDivision);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool PaymDivisionExists(int id)
        {
            return _context.PaymDivisions.Any(e => e.PnCompanyId == id);
        }
    }
}
