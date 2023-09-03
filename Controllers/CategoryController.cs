using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using Personal_project.Models;

namespace YourProjectName.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CategoryController : ControllerBase
    {
        private readonly Persnal_projectContext _dbcontext; 

        public CategoryController(Persnal_projectContext dbcontext)
        {
            _dbcontext = dbcontext;
        }

        //////////顯示category////////////
       [HttpGet("GetCategory")]
        public async Task<IActionResult> GetCategories(string? displayType, int accountBookId)
        {
            var query = _dbcontext.CategoryAndAccount
                .Where(caa => accountBookId <= 0 || caa.account_id == accountBookId) //如果不是空值，就接下去判斷。如果是空值就會跳出
                .Where(caa => caa.category_status == "live") ;

            // 只有在提供 displayType參數時，才會增加類別過濾條件，否則全部列出 
            if (!string.IsNullOrEmpty(displayType))
            {
                query = query.Where(caa => caa.category.category_type == displayType);
            }

            var categories = await query
                .Select(caa => new CategoryGetDto
                {
                    display_category_type = caa.category.category_type,
                    category_name = caa.category.category_name
                })
        .ToListAsync();
            return Ok(categories);
        }

        //////////新增category////////////
        [HttpPost("AddCategory")]
        public async Task<IActionResult> AddCategory(CategoryAddDto input)
        {
            if (input == null)
            {
                return BadRequest("無效輸入");
            }

            //創建新的category紀錄
            var newCategory = new Categories
            {
                category_type = input.category_type,
                category_name = input.category_name,
            };

            _dbcontext.Categories.Add(newCategory);
            await _dbcontext.SaveChangesAsync();

            //創建新的CategoryAndAccount紀錄
             var newCategoryAndAccount = new CategoryAndAccount
            {
                category_id = newCategory.category_id, 
                account_id = input.account_book_id,
                category_status="live"
            };

            _dbcontext.CategoryAndAccount.Add(newCategoryAndAccount);
            await _dbcontext.SaveChangesAsync();

            return Ok(newCategory);
        }
    }
}
