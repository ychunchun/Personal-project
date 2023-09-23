public class CategoryAddDto
{
    public string category_type { get; set; }
    public string category_name { get; set; }
    public int account_book_id { get; set; }
}

public class CategoryGetDto
{
    public string? display_category_type { get; set; }
    public string category_name { get; set; }
    public int category_and_account_id { get; set; }
    public string? accountBookName { get; set; }
}

public class CategoryStatusDTO
{
    public int? category_and_account_id { get; set; }
}
