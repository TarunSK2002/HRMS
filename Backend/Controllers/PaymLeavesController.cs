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
    public class PaymLeavesController : ControllerBase
    {
        private readonly HrmsystemContext _context;

        public PaymLeavesController(HrmsystemContext context)
        {
            _context = context;
        }

        // GET: api/PaymLeaves
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PaymLeave>>> GetPaymLeaves()
        {
            return await _context.PaymLeaves.ToListAsync();
        }

        // GET: api/PaymLeaves/5
        [HttpGet("{id}")]
        public async Task<ActionResult<PaymLeave>> GetPaymLeave(int id)
        {
            var paymLeave = await _context.PaymLeaves.FindAsync(id);

            if (paymLeave == null)
            {
                return NotFound();
            }

            return paymLeave;
        }

        // PUT: api/PaymLeaves/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutPaymLeave(int id, PaymLeave paymLeave)
        {
            if (id != paymLeave.PnCompanyId)
            {
                return BadRequest();
            }

            _context.Entry(paymLeave).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!PaymLeaveExists(id))
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

        // POST: api/PaymLeaves
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<PaymLeave>> PostPaymLeave(PaymLeave paymLeave)
        {
            _context.PaymLeaves.Add(paymLeave);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                if (PaymLeaveExists(paymLeave.PnCompanyId))
                {
                    return Conflict();
                }
                else
                {
                    throw;
                }
            }

            return CreatedAtAction("GetPaymLeave", new { id = paymLeave.PnCompanyId }, paymLeave);
        }

        // DELETE: api/PaymLeaves/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePaymLeave(int id)
        {
            var paymLeave = await _context.PaymLeaves.FindAsync(id);
            if (paymLeave == null)
            {
                return NotFound();
            }

            _context.PaymLeaves.Remove(paymLeave);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool PaymLeaveExists(int id)
        {
            return _context.PaymLeaves.Any(e => e.PnCompanyId == id);
        }
    }
}
