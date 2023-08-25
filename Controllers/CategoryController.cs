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
        public async Task<IActionResult> GetCategories(string displayType)
        {
            var categoriesQuery = _dbcontext.Categories.AsQueryable();

            if (!string.IsNullOrEmpty(displayType))
            {
                categoriesQuery = categoriesQuery.Where(category => category.category_type == displayType);
            }

            var categories = await categoriesQuery
                .Select(category => new CategoryGetDto { category_name = category.category_name })
                .ToListAsync();

            return Ok(categories);
        }

        //////////新增category////////////
        [HttpPost("AddCategory")]
        public async Task<IActionResult> AddCategory(CategoryAddDto input)
        {
            var newCategory = new Categories
            {
                category_type = input.category_type,
                category_name = input.category_name,
            };

            _dbcontext.Categories.Add(newCategory);
            await _dbcontext.SaveChangesAsync();

            return Ok(newCategory);
        }
    }
}
