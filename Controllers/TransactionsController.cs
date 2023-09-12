using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;
using Personal_project.Models; 
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace Personal_project.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TransactionsController : ControllerBase
    {
        private readonly Persnal_projectContext _dbcontext; 

        public TransactionsController(Persnal_projectContext dbcontext)
        {
            _dbcontext = dbcontext;
        }


        
        [HttpPost("AddTransaction")]
        public async Task<ActionResult> AddTransaction(TransactionAddDto input)
        {
            try
            {
                 // 在這裡查找category_id，使用input.category_name和input.category_type
                int categoryAndAccountId = GetCategoryAndAccountId(input.category_name, input.category_type, input.accountbookId);

                 // 設定台灣時間的 TimeZoneInfo
                TimeZoneInfo taipeiTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Taipei Standard Time");

                // 根據 account_book_name 查找對應的 account_book_id
                var accountBooks = await _dbcontext.AccountBooks
                    .FirstOrDefaultAsync(ab => ab.account_book_name == input.account_book_name);

                var newTransactions = new Transactions
                {
                    user_id = input.user_id, ///從前端的header取得
                    category_and_account_id = categoryAndAccountId,
                    amount = Convert.ToInt32(input.amount), //int轉string
                    transaction_date = input.transaction_date,
                    details = input.details,
                    account_book_id = input.accountbookId,
                    transaction_status = "live"
                };
                _dbcontext.Transactions.Add(newTransactions);
                await _dbcontext.SaveChangesAsync();

                //找出所有關聯的表格
                var accountBook = await _dbcontext.AccountBooks.FirstOrDefaultAsync(ab => ab.account_book_id == newTransactions.account_book_id);
                var user = await _dbcontext.Users.FirstOrDefaultAsync(u => u.user_id == newTransactions.user_id);
                var category = await _dbcontext.Categories.FirstOrDefaultAsync(c => c.category_id == categoryAndAccountId);

                var result = new
                {
                    user_id = newTransactions.user_id,
                    user_name = user != null ? user.user_name : "",
                    transaction_id = newTransactions.transaction_id,
                    category_id = newTransactions.category_and_account_id,
                    category_name = input.category_name,
                    category_type = input.category_type,
                    amount = newTransactions.amount,
                    transaction_date = newTransactions.transaction_date.HasValue
                        ? newTransactions.transaction_date.Value.ToString("yyyy-MM-dd")
                        : string.Empty, // 先確認 transaction_date 是否有值，然後再進行格式化
                    details = newTransactions.details,
                    account_book_id = newTransactions.account_book_id, 
                    account_book_name = accountBook != null ? accountBook.account_book_name : "",
                    current_time = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, taipeiTimeZone).ToString("yyyy-MM-dd HH:mm"), // 使用當前系統時間
                    operation_type = "新增"
                };


                // 將帳目資訊新增到 History table
                var newHistory = new History
                {
                    
                    transaction_id = result.transaction_id,
                    operation_type = "新增",
                    operation_date = newTransactions.transaction_date,
                    user_name = result.user_name,
                    user_id = result.user_id,
                    account_book_id = result.account_book_id,
                    amount = result.amount,
                    category_name = result.category_name,
                    category_type = result.category_type,
                };

                _dbcontext.History.Add(newHistory);
                await _dbcontext.SaveChangesAsync();


                // // 獲取帳本成員人數
                // var membersIds = await _dbcontext.Members
                //     .Where(m => m.account_book_id == newTransactions.account_book_id)
                //     .Select(m => m.user_id)
                //     .ToListAsync();
                // Console.WriteLine("Members IDs: " + string.Join(", ", membersIds));

                // //判斷集合裡面是否存在任何元素，如果沒有的話代表帳本只有一個人，因此不需要發送通知
                // if (membersIds.Any())
                // {
                //     Console.WriteLine("Members IDs have values.");
                //     string membersIdsString = string.Join(", ", membersIds);
                //     Console.WriteLine("Members IDs: " + membersIdsString);

                //     //創建一個陣列存取寫入帳本所有的成員id
                //     var targetUserIds = new List<int>(membersIds.Select(id => id.Value));
                //     targetUserIds.Remove(input.user_id);

                //      // 寫入到Notification table，根據陣列長度進行迴圈，並存入回圈值到target
                //     foreach (var targetUserId in targetUserIds)
                //     {
                //         var newNotification = new Notifications
                //         {
                //             user_id = result.user_id,
                //             target = targetUserId,  // Store the member's ID in the target column
                //             transaction_id = result.transaction_id,
                //             operation_type = "新增",
                //             notification_status = "live",
                //             current_time = DateTime.Now,
                //             user_name = result.user_name,
                //             amount = result.amount,
                //             category_name = result.category_name,
                //             category_type = result.category_type,
                //             account_book_name = result.account_book_name,
                //             account_book_id = result.account_book_id,
                //         };

                //         _dbcontext.Notifications.Add(newNotification);
                //     }

                //     await _dbcontext.SaveChangesAsync();
                // }
                // else
                // {
                //     Console.WriteLine("No member IDs found.");
                // }

                return Ok(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine("Exception: " + ex.Message);
                return BadRequest(ex.Message);
            }
        }


        [Authorize]
        [HttpPost("UpdateTransaction")]
        public async Task<ActionResult> UpdateTransaction(TransactionUpdateDto input)
        {
            try
            {
                var existingTransaction = await _dbcontext.Transactions
                    .FirstOrDefaultAsync(t => t.transaction_id == input.transactionId);

                if (existingTransaction == null)
                {
                    return NotFound("Transaction not found");
                }

                // 更新交易屬性值
                existingTransaction.category_and_account_id = GetCategoryAndAccountId(input.category_name, input.category_type, input.accountbookId);
                existingTransaction.amount = (int?)input.amount;
                existingTransaction.transaction_date = input.transaction_date;
                existingTransaction.details = input.details;

                // 進行其他需要更新的屬性...

                await _dbcontext.SaveChangesAsync();

                // 同步新增至其他表格
                //await AddToHistory(existingTransaction);

                 // 取得使用者的身份識別資訊，使用Claim解析token，ClaimIdentity提供多種類型
                var identity = HttpContext.User.Identity as ClaimsIdentity; //HttpContext.User.Identity 屬性取得使用者的身份資訊，ClaimsIdentity 代表使用者的身份識別
                var emailClaim = identity.FindFirst(ClaimTypes.Email); 
                var email = emailClaim.Value; //emailClaim是物件, email是字串變數

                // 根據 email 從資料庫中尋找使用者
                var user = _dbcontext.Users.SingleOrDefault(u => u.email == email);
                if (user == null)
                {
                    return NotFound();
                }

                var currentDate = DateTime.Now;
                var dateOnly = new DateTime(currentDate.Year, currentDate.Month, currentDate.Day, 0, 0, 0, 0);
                //新增到History table
                 var newHistory = new History
                {
                    transaction_id = input.transactionId,
                    operation_type = "修改",
                    operation_date = dateOnly, // 修改時的操作日期
                    user_name = user.user_name,
                    user_id = user.user_id,
                    account_book_id = input.accountbookId,
                    amount = (int?)input.amount,
                    category_name = input.category_name,
                    category_type = input.category_type,
                };

                _dbcontext.History.Add(newHistory);
                await _dbcontext.SaveChangesAsync();

                return Ok();
            }
            catch (Exception ex)
            {
                Console.WriteLine("Exception: " + ex.Message);
                return BadRequest(ex.Message);
            }
        }



        // // 同步新增至 Notifications 表格
        // private async Task AddToNotifications(Transactions transaction)
        // {
        //     var membersIds = await _dbcontext.Members
        //         .Where(m => m.account_book_id == transaction.account_book_id)
        //         .Select(m => m.user_id)
        //         .ToListAsync();

        //     if (membersIds.Any())
        //     {
        //         var targetUserIds = new List<int>(membersIds.Select(id => id.Value));
        //         targetUserIds.Remove((int)transaction.user_id);

        //         foreach (var targetUserId in targetUserIds)
        //         {
        //             var newNotification = new Notifications
        //             {
        //                 user_id = transaction.user_id,
        //                 target = targetUserId,
        //                 transaction_id = transaction.transaction_id,
        //                 operation_type = "修改",
        //                 notification_status = "live",
        //                 current_time = DateTime.Now,
        //                 user_name = transaction.user.user_name,
        //                 amount = transaction.amount,
        //                 category_name = transaction.category_and_account.category.category_name,
        //                 category_type = transaction.category_and_account.category.category_type,
        //                 account_book_name = transaction.account_book.account_book_name,
        //                 account_book_id = transaction.account_book_id,
        //             };

        //             _dbcontext.Notifications.Add(newNotification);
        //         }

        //         await _dbcontext.SaveChangesAsync();
        //     }
        // }



        //利用category_name以及category_type查找對應的category_id
        private int GetCategoryAndAccountId(string category_name, string category_type, int accountbookId)
        {
            // 根據 name 和 type 在 Categories 表中找到對應的 category_id
            var category = _dbcontext.Categories.FirstOrDefault(c => c.category_name == category_name && c.category_type == category_type);

            if (category != null)
            {
                // 找到了對應的 category，現在查詢 CategoryAndAccount 表來獲取 category_and_account_id
                var categoryAndAccount = _dbcontext.CategoryAndAccount.FirstOrDefault(caa => caa.category_id == category.category_id && caa.account_id == accountbookId);

                if (categoryAndAccount != null)
                {
                    return categoryAndAccount.category_and_account_id;
                }
            }

            // 如果找不到對應的 category_and_account，則返回一個特定的值
            return -1; // -1 表示未找到
        }



        [Authorize]
        [HttpPost("TransactionStatus")]
        public async Task<ActionResult> TransactionStatus([FromQuery] int transactionId)
        {
            try
            {
                var updatestatus = await _dbcontext.Transactions
                    .FirstOrDefaultAsync(t => t.transaction_id == transactionId);
                Console.WriteLine("updatestatus",updatestatus);

                if (updatestatus != null)
                {
                    updatestatus.transaction_status = "delete";
                    await _dbcontext.SaveChangesAsync();
                    await ProcessNotification(transactionId);
                    return Ok();
                }
                else
                {
                    return NotFound();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Exception: " + ex.ToString());
                return BadRequest(ex.Message);
            }
        }

        private async Task ProcessNotification(int transactionId)
        {
            try
            {
                // 解析 token，獲取 user_id
                var identity = HttpContext.User.Identity as ClaimsIdentity;
                var userIdClaim = identity.FindFirst(ClaimTypes.Email); 
                var email = userIdClaim.Value;
                
                var user = await _dbcontext.Users.SingleOrDefaultAsync(u => u.email == email);
                if (user == null)
                {
                    return;
                }

                var transactionInfo = await _dbcontext.Transactions
                    .Include(t => t.account_book)
                    .Include(t => t.user)
                    .Include(t => t.category_and_account)
                    .ThenInclude(caa => caa.category)
                    .FirstOrDefaultAsync(t => t.transaction_id == transactionId);

                if (transactionInfo != null)
                {
                    // 獲取帳本中所有成員的id
                    var membersIds = await _dbcontext.Members
                        .Where(m => m.account_book_id == transactionInfo.account_book_id)
                        .Select(m => m.user_id)
                        .ToListAsync();

                    Console.WriteLine("Members IDs: " + string.Join(", ", membersIds));

                    // 判斷帳本是否有其他成員
                    if (membersIds.Any())
                    {
                        var targetUserIds = new List<int>(membersIds.Select(id => id.Value));
                        targetUserIds.Remove(user.user_id);

                        foreach (var targetUserId in targetUserIds)
                        {
                            var newNotification = new Notifications
                            {
                                user_id = user.user_id,
                                target = targetUserId,
                                transaction_id = transactionInfo.transaction_id,
                                operation_type = "刪除",
                                notification_status = "live",
                                current_time = DateTime.Now,
                                user_name = transactionInfo.user.user_name,
                                amount = transactionInfo.amount,
                                category_name = transactionInfo.category_and_account.category.category_name,
                                category_type = transactionInfo.category_and_account.category.category_type,
                                account_book_name = transactionInfo.account_book.account_book_name,
                                account_book_id = transactionInfo.account_book_id,
                            };
                            
                            _dbcontext.Notifications.Add(newNotification);
                        }
                        await _dbcontext.SaveChangesAsync();
                    }

                    //新增資料到History table
                    var newHistory = new History
                    {                      
                        transaction_id = transactionInfo.transaction_id,
                        operation_type = "刪除",
                        operation_date = transactionInfo.transaction_date,
                        user_name = transactionInfo.user.user_name,
                        user_id = user.user_id,
                        account_book_id = transactionInfo.account_book_id,
                        amount = transactionInfo.amount,
                        category_name = transactionInfo.category_and_account.category.category_name,
                        category_type = transactionInfo.category_and_account.category.category_type,
                    };

                    _dbcontext.History.Add(newHistory);
                    await _dbcontext.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Exception: " + ex.Message);
            }
        }



        [HttpGet("TransactionDetails")]
        public async Task<IActionResult> GetTransactionDetail([FromQuery] int transactionId)
        {
            try
            {
                var transaction = await _dbcontext.Transactions
                    .Include(t => t.category_and_account.category)
                    .Include(t => t.account_book)
                    .Include(t => t.user)
                    .Where(t =>  t.transaction_status=="live" ) //只顯示status不為delete的資料
                    .FirstOrDefaultAsync(t => t.transaction_id == transactionId);

                if (transaction == null)
                {
                    return NotFound("Transaction not found");
                }

                var transactionDetail = new
                {
                    AccountBookName = transaction.account_book.account_book_name,
                    CategoryType = transaction.category_and_account.category.category_type,
                    CategoryName = transaction.category_and_account.category.category_name,
                    Amount = transaction.amount,
                    Day = transaction.transaction_date,
                    Details = transaction.details,   
                    UserName = transaction.user.user_name,
                    TransactionId=transaction.transaction_id,
                    AccountBookId=transaction.account_book_id
                };

                return Ok(transactionDetail);
            }
            catch (Exception ex)
            {
                return BadRequest("Error fetching transaction detail: " + ex.Message);
            }
        }

    }
}
