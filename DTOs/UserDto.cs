public class RegisterDto
{
    public string user_name { get; set; }
    public string email { get; set; }
    public string password { get; set; }
}

public class LoginDto
{
    public string email { get; set; }
    public string password { get; set; }
    public string provider { get; set; }
    // public string access_token { get; set; }
}

public class FacebookUserProfile
    {
        public string user_name { get; set; }
        public string email { get; set; }
        public string picture{get;set;}
    }