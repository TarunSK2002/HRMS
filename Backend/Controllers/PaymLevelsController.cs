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
    public class PaymLevelsController : ControllerBase
    {
        private readonly HrmsystemContext _context;

        public PaymLevelsController(HrmsystemContext context)
        {
            _context = context;
        }

        // GET: api/PaymLevels
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PaymLevel>>> GetPaymLevels()
        {
            return await _context.PaymLevels.ToListAsync();
        }

        // GET: api/PaymLevels/5
        [HttpGet("{id}")]
        public async Task<ActionResult<PaymLevel>> GetPaymLevel(int id)
        {
            var paymLevel = await _context.PaymLevels.FindAsync(id);

            if (paymLevel == null)
            {
                return NotFound();
            }

            return paymLevel;
        }

        // PUT: api/PaymLevels/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutPaymLevel(int id, PaymLevel paymLevel)
        {
            if (id != paymLevel.PnCompanyId)
            {
                return BadRequest();
            }

            _context.Entry(paymLevel).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!PaymLevelExists(id))
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

        // POST: api/PaymLevels
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<PaymLevel>> PostPaymLevel(PaymLevel paymLevel)
        {
            _context.PaymLevels.Add(paymLevel);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                if (PaymLevelExists(paymLevel.PnCompanyId))
                {
                    return Conflict();
                }
                else
                {
                    throw;
                }
            }

            return CreatedAtAction("GetPaymLevel", new { id = paymLevel.PnCompanyId }, paymLevel);
        }

        // DELETE: api/PaymLevels/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePaymLevel(int id)
        {
            var paymLevel = await _context.PaymLevels.FindAsync(id);
            if (paymLevel == null)
            {
                return NotFound();
            }

            _context.PaymLevels.Remove(paymLevel);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool PaymLevelExists(int id)
        {
            return _context.PaymLevels.Any(e => e.PnCompanyId == id);
        }
    }
}
