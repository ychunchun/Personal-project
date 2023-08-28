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
using Personal_project;
using Microsoft.IdentityModel.Tokens;

namespace Personal_project.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MemberController : ControllerBase
    {
        private readonly Persnal_projectContext _dbcontext; 

        public MemberController(Persnal_projectContext dbcontext)
        {
            _dbcontext = dbcontext;
        }


        [HttpGet("MemberShareLink")]
        public IActionResult MemberShareLink(int AccountBookId)
        {
            // Generate and return the access token
            string AccountBookToken = GenerateAccessToken(AccountBookId);
            //Console.WriteLine(AccountBookToken);
            return Ok(new { AccountBookToken });
        }

        private string GenerateAccessToken(int accountBookId)
        {
            string secretKey = "99098741990987419909874199098741";
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));

            //簽名憑證
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim("accountBookId", accountBookId.ToString())
            };

            // 定義JWT
            var token = new JwtSecurityToken(
                issuer: "http://localhost:5108",
                audience: "http://localhost:5108",
                claims: claims,
                expires: DateTime.UtcNow.AddSeconds(36000),
                signingCredentials: credentials
            );

            // 生成JWT
            var tokenHandler = new JwtSecurityTokenHandler();
            var tokenString = tokenHandler.WriteToken(token);

            return tokenString;
        }
        
        [HttpPost("MemberStatus")]
        public async Task<ActionResult> MemberStatus([FromBody] MemberStatusDTO dto)
        {
            try
            {
                var member = await _dbcontext.Members
                    .FirstOrDefaultAsync(m => m.member_id == dto.MemberId);

                if (member != null)
                {
                    member.member_status = "delete";
                    await _dbcontext.SaveChangesAsync();

                    return Ok();
                }
                return NotFound();               
            }
            catch (Exception ex)
            {
                Console.WriteLine("Exception: " + ex.Message);
                return BadRequest(ex.Message);
            }
        }


    }
}
