using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using Personal_project.Models;
using System.Globalization;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Personal_project.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class HistoryController : ControllerBase
    {
        private readonly Persnal_projectContext _dbcontext; 

        public HistoryController(Persnal_projectContext dbcontext)
        {
            _dbcontext = dbcontext;
        }

        
        [HttpGet("GetHistory")]
        public async Task<IActionResult> GetHistory(int AccountBookId)
        {

            var history = await _dbcontext.History
                .Where(h => h.account_book_id ==  AccountBookId ) // Filter by target user_id
                .Select(h => new
                {
                    TransactionId = h.transaction_id,
                    OperationType = h.operation_type,
                    Date = h.operation_date.HasValue ? h.operation_date.Value.ToString("MM/dd") : "", // Format if not null
                    UserName = h.user_name,
                    CategoryName = h.category_name,
                    CategoryType = h.category_type,
                    Amount = h.amount,
                    AccountBookId=h.account_book_id
                })
                .ToListAsync();
            if (!history.Any())
            {
                return NotFound("History not found");
            }

            return Ok(history);
        }
    }
}