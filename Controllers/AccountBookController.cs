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
                        InitialBalance = accountBook.initial_balance,
                        AccountBookStatus = accountBook.account_book_status,
                        AdminUser=accountBook.user_id
                    })
                .Where(a => a.AccountBookStatus == "live")
                .ToListAsync(); 

            if (accountbooks == null)
            {
                return NotFound("Accountbooks not found");
            }

            var accountbooksWithProfit = new List<AccountBookDTO>(); //存放每一個帳本資訊
            int totalProfit = 0;

            //計算帳本中每一筆帳目
            foreach (var accountBook in accountbooks)
            {
                
                //尋找每個帳本中有哪些角色以及對應名字
                var members = await _dbcontext.Members
                    .Where(m => m.account_book_id == accountBook.AccountBookId)
                    .ToListAsync();

                var memberRolesAndUserNames = new List<MemberRoleAndUserNameDTO>();

                foreach (var member in members)
                {
                    //只取目前還在的member，但是再怎麼樣admin還是會在，除非他刪掉帳本
                    if (member.member_status == "live")
                    {
                        var memberUser = await _dbcontext.Users
                            .FirstOrDefaultAsync(u => u.user_id == member.user_id);

                        // 檢查是否為當前頁的user
                        string userNameDisplay = memberUser.user_name;
                        if (member.user_id == user.user_id) 
                        {
                            userNameDisplay += " (You)";
                        }

                        if (memberUser != null)
                        {
                            memberRolesAndUserNames.Add(new MemberRoleAndUserNameDTO
                            {
                                Role = member.role,
                                UserName = userNameDisplay,
                                MemberId=member.member_id
                            });
                        }
                    }
                }

                //計算每個帳本所擁有帳目的profit
                var transactions = await _dbcontext.Transactions
                    .Where(t => t.account_book_id == accountBook.AccountBookId)
                    .Join(_dbcontext.Categories,
                        transaction => transaction.category_id,
                        category => category.category_id,
                        (transaction, category) => new
                        {
                            TransactionAmount = transaction.amount,
                            CategoryType = category.category_type
                        })
                    .ToListAsync();

                var expenses = transactions.Where(t => t.CategoryType == "expense").Sum(t => t.TransactionAmount);
                var incomes = transactions.Where(t => t.CategoryType == "income").Sum(t => t.TransactionAmount);

                var profit = incomes - expenses + accountBook.InitialBalance;
                totalProfit += (int)profit; //計算所有帳本總和
                
                accountbooksWithProfit.Add(new AccountBookDTO
                {
                    AccountBookId = (int)accountBook.AccountBookId,
                    AccountBookName = accountBook.AccountBookName,
                    AccountBookType = accountBook.AccountBookType,
                    InitialBalance = accountBook.InitialBalance,
                    AdminUser=accountBook.AdminUser,
                    Profit = profit,
                    Members = memberRolesAndUserNames
                });
            }

            return Ok(new { AccountBooks = accountbooksWithProfit, TotalProfit = totalProfit, CurrentUserId = user.user_id  });
        }      


        [Authorize]
        [HttpPost("CreateAccountBook")]
        public async Task<ActionResult> CreateAccountBook(AccountBookAddDTO input)
        {
            var identity = HttpContext.User.Identity as ClaimsIdentity;
            var userIdClaim = identity.FindFirst(ClaimTypes.Email);
            var email = userIdClaim.Value;

            var user = await _dbcontext.Users.SingleOrDefaultAsync(u => u.email == email);
            if (user == null)
            {
                return NotFound();
            }

            // Create and add new account book
            var newAccountBook = new AccountBooks
            {
                account_book_name = input.AccountBookName,
                initial_balance = input.InitialBalance,
                user_id=user.user_id,
                account_book_type="sub",
                account_book_status="live"
            };

            _dbcontext.AccountBooks.Add(newAccountBook);
            await _dbcontext.SaveChangesAsync();

            // 新增帳本的同時，也加入admin的資料到Members table
            var newMember = new Members
            {
                user_id = newAccountBook.user_id,
                account_book_id = newAccountBook.account_book_id,
                role="admin",
                member_status="live"
            };

            _dbcontext.Members.Add(newMember);
            await _dbcontext.SaveChangesAsync();

            return Ok(new
            {
                AccountBookId = newAccountBook.account_book_id,
                UserId = user.user_id
            });
        }



        [HttpPost("AccountBookStatus")]
        public async Task<ActionResult> AccountBookStatus([FromBody] AccountBookStatusDTO dto)
        {
             try
            {
                var member = await _dbcontext.Members
                    .FirstOrDefaultAsync(m => m.account_book_id == dto.AccountBookId && m.role == "admin");

                if (member != null)
                {
                    var accountbook = await _dbcontext.AccountBooks
                        .FirstOrDefaultAsync(a => a.account_book_id == dto.AccountBookId);

                    if (accountbook != null)
                    {
                        accountbook.account_book_status = "delete";
                        await _dbcontext.SaveChangesAsync();

                        return Ok();
                    }
                    else
                    {
                        return NotFound();
                    }
                }
                else
                {
                    // 如果不是admin，則不能刪除
                    return Forbid(); 
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Exception: " + ex.Message);
                return BadRequest(ex.Message);
            }
        }
    }
}