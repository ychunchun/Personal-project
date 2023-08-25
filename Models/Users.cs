using System;
using System.Collections.Generic;

namespace Personal_project.Models;

public partial class Users
{
    public int user_id { get; set; }

    public string? user_name { get; set; }

    public string? email { get; set; }

    public string? password { get; set; }

    public string? provider { get; set; }

    public virtual ICollection<AccountBooks> AccountBooks { get; set; } = new List<AccountBooks>();

    public virtual ICollection<History> History { get; set; } = new List<History>();

    public virtual ICollection<Members> Members { get; set; } = new List<Members>();

    public virtual ICollection<Notifications> Notifications { get; set; } = new List<Notifications>();

    public virtual ICollection<Transactions> Transactions { get; set; } = new List<Transactions>();
}
