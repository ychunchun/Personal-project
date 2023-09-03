using System;
using System.Collections.Generic;

namespace Personal_project.Models;

public partial class CategoryAndAccount
{
    public int? category_id { get; set; }

    public int? account_id { get; set; }

    public int category_and_account_id { get; set; }

    public string? category_status { get; set; }

    public virtual ICollection<Transactions> Transactions { get; set; } = new List<Transactions>();

    public virtual AccountBooks? account { get; set; }

    public virtual Categories? category { get; set; }
}
