using System;
using System.Collections.Generic;

namespace Personal_project.Models;

public partial class Transactions
{
    public int transaction_id { get; set; }

    public int? account_book_id { get; set; }

    public int? user_id { get; set; }

    public int? category_id { get; set; }

    public DateTime? transaction_date { get; set; }

    public string? details { get; set; }

    public int? amount { get; set; }

    public string? transaction_status { get; set; }

    public virtual ICollection<History> History { get; set; } = new List<History>();

    public virtual ICollection<Notifications> Notifications { get; set; } = new List<Notifications>();

    public virtual AccountBooks? account_book { get; set; }

    public virtual Categories? category { get; set; }

    public virtual Users? user { get; set; }
}
