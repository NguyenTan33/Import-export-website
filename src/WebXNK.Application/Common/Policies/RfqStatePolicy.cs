namespace WebXNK.Application.Common.Policies;

public interface IRfqStatePolicy
{
    bool CanTransition(string currentStatus, string targetStatus);
    void EnsureCanTransition(string currentStatus, string targetStatus);
    string SuggestContainerType(decimal totalCbm);
}

public class RfqStatePolicy : IRfqStatePolicy
{
    private static readonly Dictionary<string, HashSet<string>> AllowedTransitions = new()
    {
        ["SUBMITTED"] = new() { "QUOTED", "REJECTED", "CANCELLED" },
        ["QUOTED"] = new() { "ACCEPTED", "REVISED", "EXPIRED", "REJECTED" },
        ["REVISED"] = new() { "QUOTED", "REJECTED" },
        ["ACCEPTED"] = new() { "DEPOSIT_PAID", "IN_PRODUCTION", "CANCELLED" },
        ["DEPOSIT_PAID"] = new() { "IN_PRODUCTION" },
        ["IN_PRODUCTION"] = new() { "SHIPPED" },
        ["SHIPPED"] = new() { "COMPLETED" }
    };

    public bool CanTransition(string currentStatus, string targetStatus)
    {
        var cur = currentStatus.Trim().ToUpperInvariant();
        var target = targetStatus.Trim().ToUpperInvariant();

        if (cur == target) return true;

        return AllowedTransitions.TryGetValue(cur, out var allowed) && allowed.Contains(target);
    }

    public void EnsureCanTransition(string currentStatus, string targetStatus)
    {
        if (!CanTransition(currentStatus, targetStatus))
        {
            throw new InvalidOperationException($"Chuyển đổi trạng thái không hợp lệ: Không thể chuyển từ '{currentStatus}' sang '{targetStatus}'.");
        }
    }

    public string SuggestContainerType(decimal totalCbm)
    {
        if (totalCbm <= 15) return "LCL (Less than Container Load - Đi ghép hàng lẻ)";
        if (totalCbm <= 28) return "1x 20ft General Purpose Container (~28 CBM)";
        if (totalCbm <= 58) return "1x 40ft General Purpose Container (~58 CBM)";
        if (totalCbm <= 68) return "1x 40ft High Cube Container (~68 CBM)";

        int cont40Count = (int)Math.Floor(totalCbm / 65);
        return $"{cont40Count}x 40ft HC Container + Hàng lẻ hoặc Container bổ sung";
    }
}
