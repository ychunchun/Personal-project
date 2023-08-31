using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;
using Personal_project.Models; 
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Cryptography;
using Newtonsoft.Json;
using Microsoft.AspNet.SignalR;
using System.Security.Claims;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace YourProject.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly Persnal_projectContext _dbcontext; 

        public UserController(Persnal_projectContext dbcontext)
        {
            _dbcontext = dbcontext;
        }

///////////////註冊//////////////////
        [HttpPost("register")]
        public IActionResult Register(RegisterDto input)
        {
            // Check if email already exists
            if (_dbcontext.Users.Any(u => u.email == input.email))
            {
                return BadRequest(new { message = "Email already exists" });
            }

            try
            {
                // Create a new user object with the provided data
                Users user = new Users
                {
                    user_name = input.user_name,
                    email = input.email,
                    password = HashPassword(input.password),
                    provider = "native",
                    // picture = "https://example.com/path/to/picture.png"
                };

                _dbcontext.Users.Add(user);
                _dbcontext.SaveChanges();

                // Generate and return the access token
                string accessToken = GenerateAccessToken(user.email);

                var response = new
                {
                    data = new
                    {
                        access_token = accessToken,
                        access_expired = 36000,
                        user = new
                        {
                            id = user.user_id,
                            user_name = user.user_name,
                            email = user.email,
                            // picture = user.picture
                        }
                    }
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Failed to create user" });
            }
        }

///////////////登入//////////////////
        [HttpPost("login")]
        public IActionResult Login(LoginDto input)
        {   
            if (input.provider.ToLower() == "native")
            {
                // Check if email and password match
                var user = _dbcontext.Users.SingleOrDefault(u => u.email == input.email && u.password == HashPassword(input.password));
                if (user == null)
                {
                    return BadRequest(new { message = "Invalid email or password" });
                }

                // Generate and return the access token
                string accessToken = GenerateAccessToken(user.email);

                //根據accountbookId在DB找相關的user
                var identity = HttpContext.User.Identity as ClaimsIdentity; 
                var accountbookIdClaim=identity?.FindFirst("accountBookId"); //如果沒有token要怎麼辦，是空的！
                //Console.WriteLine("New Member Created:", accountbookIdClaim);
                //string accountbookId = accountbookIdClaim.Value; // 獲取 accountbookId 的值 

                // user_id是否在Members當中
                //var exsitingMembers = _dbcontext.Members.SingleOrDefault(m => m.user_id == user.user_id && m.account_book_id == int.Parse(accountbookId));
                //如果有接收到關於accountbook的Id，就給user相對的共享帳本
                if(accountbookIdClaim!=null ){ //&& exsitingMembers==null
                    string accountbookId = accountbookIdClaim.Value; // 獲取 accountbookId 的值
                    Console.WriteLine("New Member Created:", accountbookId);

                    // 將關聯寫入Members table
                    var newMember = new Members
                    {
                        account_book_id = int.Parse(accountbookId),
                        user_id = user.user_id,
                        role = "editor",
                        member_status="live"
                    };
                    _dbcontext.Members.Add(newMember);
                    _dbcontext.SaveChanges();
                }

                // Check if the user_id exists in AccounBooks
                var exsitingAccountBook=_dbcontext.AccountBooks.SingleOrDefault(ab=>ab.user_id==user.user_id && ab.account_book_type == "main");
                if(exsitingAccountBook==null){
                    //Create a new AccountBook record
                    var newAccountBook=new AccountBooks{
                        user_id=user.user_id,
                        account_book_name="Main",
                        account_book_type="main",
                        account_book_status="live",
                        initial_balance=0,
                    };
                    _dbcontext.AccountBooks.Add(newAccountBook);
                    _dbcontext.SaveChanges();

                    //Use the newly generated id for Members record
                    var newMember=new Members{
                        account_book_id=newAccountBook.account_book_id,
                        user_id=user.user_id,
                        role="admin",
                        member_status="live"
                    };
                    _dbcontext.Members.Add(newMember);
                    _dbcontext.SaveChanges();
                }

                

                var response = new
                {
                    data = new
                    {
                        access_token = accessToken,
                        access_expired = 36000,
                        user = new
                        {
                            user_id = user.user_id,
                            provider = user.provider,
                            user_name = user.user_name,
                            email = user.email,
                            // picture = user.picture
                        }
                    }
                };

                return Ok(response);
            }
            else if (input.provider.ToLower() == "facebook")
            {
            }
            return BadRequest(new { message = "Failed to retrieve Facebook user profile" });
        }
                // var accessToken = input.access_token;

                // // 發http
                // var httpClient = new HttpClient();
                // var response = httpClient.GetAsync($"https://graph.facebook.com/me?fields=name,email&access_token={accessToken}").Result;
                // if (response.IsSuccessStatusCode)
                // {
                //     // 解析 JSON
                //     var json = response.Content.ReadAsStringAsync().Result;
                //     var profile = JsonConvert.DeserializeObject<FacebookUserProfile>(json);

                //     if (profile != null)
                //     {
                //         var existingUser = _dbcontext.Users.SingleOrDefault(u => u.email == profile.email);
                //         if (existingUser != null)
                //         {
                //             string existingUserAccessToken = GenerateAccessToken(existingUser.email);
                //             var existingUserResponse = new
                //             {
                //                 data = new
                //                 {
                //                     access_token = existingUserAccessToken,
                //                     access_expired = 3600,
                //                     user = new
                //                     {
                //                         user_id = existingUser.user_id,
                //                         provider = existingUser.provider,
                //                         user_name = existingUser.user_name,
                //                         email = existingUser.email,
                //                         // picture = existingUser.picture
                //                     }
                //                 }
                //             };

                //             return Ok(existingUserResponse);
                //         }
                //         else
                //         {
                //             string randomPassword = GenerateRandomPassword(8);
                //             var newUser = new Users
                //             {
                //                 provider = "facebook",
                //                 user_name = profile.user_name,
                //                 email = profile.email,
                //                 // picture = profile.picture,
                //                 password = HashPassword(randomPassword)
                //             };

                //            _dbcontext.Users.Add(newUser);
                //             _dbcontext.SaveChanges();

                //             string newUserAccessToken = GenerateAccessToken(newUser.email);
                //             var newUserResponse = new
                //             {
                //                 data = new
                //                 {
                //                     access_token = newUserAccessToken,
                //                     access_expired = 3600,
                //                     user = new
                //                     {
                //                         user_id = newUser.user_id,
                //                         provider = newUser.provider,
                //                         user_name = newUser.user_name,
                //                         email = newUser.email,
                //                         // picture = newUser.picture
                //                     }
                //                 }
                //             };

                //             return Ok(newUserResponse);
                //         }
                //     }
                //     else
                //     {
                //         return BadRequest(new { message = "Failed to retrieve Facebook user profile" });
                //     }
                // }
                // else
                // {
                //     return BadRequest(new { message = "Failed to retrieve Facebook user profile" });
                // }
           

        [Authorize] //經過驗證的user
        [HttpGet("userprofile")]
        public IActionResult GetUserProfile()
        {
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

            var response = new
            {
                data = new
                {
                    user_id = user.user_id,
                    provider = user.provider,
                    name = user.user_name,
                    email = user.email,
                    // picture = user.picture
                }
            };

            return Ok(response);
        }


        private string GenerateAccessToken(string email)
        {
            string secretKey = "99098741990987419909874199098741";
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));

            //簽名憑證
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.Email, email)
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

        private string GenerateRandomPassword(int length)
        {
            const string validChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
            var random = new Random();
            var password = new StringBuilder(length);
            for (int i = 0; i < length; i++)
            {
                password.Append(validChars[random.Next(validChars.Length)]);
            }
            return password.ToString();
        }


        private string HashPassword(string Password)
        {
            using (var sha256 = SHA256.Create())
            {
                var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(Password));
                return BitConverter.ToString(hashedBytes).Replace("-", "").ToLower();
            }
        }
    }
}