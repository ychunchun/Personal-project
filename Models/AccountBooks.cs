using System;
using System.Collections.Generic;

namespace Personal_project.Models;

public partial class AccountBooks
{
    public int account_book_id { get; set; }

    public string? account_book_name { get; set; }

    public string? account_book_type { get; set; }

    public int? initial_balance { get; set; }

    public string? account_book_status { get; set; }

    public int? user_id { get; set; }

    public virtual ICollection<CategoryAndAccount> CategoryAndAccount { get; set; } = new List<CategoryAndAccount>();

    public virtual ICollection<History> History { get; set; } = new List<History>();

    public virtual ICollection<Members> Members { get; set; } = new List<Members>();

    public virtual ICollection<Notifications> Notifications { get; set; } = new List<Notifications>();

    public virtual ICollection<Transactions> Transactions { get; set; } = new List<Transactions>();

    public virtual Users? user { get; set; }
}
