using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using Personal_project.Models;
using System.Globalization;

namespace Personal_project.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class HomeController : ControllerBase
    {
        private readonly Persnal_projectContext _dbcontext; 

        public HomeController(Persnal_projectContext dbcontext)
        {
            _dbcontext = dbcontext;
        }


        //////////////////根據categoryType以及dateRange，過濾同時符合兩個條件的transaction////////////////
        [HttpGet("GetFilteredTransactions")]
        public async Task<IActionResult> GetFilteredTransactions(string categoryType, string dateRange,string accountBookName, int? UserId)
        {   
             if (string.IsNullOrEmpty(dateRange) || string.IsNullOrEmpty(accountBookName))
            {
                return BadRequest("無效輸入");
            }

            // 解析前端傳遞的日期範圍
            var dateRangeParts = dateRange.Split(" - ");
            if (dateRangeParts.Length != 2)
            {
                return BadRequest("無效日期格式");
            }

            //起始日、結束日，提取並解析
            var startDateString = dateRangeParts[0];
            var endDateString = dateRangeParts[1];
            DateTime startDate = DateTime.ParseExact(startDateString, "yyyy-MM-dd", CultureInfo.InvariantCulture);
            DateTime endDate = DateTime.ParseExact(endDateString, "yyyy-MM-dd", CultureInfo.InvariantCulture); 

            //過濾包含特定類別、有效狀態、日期範圍
             var query = _dbcontext.Transactions
                .Include(t => t.account_book)
                    .ThenInclude(ab => ab.user)
                .Include(t => t.category_and_account)
                    .ThenInclude(caa => caa.category)
                .Where(t => t.transaction_status == "live" && t.transaction_date >= startDate && t.transaction_date <= endDate);

            //如果有類型
            if (!string.IsNullOrEmpty(categoryType))
            {
                query = query.Where(t => t.category_and_account.category.category_type == categoryType);
            }

            //如果有帳本名稱，就繼續篩選特定帳本的transaction
            if (!string.IsNullOrEmpty(accountBookName))
            {
                var targetAccountBookId = _dbcontext.AccountBooks
                    .Where(ab => ab.account_book_name == accountBookName)
                    .Select(ab => ab.account_book_id)
                    .FirstOrDefault();

                query = query.Where(t => t.account_book_id == targetAccountBookId);
            }

            //如果提供UserId，就繼續篩選指定user的transaction
            if (UserId.HasValue)
            {
                query = query.Where(t => t.user.user_id == UserId);
            }

            var filtered = query.Select(t => new
            {
                CategoryName = t.category_and_account.category.category_name,
                CategoryType = t.category_and_account.category.category_type,
                Amount = t.amount,
                Day = t.transaction_date,
                Details = t.details,
                transaction_id = t.transaction_id,
                AccountBookName = t.account_book.account_book_name,
                AccountBookId = t.account_book.account_book_id,
                UserName = t.user.user_name
            }).ToList();

            //計算過濾結果的總計
            var totalAmount = filtered.Sum(t => t.Amount);

            // 以類別做為分類
            var categorySummary = filtered
                .GroupBy(t => t.CategoryName)
                .Select(group => new
                {
                    CategoryName = group.Key,
                    TotalAmount = group.Sum(t => t.Amount),
                    Percentage = CalculatePercentage((decimal)group.Sum(t => t.Amount), (decimal)totalAmount)
                })
                .ToList();

            var filteredWithTotal = filtered.Select(t => new
            {
                CategoryName = t.CategoryName,
                CategoryType = t.CategoryType,
                Amount = t.Amount,
                AccountBookName = t.AccountBookName,
                AccountBookId = t.AccountBookId,
                transaction_id = t.transaction_id,
                day = t.Day,
                details = t.Details,
                TotalAmount = totalAmount,
                UserName = t.UserName
            }).ToList();

            return Ok(new
            {
                filteredWithTotal,
                categories = categorySummary 
            });
        }

        private string CalculatePercentage(decimal value, decimal total)
        {
            if (total == 0)
            {
                return "0%";
            }

            decimal percentage = (value / total) * 100;
            return $"{percentage:F1}%";
        }
    }
}


            //設定初始時間
            // DateTime currentDate=DateTime.Now;
            // DateTime startDate;
            // DateTime endDate;
            // string dateRangeText;

            // switch(dateRange){
            //     case "day":
            //         startDate=currentDate.Date;
            //         endDate = currentDate.Date;
            //         dateRangeText = $"Today, {startDate.ToString("MMM d", new CultureInfo("en-US"))}"; //CultureInfo 顯示英文月份名稱
            //         break;
            //     case "week":
            //         startDate=currentDate.Date.AddDays(-(int)currentDate.DayOfWeek);
            //         endDate = currentDate.Date;
            //         dateRangeText = $"{startDate.ToString("MMM d",new CultureInfo("en-US"))} - {endDate.ToString("MMM d", new CultureInfo("en-US"))}";
            //         break;
            //     case "month":
            //         startDate=new DateTime(currentDate.Year,currentDate.Month,1);
            //         endDate = startDate.AddMonths(1).AddDays(-1);
            //         dateRangeText = $"{startDate.ToString("MMMM yyyy", new CultureInfo("en-US"))}";
            //         break;
            //     case "year":
            //         startDate=new DateTime(currentDate.Year,1,1);
            //         endDate = startDate.AddYears(1).AddDays(-1);
            //         dateRangeText = $"{startDate.ToString("yyyy")}";
            //         break;
            //     default:
            //         startDate=currentDate.Date;
            //         endDate = currentDate.Date;
            //        dateRangeText = "Unknown Date Range";
            //         break;
            // } 