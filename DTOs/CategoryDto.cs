public class CategoryAddDto
{
    public string category_type { get; set; }
    public string category_name { get; set; }
}

public class CategoryGetDto
{
    public string display_category_type { get; set; }
    public string category_name { get; set; }
}
