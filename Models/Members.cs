using System;
using System.Collections.Generic;

namespace Personal_project.Models;

public partial class Members
{
    public int member_id { get; set; }

    public int? account_book_id { get; set; }

    public int? user_id { get; set; }

    public string? role { get; set; }

    public virtual AccountBooks? account_book { get; set; }

    public virtual Users? user { get; set; }
}
