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
    public class ChartController : ControllerBase
    {
        private readonly Persnal_projectContext _dbcontext; 

        public ChartController(Persnal_projectContext dbcontext)
        {
            _dbcontext = dbcontext;
        }


        //獲取特定帳本、特定類別類型、特定時間範圍下的transaction並進行分析
        [HttpGet("GetChartData")]
        public IActionResult GetChartData(string categoryType, string dateRange, string accountBookName)
        {

            //設定初始時間
            DateTime currentDate = DateTime.Now;
            DateTime startDate;
            DateTime endDate;

            // 根據 dateRange 設定 startDate 和 endDate
            switch(dateRange){
                case "day":
                    startDate=currentDate.Date;
                    endDate = currentDate.Date;
                    break;
                case "week":
                    startDate=currentDate.Date.AddDays(-(int)currentDate.DayOfWeek);
                    endDate = currentDate.Date;
                    break;
                case "month":
                    startDate=new DateTime(currentDate.Year,currentDate.Month,1);
                    endDate = startDate.AddMonths(1).AddDays(-1);
                    break;
                case "year":
                    startDate=new DateTime(currentDate.Year,1,1);
                    endDate = startDate.AddYears(1).AddDays(-1);
                    break;
                default:
                    startDate=currentDate.Date;
                    endDate = currentDate.Date;
                    break;
            }

            // 獲取要過濾的accountBookName
            string targetAccountBookName = accountBookName;

            // 在DB查找相對的account_book_id
            int targetAccountBookId = _dbcontext.AccountBooks
                .Where(ab => ab.account_book_name == targetAccountBookName)
                .Select(ab => ab.account_book_id)
                .FirstOrDefault();

            // 找到符合條件的transaction
            var filtered = _dbcontext.Transactions
            .Include(t => t.category) //category是資料模型的導航屬性，Categories是資料表名
            .Include(t => t.account_book)
            .Where(t => t.category.category_type == categoryType && t.account_book_id == targetAccountBookId && t.transaction_status == "live")//選擇所有日期大於或等於指定dateRange的資料， && t.transaction_date <= endDate  && t.transaction_date >= startDateOnly
            .Select(t => new
            {
                CategoryName = t.category.category_name,
                CategoryType = t.category.category_type,
                Amount = t.amount,
                Day = t.transaction_date,
                Details = t.details,
                transaction_id = t.transaction_id,
                AccountBookName = t.account_book.account_book_name,
                AccountBookId = t.account_book.account_book_id
            })
            .ToList();

            // 計算時間區間
            List<TimeSegment> timeSegments = CalculateTimeSegments(startDate, endDate, dateRange);

            // Prepare the final result
            List<object> result = new List<object>();
            foreach (var timeSegment in timeSegments)
            {

                // 計算每個區間的總金額
                int totalAmountInSegment = (int)filtered
                    .Where(t => t.Day >= timeSegment.StartDate && t.Day <= timeSegment.EndDate)
                    .Sum(t => t.Amount);

                var segmentData = new
                {
                    // 分析每個類別的金額與百分比
                    TimeGroup = GetFormattedTimeGroup(timeSegment.StartDate, timeSegment.EndDate, dateRange),
                    Categories = filtered
                        .Where(t => t.Day >= timeSegment.StartDate && t.Day <= timeSegment.EndDate)
                        .GroupBy(t => t.CategoryName)
                        .Select(group => new
                        {
                            CategoryName = group.Key,
                            TotalAmount = group.Sum(t => t.Amount),
                            Percentage = totalAmountInSegment == 0 ? "0%" : $"{(group.Sum(t => t.Amount) * 100) / totalAmountInSegment}%"
                        })
                        .ToList()
                };
                result.Add(segmentData);
            }

            return Ok(result);
        }


        // 新增 CalculateTimeSegments 方法
        private List<TimeSegment> CalculateTimeSegments(DateTime startDate, DateTime endDate, string dateRange)
        {
            List<TimeSegment> timeSegments = new List<TimeSegment>();

            // 計算時間區間，並添加到 timeSegments 列表中
            for (int i = 0; i < 5; i++)
            {
                timeSegments.Add(new TimeSegment
                {
                    StartDate = startDate,
                    EndDate = endDate
                });

                // 回朔先前的時間段
                switch (dateRange)
                {
                    case "day":
                        endDate = startDate.AddDays(-1);
                        startDate = endDate;
                        break;
                    case "week":
                        endDate = startDate.AddDays(-7);
                        startDate = endDate.AddDays(-6);
                        break;
                    case "month":
                        endDate = startDate.AddMonths(-1);
                        startDate = new DateTime(endDate.Year, endDate.Month, 1);
                        break;
                    case "year":
                        endDate = startDate.AddYears(-1);
                        startDate = new DateTime(endDate.Year, 1, 1);
                        break;
                    default:
                        endDate = startDate.AddDays(-1);
                        startDate = endDate;
                        break;
                } 
            }
            return timeSegments;
        }


        // 設定每個時間端的呈現方式
        private string GetFormattedTimeGroup(DateTime startDate, DateTime endDate, string dateRange)
        {
            string timeGroupFormat = "";
            CultureInfo englishCulture = new CultureInfo("en-US"); // 使用英文的 Culture

            switch (dateRange)
            {
                case "year":
                    timeGroupFormat = "yyyy"; // 只顯示年份
                    return startDate.ToString(timeGroupFormat, englishCulture);
                case "month":
                    timeGroupFormat = "MMM"; // 只顯示月份的縮寫，例如 "JUL", "AUG"
                    return startDate.ToString(timeGroupFormat, englishCulture);
                case "week":
                    timeGroupFormat = "MM/dd/yyyy"; // 顯示當週的第一天，例如 "08/01/2023"
                    return startDate.ToString(timeGroupFormat, englishCulture);
                case "day":
                    timeGroupFormat = "dd ddd"; // 顯示日期以及星期的縮寫，例如 "25 Fri"
                    return startDate.ToString(timeGroupFormat, englishCulture);
                default:
                    return $"{startDate} - {endDate}";
            }
        }



        // 定義 TimeSegment 類型
        public class TimeSegment
        {
            public DateTime StartDate { get; set; }
            public DateTime EndDate { get; set; }
        }
    }
}