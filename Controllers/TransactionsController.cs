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
                int categoryId = GetCategoryId(input.category_name, input.category_type);
                 // 設定台灣時間的 TimeZoneInfo
                TimeZoneInfo taipeiTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Taipei Standard Time");

                // 根據 account_book_name 查找對應的 account_book_id
                var accountBooks = await _dbcontext.AccountBooks
                    .FirstOrDefaultAsync(ab => ab.account_book_name == input.account_book_name);

                var newTransactions = new Transactions
                {
                    user_id = input.user_id, ///從前端的header取得
                    category_id = categoryId,
                    amount = Convert.ToInt32(input.amount), //int轉string
                    transaction_date = input.transaction_date,
                    details = input.details,
                    account_book_id = accountBooks.account_book_id,
                    transaction_status = "live"
                };
                _dbcontext.Transactions.Add(newTransactions);
                await _dbcontext.SaveChangesAsync();

                //找出所有關聯的表格
                var accountBook = await _dbcontext.AccountBooks.FirstOrDefaultAsync(ab => ab.account_book_id == newTransactions.account_book_id);
                var user = await _dbcontext.Users.FirstOrDefaultAsync(u => u.user_id == newTransactions.user_id);
                var category = await _dbcontext.Categories.FirstOrDefaultAsync(c => c.category_id == categoryId);

                var result = new
                {
                    user_id = newTransactions.user_id,
                    user_name = user != null ? user.user_name : "",
                    transaction_id = newTransactions.transaction_id,
                    category_id = newTransactions.category_id,
                    category_name = category != null ? category.category_name : "",
                    category_type = category != null ? category.category_type : "",
                    amount = newTransactions.amount,
                    transaction_date = newTransactions.transaction_date.HasValue
                        ? newTransactions.transaction_date.Value.ToString("yyyy-MM-dd")
                        : string.Empty, // 先確認 transaction_date 是否有值，然後再進行格式化
                    details = newTransactions.details,
                    account_book_id = newTransactions.account_book_id, // 先写死，之后有新增帐本页再改！  newTransactions.account_book_id,
                    account_book_name = accountBook != null ? accountBook.account_book_name : "",
                    current_time = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, taipeiTimeZone).ToString("yyyy-MM-dd HH:mm"), // 使用当前系统时间
                    operation_type = "Add"
                };

                // 獲取帳本成員人數
                var membersIds = await _dbcontext.Members
                    .Where(m => m.account_book_id == newTransactions.account_book_id)
                    .Select(m => m.user_id)
                    .ToListAsync();
                Console.WriteLine("Members IDs: " + string.Join(", ", membersIds));

                //判斷集合裡面是否存在任何元素，如果沒有的話代表帳本只有一個人，因此不需要發送通知
                if (membersIds.Any())
                {
                    Console.WriteLine("Members IDs have values.");
                    string membersIdsString = string.Join(", ", membersIds);
                    Console.WriteLine("Members IDs: " + membersIdsString);

                    //創建一個陣列存取寫入帳本所有的成員id
                    var targetUserIds = new List<int>(membersIds.Select(id => id.Value));
                    targetUserIds.Remove(input.user_id);

                     // 寫入到Notification table，根據陣列長度進行迴圈，並存入回圈值到target
                    foreach (var targetUserId in targetUserIds)
                    {
                        var newNotification = new Notifications
                        {
                            user_id = result.user_id,
                            target = targetUserId,  // Store the member's ID in the target column
                            transaction_id = result.transaction_id,
                            operation_type = "Add",
                            notification_status = "live",
                            current_time = DateTime.Now,
                            user_name = result.user_name,
                            amount = result.amount,
                            category_name = result.category_name,
                            category_type = result.category_type,
                            account_book_name = result.account_book_name,
                            account_book_id = result.account_book_id,
                        };

                        _dbcontext.Notifications.Add(newNotification);
                    }

                    await _dbcontext.SaveChangesAsync();
                }
                else
                {
                    Console.WriteLine("No member IDs found.");
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine("Exception: " + ex.Message);
                return BadRequest(ex.Message);
            }
        }


        [Authorize]
        [HttpPost("TransactionStatus")]
        public async Task<ActionResult> TransactionStatus([FromQuery] int transactionId)
        {
            try
            {
                var updatestatus = await _dbcontext.Transactions
                    .FirstOrDefaultAsync(t => t.transaction_id == transactionId);

                if (updatestatus != null)
                {
                    updatestatus.transaction_status = "delete";
                    await _dbcontext.SaveChangesAsync();

                    // 成功刪除狀態後，並且call ProcessNotification function 解析 Token
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
                Console.WriteLine("Exception: " + ex.Message);
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
                    .Include(t => t.category)
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
                                    operation_type = "Delete",
                                    notification_status = "live",
                                    current_time = DateTime.Now,
                                    user_name = transactionInfo.user.user_name,
                                    amount = transactionInfo.amount,
                                    category_name = transactionInfo.category.category_name,
                                    category_type = transactionInfo.category.category_type,
                                    account_book_name = transactionInfo.account_book.account_book_name,
                                    account_book_id = transactionInfo.account_book_id,
                                };
                                
                                _dbcontext.Notifications.Add(newNotification);
                            }
                            await _dbcontext.SaveChangesAsync();
                        }
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
                    .Include(t => t.category)
                    .Include(t => t.account_book)
                    .Where(t =>  t.transaction_status=="live" ) //只顯示status不為delete的資料
                    .FirstOrDefaultAsync(t => t.transaction_id == transactionId);

                if (transaction == null)
                {
                    return NotFound("Transaction not found");
                }

                var transactionDetail = new
                {
                    AccountBookName = transaction.account_book.account_book_name,
                    CategoryName = transaction.category.category_name,
                    Amount = transaction.amount,
                    Day = transaction.transaction_date,
                    Details = transaction.details,            
                };

                return Ok(transactionDetail);
            }
            catch (Exception ex)
            {
                return BadRequest("Error fetching transaction detail: " + ex.Message);
            }
        }

        // [HttpDelete("DeleteTransaction")]
        // public async Task<IActionResult> DeleteTransaction([FromQuery] int transactionId)
        // {
        //     try{
        //         Console.WriteLine($"DeleteTransaction called with transactionId: {transactionId}");
        //         var transactionToDelete = await _dbcontext.Transactions
        //             .Include(t => t.user)
        //             .Include(t => t.category)
        //             .Include(t => t.account_book)
        //             .FirstOrDefaultAsync(t => t.transaction_id == transactionId);

        //          if (transactionToDelete == null)
        //         {
        //             Console.WriteLine($"Transaction with ID {transactionId} not found.");
        //             return NotFound("Transaction not found");
        //         }

        //         //查詢關聯表格數據
        //         var user = transactionToDelete.user;
        //         var category = transactionToDelete.category;
        //         var accountBook = transactionToDelete.account_book;

        //         var result = new
        //         {
        //             user_id = user != null ? user.user_id.ToString() : "",
        //             user_name = user != null ? user.user_name : "",
        //             transaction_id = transactionId,
        //             category_id = transactionToDelete.category_id,
        //             category_name = category != null ? category.category_name : "",
        //             category_type = category != null ? category.category_type : "",
        //             amount = transactionToDelete.amount,
        //             transaction_date = transactionToDelete.transaction_date.HasValue
        //                 ? transactionToDelete.transaction_date.Value.ToString("yyyy-MM-dd")
        //                 : string.Empty,
        //             details = transactionToDelete.details,
        //             account_book_id = transactionToDelete.account_book_id,
        //             account_book_name = accountBook != null ? accountBook.account_book_name : "",
        //             operation_type = "Delete"
        //         };

        //         //存到Notification table
        //         var newNotifications = new Notifications
        //         {                   
        //             transaction_id= result.transaction_id,
        //             operation_type="Delete",
        //             current_time = DateTime.Now,
        //             user_name=result.user_name,
        //             amount=result.amount,
        //             category_name=result.category_name,
        //             category_type=result.category_type,
        //             account_book_name=result.account_book_name,                 
        //         };
        //         _dbcontext.Notifications.Add(newNotifications);
        //         _dbcontext.Transactions.Remove(transactionToDelete);
        //         await _dbcontext.SaveChangesAsync();

        // return Ok(result);
        //     }
        //     catch(Exception ex){
        //         Console.WriteLine("Error deleting transaction: " + ex.ToString());
        //         return BadRequest("Error:"+ex.Message);
        //     }
        // }

        //利用category_name以及category_type查找對應的category_id
        private int GetCategoryId(string  category_name, string category_type)
        {
            var category = _dbcontext.Categories
                .FirstOrDefault(c => c.category_name == category_name && c.category_type == category_type);

            if (category != null)
            {
                return category.category_id;
            }

            // 如果找不到對應的 category，則返回一個特定的值
            return -1; //  -1 表示未找到
        }
    }
}
