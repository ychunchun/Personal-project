using System;
using System.Collections.Generic;

namespace Personal_project.Models;

public partial class History
{
    public int history_id { get; set; }

    public int? transaction_id { get; set; }

    public string? operation_type { get; set; }

    public DateTime? operation_date { get; set; }

    public int? user_id { get; set; }

    public int? account_book_id { get; set; }

    public virtual AccountBooks? account_book { get; set; }

    public virtual Transactions? transaction { get; set; }

    public virtual Users? user { get; set; }
}
