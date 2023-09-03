using Newtonsoft.Json;
using Personal_project.Models;

public class TransactionAddDto
{
    public string category_type { get; set; }
    public decimal amount { get; set; }
    public string category_name { get; set; }
    public DateTime transaction_date { get; set; }
    public string details { get; set; }
    public int user_id{get;set;}
    public string account_book_name { get; set; }
}

public class TransactionUpdateDto
{
    public int transactionId { get; set; }
    public string category_type { get; set; }
    public decimal amount { get; set; }
    public string category_name { get; set; }
    public DateTime transaction_date { get; set; }
    public string details { get; set; }
    public int user_id{get;set;}
    public string account_book_name { get; set; }
}

