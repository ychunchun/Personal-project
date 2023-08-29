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
        public async Task<IActionResult> GetFilteredTransactions(string categoryType, string dateRange,string accountBookName)
        {
            //設定初始時間
            DateTime currentDate=DateTime.Now;
            DateTime startDate;
            DateTime endDate;
            string dateRangeText;

            switch(dateRange){
                case "day":
                    startDate=currentDate.Date;
                    endDate = currentDate.Date;
                    dateRangeText = $"Today, {startDate.ToString("MMM d", new CultureInfo("en-US"))}"; //CultureInfo 顯示英文月份名稱
                    break;
                case "week":
                    startDate=currentDate.Date.AddDays(-(int)currentDate.DayOfWeek);
                    endDate = currentDate.Date;
                    dateRangeText = $"{startDate.ToString("MMM d",new CultureInfo("en-US"))} - {endDate.ToString("MMM d", new CultureInfo("en-US"))}";
                    break;
                case "month":
                    startDate=new DateTime(currentDate.Year,currentDate.Month,1);
                    endDate = startDate.AddMonths(1).AddDays(-1);
                    dateRangeText = $"{startDate.ToString("MMMM yyyy", new CultureInfo("en-US"))}";
                    break;
                case "year":
                    startDate=new DateTime(currentDate.Year,1,1);
                    endDate = startDate.AddYears(1).AddDays(-1);
                    dateRangeText = $"{startDate.ToString("yyyy")}";
                    break;
                default:
                    startDate=currentDate.Date;
                    endDate = currentDate.Date;
                    dateRangeText = "Unknown Date Range";
                    break;
            }

            // 獲取要過濾的accountBookName
            string targetAccountBookName = accountBookName;

            // 在DB查找相對的account_book_id
            int targetAccountBookId = _dbcontext.AccountBooks
                .Where(ab => ab.account_book_name == targetAccountBookName)
                .Select(ab => ab.account_book_id)
                .FirstOrDefault();

            var startDateOnly = startDate.Date; // 只包含日期部分的 startDate
            var filtered = _dbcontext.Transactions
            .Include(t => t.category) //category是資料模型的導航屬性，Categories是資料表名
            .Include(t => t.account_book)
            .Where(t => t.category.category_type == categoryType && t.account_book_id == targetAccountBookId && t.transaction_status=="live" && t.transaction_date >= startDateOnly)//選擇所有日期大於或等於指定dateRange的資料， && t.transaction_date <= endDate
            .Select(t => new
            {
                CategoryName = t.category.category_name,
                CategoryType = t.category.category_type,
                Amount = t.amount,
                Day=t.transaction_date,
                Details=t.details,
                transaction_id=t.transaction_id,
                AccountBookName = t.account_book.account_book_name,
                AccountBookId = t.account_book.account_book_id
            })
            .ToList();

            //為了加入totalAmount，所以新增一個匿名類別集合，且每一筆資料的 TotalAmount 欄位都相同
            var totalAmount = filtered.Sum(t => t.Amount);
            var filteredWithTotal = filtered.Select(t => new
            {
                CategoryName = t.CategoryName,
                CategoryType = t.CategoryType,
                Amount = t.Amount,
                AccountBookName=t.AccountBookName,
                AccountBookId=t.AccountBookId,
                transaction_id=t.transaction_id,
                day=t.Day,
                details=t.Details,
                TotalAmount = totalAmount,
                DateRangeText = dateRangeText
            }).ToList();



            


            // 計算所有類別的匯總數據
            // var allCategoriesGroupedByCategory = _dbcontext.Transactions
            //     .Include(t => t.category)
            //     .Where(t => t.account_book_id == targetAccountBookId && t.transaction_status == "live")
            //     .GroupBy(t => new{t.category.category_type, t.category.category_name})
            //     .Select(group => new
            //     {
            //         CategoryType = group.Key.category_type,
            //         CategoryName = group.Key.category_name,
            //         //CategoryName = group.Key,
            //         TotalAmount = group.Sum(t => t.amount),
            //         TransactionCount = group.Count()
            //     })
            //     .GroupBy(group => group.CategoryType) // 第一层按照类型分组
            //     .Select(groupByType => new
            //     {
            //         CategoryType = groupByType.Key,
            //         Categories = groupByType
            //             .GroupBy(group => group.CategoryName) // 第二层按照类别名分组
            //             .Select(groupByCategory => new
            //             {
            //                 CategoryName = groupByCategory.Key,
            //                 TotalAmount = groupByCategory.Sum(item => item.TotalAmount),
            //                 TransactionCount = groupByCategory.Sum(item => item.TransactionCount)
            //             })
            //             .ToList()
            //     })
            //     .ToList();

            // var combinedData = new
            // {
            //     FilteredWithTotal = filteredWithTotal,
            //     AllCategoriesData = allCategoriesGroupedByTime
            // };

            //return Ok(combinedData);}}



        return Ok(filteredWithTotal);}}
}