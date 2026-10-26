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
    public class PaymDesignationsController : ControllerBase
    {
        private readonly HrmsystemContext _context;

        public PaymDesignationsController(HrmsystemContext context)
        {
            _context = context;
        }

        // GET: api/PaymDesignations
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PaymDesignation>>> GetPaymDesignations()
        {
            return await _context.PaymDesignations.ToListAsync();
        }

        // GET: api/PaymDesignations/5
        [HttpGet("{id}")]
        public async Task<ActionResult<PaymDesignation>> GetPaymDesignation(int id)
        {
            var paymDesignation = await _context.PaymDesignations.FindAsync(id);

            if (paymDesignation == null)
            {
                return NotFound();
            }

            return paymDesignation;
        }

        // PUT: api/PaymDesignations/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutPaymDesignation(int id, PaymDesignation paymDesignation)
        {
            if (id != paymDesignation.PnCompanyId)
            {
                return BadRequest();
            }

            _context.Entry(paymDesignation).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!PaymDesignationExists(id))
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

        // POST: api/PaymDesignations
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<PaymDesignation>> PostPaymDesignation(PaymDesignation paymDesignation)
        {
            _context.PaymDesignations.Add(paymDesignation);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                if (PaymDesignationExists(paymDesignation.PnCompanyId))
                {
                    return Conflict();
                }
                else
                {
                    throw;
                }
            }

            return CreatedAtAction("GetPaymDesignation", new { id = paymDesignation.PnCompanyId }, paymDesignation);
        }

        // DELETE: api/PaymDesignations/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePaymDesignation(int id)
        {
            var paymDesignation = await _context.PaymDesignations.FindAsync(id);
            if (paymDesignation == null)
            {
                return NotFound();
            }

            _context.PaymDesignations.Remove(paymDesignation);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool PaymDesignationExists(int id)
        {
            return _context.PaymDesignations.Any(e => e.PnCompanyId == id);
        }
    }
}
