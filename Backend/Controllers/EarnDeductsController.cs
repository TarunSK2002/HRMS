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
    public class EarnDeductsController : ControllerBase
    {
        private readonly HrmsystemContext _context;

        public EarnDeductsController(HrmsystemContext context)
        {
            _context = context;
        }

        // GET: api/EarnDeducts
        [HttpGet]
        public async Task<ActionResult<IEnumerable<EarnDeduct>>> GetEarnDeducts()
        {
            return await _context.EarnDeducts.ToListAsync();
        }

        // GET: api/EarnDeducts/5
        [HttpGet("{id}")]
        public async Task<ActionResult<EarnDeduct>> GetEarnDeduct(int id)
        {
            var earnDeduct = await _context.EarnDeducts.FindAsync(id);

            if (earnDeduct == null)
            {
                return NotFound();
            }

            return earnDeduct;
        }

        // PUT: api/EarnDeducts/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutEarnDeduct(int id, EarnDeduct earnDeduct)
        {
            if (id != earnDeduct.PnCompanyId)
            {
                return BadRequest();
            }

            _context.Entry(earnDeduct).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!EarnDeductExists(id))
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

        // POST: api/EarnDeducts
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<EarnDeduct>> PostEarnDeduct(EarnDeduct earnDeduct)
        {
            _context.EarnDeducts.Add(earnDeduct);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                if (EarnDeductExists(earnDeduct.PnCompanyId))
                {
                    return Conflict();
                }
                else
                {
                    throw;
                }
            }

            return CreatedAtAction("GetEarnDeduct", new { id = earnDeduct.PnCompanyId }, earnDeduct);
        }

        // DELETE: api/EarnDeducts/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEarnDeduct(int id)
        {
            var earnDeduct = await _context.EarnDeducts.FindAsync(id);
            if (earnDeduct == null)
            {
                return NotFound();
            }

            _context.EarnDeducts.Remove(earnDeduct);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool EarnDeductExists(int id)
        {
            return _context.EarnDeducts.Any(e => e.PnCompanyId == id);
        }
    }
}
