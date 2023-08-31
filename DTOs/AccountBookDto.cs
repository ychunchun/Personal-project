public class AccountBookDTO
{
    public int AccountBookId { get; set; }
    public string AccountBookName { get; set; }
    public string AccountBookType { get; set; }
    public int? InitialBalance { get; set; }
    public int? Profit { get; set; }
    public int? AdminUser { get; set; }
    public List<MemberRoleAndUserNameDTO> Members { get; set; }
}

public class AccountBookAddDTO
{
    public string AccountBookName { get; set; }
    public int? InitialBalance { get; set; }
}

public class AccountBookStatusDTO
{
    public int? AccountBookId { get; set; }
}

public class MemberRoleAndUserNameDTO
{
    public string Role { get; set; } 
    public string UserName { get; set; } 
    public int MemberId { get; set; }
}