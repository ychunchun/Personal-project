using System;
using System.Collections.Generic;

namespace Personal_project.Models;

public partial class Notifications
{
    public int notification_id { get; set; }

    public int? transaction_id { get; set; }

    public DateTime? _current_time_ { get; set; }

    public string? operation_type { get; set; }

    public DateTime? current_time { get; set; }

    public string? account_book_name { get; set; }

    public string? user_name { get; set; }

    public string? category_name { get; set; }

    public string? category_type { get; set; }

    public int? amount { get; set; }

    public int? user_id { get; set; }

    public int? account_book_id { get; set; }

    public int? target { get; set; }

    public string? notification_status { get; set; }

    public virtual AccountBooks? account_book { get; set; }

    public virtual Transactions? transaction { get; set; }

    public virtual Users? user { get; set; }
}
