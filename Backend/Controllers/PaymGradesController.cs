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
    public class PaymGradesController : ControllerBase
    {
        private readonly HrmsystemContext _context;

        public PaymGradesController(HrmsystemContext context)
        {
            _context = context;
        }

        // GET: api/PaymGrades
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PaymGrade>>> GetPaymGrades()
        {
            return await _context.PaymGrades.ToListAsync();
        }

        // GET: api/PaymGrades/5
        [HttpGet("{id}")]
        public async Task<ActionResult<PaymGrade>> GetPaymGrade(int id)
        {
            var paymGrade = await _context.PaymGrades.FindAsync(id);

            if (paymGrade == null)
            {
                return NotFound();
            }

            return paymGrade;
        }

        // PUT: api/PaymGrades/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutPaymGrade(int id, PaymGrade paymGrade)
        {
            if (id != paymGrade.PnCompanyId)
            {
                return BadRequest();
            }

            _context.Entry(paymGrade).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!PaymGradeExists(id))
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

        // POST: api/PaymGrades
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<PaymGrade>> PostPaymGrade(PaymGrade paymGrade)
        {
            _context.PaymGrades.Add(paymGrade);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                if (PaymGradeExists(paymGrade.PnCompanyId))
                {
                    return Conflict();
                }
                else
                {
                    throw;
                }
            }

            return CreatedAtAction("GetPaymGrade", new { id = paymGrade.PnCompanyId }, paymGrade);
        }

        // DELETE: api/PaymGrades/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePaymGrade(int id)
        {
            var paymGrade = await _context.PaymGrades.FindAsync(id);
            if (paymGrade == null)
            {
                return NotFound();
            }

            _context.PaymGrades.Remove(paymGrade);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool PaymGradeExists(int id)
        {
            return _context.PaymGrades.Any(e => e.PnCompanyId == id);
        }
    }
}
