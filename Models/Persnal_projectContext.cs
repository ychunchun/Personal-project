using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace Personal_project.Models;

public partial class Persnal_projectContext : DbContext
{
    public Persnal_projectContext(DbContextOptions<Persnal_projectContext> options)
        : base(options)
    {
    }

    public virtual DbSet<AccountBooks> AccountBooks { get; set; }

    public virtual DbSet<Categories> Categories { get; set; }

    public virtual DbSet<History> History { get; set; }

    public virtual DbSet<Members> Members { get; set; }

    public virtual DbSet<Notifications> Notifications { get; set; }

    public virtual DbSet<Transactions> Transactions { get; set; }

    public virtual DbSet<Users> Users { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AccountBooks>(entity =>
        {
            entity.HasKey(e => e.account_book_id).HasName("PK__AccountB__89A772AA58C8701F");

            entity.Property(e => e.account_book_name).HasMaxLength(255);
            entity.Property(e => e.account_book_status).HasMaxLength(100);
            entity.Property(e => e.account_book_type).HasMaxLength(255);

            entity.HasOne(d => d.user).WithMany(p => p.AccountBooks)
                .HasForeignKey(d => d.user_id)
                .HasConstraintName("AccountBooks_FK");
        });

        modelBuilder.Entity<Categories>(entity =>
        {
            entity.HasKey(e => e.category_id).HasName("PK__Categori__D54EE9B4DEFB021C");

            entity.Property(e => e.category_name).HasMaxLength(255);
            entity.Property(e => e.category_type)
                .HasMaxLength(255)
                .IsUnicode(false);
        });

        modelBuilder.Entity<History>(entity =>
        {
            entity.HasKey(e => e.history_id).HasName("PK__History__096AA2E9F63F8FCD");

            entity.Property(e => e.operation_date).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.operation_type).HasMaxLength(50);

            entity.HasOne(d => d.account_book).WithMany(p => p.History)
                .HasForeignKey(d => d.account_book_id)
                .HasConstraintName("FK_History_AccountBooks");

            entity.HasOne(d => d.transaction).WithMany(p => p.History)
                .HasForeignKey(d => d.transaction_id)
                .HasConstraintName("FK__History__transac__46E78A0C");

            entity.HasOne(d => d.user).WithMany(p => p.History)
                .HasForeignKey(d => d.user_id)
                .HasConstraintName("History_FK");
        });

        modelBuilder.Entity<Members>(entity =>
        {
            entity.HasKey(e => e.member_id).HasName("PK__Members__B29B853445EDF7CA");

            entity.Property(e => e.member_status).HasMaxLength(100);
            entity.Property(e => e.role).HasMaxLength(50);

            entity.HasOne(d => d.account_book).WithMany(p => p.Members)
                .HasForeignKey(d => d.account_book_id)
                .HasConstraintName("FK__Members__account__4222D4EF");

            entity.HasOne(d => d.user).WithMany(p => p.Members)
                .HasForeignKey(d => d.user_id)
                .HasConstraintName("FK__Members__user_id__4316F928");
        });

        modelBuilder.Entity<Notifications>(entity =>
        {
            entity.HasKey(e => e.notification_id).HasName("PK__Notifica__E059842F8A4AD3C1");

            entity.Property(e => e._current_time_)
                .HasDefaultValueSql("(getdate())")
                .HasColumnName("[current_time]");
            entity.Property(e => e.account_book_name).HasMaxLength(100);
            entity.Property(e => e.category_name).HasMaxLength(100);
            entity.Property(e => e.category_type).HasMaxLength(100);
            entity.Property(e => e.current_time).HasColumnType("datetime");
            entity.Property(e => e.notification_status).HasMaxLength(100);
            entity.Property(e => e.operation_type).HasMaxLength(50);
            entity.Property(e => e.user_name).HasMaxLength(100);

            entity.HasOne(d => d.account_book).WithMany(p => p.Notifications)
                .HasForeignKey(d => d.account_book_id)
                .HasConstraintName("FK_Notifications_AccountBooks");

            entity.HasOne(d => d.transaction).WithMany(p => p.Notifications)
                .HasForeignKey(d => d.transaction_id)
                .HasConstraintName("FK__Notificat__trans__4CA06362");

            entity.HasOne(d => d.user).WithMany(p => p.Notifications)
                .HasForeignKey(d => d.user_id)
                .HasConstraintName("Notifications_FK");
        });

        modelBuilder.Entity<Transactions>(entity =>
        {
            entity.HasKey(e => e.transaction_id).HasName("PK__Transact__85C600AF4E236FB6");

            entity.Property(e => e.details).HasMaxLength(255);
            entity.Property(e => e.transaction_date).HasColumnType("datetime");
            entity.Property(e => e.transaction_status).HasMaxLength(100);

            entity.HasOne(d => d.account_book).WithMany(p => p.Transactions)
                .HasForeignKey(d => d.account_book_id)
                .HasConstraintName("FK__Transacti__accou__3D5E1FD2");

            entity.HasOne(d => d.category).WithMany(p => p.Transactions)
                .HasForeignKey(d => d.category_id)
                .HasConstraintName("FK__Transacti__categ__3F466844");

            entity.HasOne(d => d.user).WithMany(p => p.Transactions)
                .HasForeignKey(d => d.user_id)
                .HasConstraintName("FK__Transacti__user___3E52440B");
        });

        modelBuilder.Entity<Users>(entity =>
        {
            entity.HasKey(e => e.user_id).HasName("PK__Users__B9BE370FCCB37135");

            entity.Property(e => e.email).HasMaxLength(255);
            entity.Property(e => e.password).HasMaxLength(255);
            entity.Property(e => e.provider).HasMaxLength(50);
            entity.Property(e => e.user_name).HasMaxLength(255);
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
