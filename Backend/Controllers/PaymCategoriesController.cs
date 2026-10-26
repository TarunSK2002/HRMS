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
    public class PaymCategoriesController : ControllerBase
    {
        private readonly HrmsystemContext _context;

        public PaymCategoriesController(HrmsystemContext context)
        {
            _context = context;
        }

        // GET: api/PaymCategories
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PaymCategory>>> GetPaymCategories()
        {
            return await _context.PaymCategories.ToListAsync();
        }

        // GET: api/PaymCategories/5
        [HttpGet("{id}")]
        public async Task<ActionResult<PaymCategory>> GetPaymCategory(int id)
        {
            var paymCategory = await _context.PaymCategories.FindAsync(id);

            if (paymCategory == null)
            {
                return NotFound();
            }

            return paymCategory;
        }

        // PUT: api/PaymCategories/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutPaymCategory(int id, PaymCategory paymCategory)
        {
            if (id != paymCategory.PnCompanyId)
            {
                return BadRequest();
            }

            _context.Entry(paymCategory).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!PaymCategoryExists(id))
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

        // POST: api/PaymCategories
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<PaymCategory>> PostPaymCategory(PaymCategory paymCategory)
        {
            _context.PaymCategories.Add(paymCategory);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                if (PaymCategoryExists(paymCategory.PnCompanyId))
                {
                    return Conflict();
                }
                else
                {
                    throw;
                }
            }

            return CreatedAtAction("GetPaymCategory", new { id = paymCategory.PnCompanyId }, paymCategory);
        }

        // DELETE: api/PaymCategories/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePaymCategory(int id)
        {
            var paymCategory = await _context.PaymCategories.FindAsync(id);
            if (paymCategory == null)
            {
                return NotFound();
            }

            _context.PaymCategories.Remove(paymCategory);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool PaymCategoryExists(int id)
        {
            return _context.PaymCategories.Any(e => e.PnCompanyId == id);
        }
    }
}
