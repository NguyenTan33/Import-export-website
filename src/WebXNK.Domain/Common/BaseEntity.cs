namespace WebXNK.Domain.Common;

public abstract class BaseEntity<TId>
{
    public TId Id { get; set; } = default!;
}

public interface IAuditableEntity
{
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public interface ISoftDeletable
{
    public bool IsDeleted { get; set; }
}
