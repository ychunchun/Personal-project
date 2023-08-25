using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using Personal_project.Models;
using System.Globalization;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace Personal_project.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class NotificationController : ControllerBase
    {
        private readonly Persnal_projectContext _dbcontext; 

        public NotificationController(Persnal_projectContext dbcontext)
        {
            _dbcontext = dbcontext;
        }

        [Authorize]
        [HttpGet("GetNotification")]
        public async Task<IActionResult> GetNotifications()
        {

            var identity = HttpContext.User.Identity as ClaimsIdentity;
            var userIdClaim = identity.FindFirst(ClaimTypes.Email); 
            var email = userIdClaim.Value;
            
            var user = _dbcontext.Users.SingleOrDefault(u => u.email == email);
            if (user == null)
            {
                return NotFound();
            }

            var notifications = _dbcontext.Notifications
                .Where(n => n.target == user.user_id) // Filter by target user_id
                .Select(n => new
                {
                    TransactionId = n.transaction_id,
                    OperationType = n.operation_type,
                    CurrentTime = n.current_time.HasValue ? n.current_time.Value.ToString("MM/dd HH:mm") : "", // Format if not null
                    AccountBookName = n.account_book_name,
                    UserName = n.user_name,
                    CategoryName = n.category_name,
                    CategoryType = n.category_type,
                    Amount = n.amount
                });
            if (notifications == null)
            {
                return NotFound("Transaction not found");
            }

            return Ok(notifications);
        }


        [HttpPost("NotificationStatus")]
        public async Task<ActionResult> NotificationStatus(int notificationId)
        {
            try
            {
                var notification = await _dbcontext.Notifications
                    .FirstOrDefaultAsync(n => n.notification_id == notificationId);

                if (notification != null)
                {
                    notification.notification_status = "delete";
                    await _dbcontext.SaveChangesAsync();

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
    }
}