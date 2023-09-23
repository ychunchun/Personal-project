using System;
using System.Collections.Generic;

namespace Personal_project.Models;

public partial class Categories
{
    public int category_id { get; set; }

    public string? category_name { get; set; }

    public string? category_type { get; set; }

    public virtual ICollection<CategoryAndAccount> CategoryAndAccount { get; set; } = new List<CategoryAndAccount>();

    public virtual ICollection<Transactions> Transactions { get; set; } = new List<Transactions>();
}
