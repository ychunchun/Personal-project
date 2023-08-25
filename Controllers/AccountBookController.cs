using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using Personal_project.Models;
using System.Globalization;
using System.Text;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Cryptography;
using Newtonsoft.Json;
using Microsoft.AspNetCore.Authorization;

namespace Personal_project.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AccountBookController : ControllerBase
    {
        private readonly Persnal_projectContext _dbcontext; 

        public AccountBookController(Persnal_projectContext dbcontext)
        {
            _dbcontext = dbcontext;
        }

        [Authorize]
        [HttpGet("GetAccountBook")]
        public async Task<ActionResult> GetAccountBook()
        {
            var identity = HttpContext.User.Identity as ClaimsIdentity;
            var userIdClaim = identity.FindFirst(ClaimTypes.Email); 
            var email = userIdClaim.Value;
            
            var user = _dbcontext.Users.SingleOrDefault(u => u.email == email);
            if (user == null)
            {
                return NotFound();
            }

            //根據當前頁面user的token，透過Members table給出其所擁有的AccountBook資訊
            var accountbooks = await _dbcontext.Members
                .Where(m => m.user_id == user.user_id)
                .Join(_dbcontext.AccountBooks,
                    member=>member.account_book_id,
                    accountBook=>accountBook.account_book_id,
                    (member,accountBook)=>new
                    {
                        AccountBookId = member.account_book_id,
                        AccountBookName = accountBook.account_book_name,
                        AccountBookType = accountBook.account_book_type,
                        InitialBalance = accountBook.initial_balance
                    })
                .ToListAsync(); // Use ToListAsync to materialize the query

            if (accountbooks == null)
            {
                return NotFound("Accountbooks not found");
            }

            return Ok(accountbooks);
        }
    }
}