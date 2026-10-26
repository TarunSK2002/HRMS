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
    public class PaymJobStatusController : ControllerBase
    {
        private readonly HrmsystemContext _context;

        public PaymJobStatusController(HrmsystemContext context)
        {
            _context = context;
        }

        // GET: api/PaymJobStatus
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PaymJobStatus>>> GetPaymJobStatuses()
        {
            return await _context.PaymJobStatuses.ToListAsync();
        }

        // GET: api/PaymJobStatus/5
        [HttpGet("{id}")]
        public async Task<ActionResult<PaymJobStatus>> GetPaymJobStatus(int id)
        {
            var paymJobStatus = await _context.PaymJobStatuses.FindAsync(id);

            if (paymJobStatus == null)
            {
                return NotFound();
            }

            return paymJobStatus;
        }

        // PUT: api/PaymJobStatus/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutPaymJobStatus(int id, PaymJobStatus paymJobStatus)
        {
            if (id != paymJobStatus.PnCompanyId)
            {
                return BadRequest();
            }

            _context.Entry(paymJobStatus).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!PaymJobStatusExists(id))
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

        // POST: api/PaymJobStatus
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<PaymJobStatus>> PostPaymJobStatus(PaymJobStatus paymJobStatus)
        {
            _context.PaymJobStatuses.Add(paymJobStatus);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                if (PaymJobStatusExists(paymJobStatus.PnCompanyId))
                {
                    return Conflict();
                }
                else
                {
                    throw;
                }
            }

            return CreatedAtAction("GetPaymJobStatus", new { id = paymJobStatus.PnCompanyId }, paymJobStatus);
        }

        // DELETE: api/PaymJobStatus/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePaymJobStatus(int id)
        {
            var paymJobStatus = await _context.PaymJobStatuses.FindAsync(id);
            if (paymJobStatus == null)
            {
                return NotFound();
            }

            _context.PaymJobStatuses.Remove(paymJobStatus);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool PaymJobStatusExists(int id)
        {
            return _context.PaymJobStatuses.Any(e => e.PnCompanyId == id);
        }
    }
}
