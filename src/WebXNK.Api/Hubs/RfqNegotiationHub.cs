using System.Collections.Concurrent;
using Microsoft.AspNetCore.SignalR;

namespace WebXNK.Api.Hubs;

/// <summary>
/// WebSocket SignalR Hub phục vụ kênh thương lượng báo giá thời gian thực giữa Sales và Khách nhập khẩu (EXP-53).
/// Tương thích 100% với cả frontend React/Next.js (/hubs/negotiation) và API backend chuẩn (/hubs/rfq-negotiation).
/// </summary>
public class RfqNegotiationHub : Hub
{
    // Lưu trữ lịch sử tin nhắn đàm phán trong bộ nhớ theo RFQ để khi Admin/Buyer mở phòng chat sẽ thấy toàn bộ trao đổi trước đó
    private static readonly ConcurrentDictionary<string, List<object>> _chatHistories = new();

    public async Task JoinRfqGroup(long rfqId)
    {
        var groupName = GetGroupName(rfqId);
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
        await Clients.Caller.SendAsync("JoinedRfqGroup", rfqId);

        // Gửi toàn bộ lịch sử tin nhắn đàm phán đã có cho bên mới kết nối
        if (_chatHistories.TryGetValue(groupName, out var history) && history.Count > 0)
        {
            await Clients.Caller.SendAsync("LoadChatHistory", history);
        }
    }

    public async Task LeaveRfqGroup(long rfqId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, GetGroupName(rfqId));
        await Clients.Caller.SendAsync("LeftRfqGroup", rfqId);
    }

    // Tương thích với frontend invoke: connection.invoke("JoinRfqRoom", rfqId.toString())
    public async Task JoinRfqRoom(string rfqId)
    {
        var groupKey = long.TryParse(rfqId, out var id) ? GetGroupName(id) : $"rfq_{rfqId}";
        await Groups.AddToGroupAsync(Context.ConnectionId, groupKey);

        if (_chatHistories.TryGetValue(groupKey, out var history) && history.Count > 0)
        {
            await Clients.Caller.SendAsync("LoadChatHistory", history);
        }
    }

    public async Task LeaveRfqRoom(string rfqId)
    {
        var groupKey = long.TryParse(rfqId, out var id) ? GetGroupName(id) : $"rfq_{rfqId}";
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupKey);
    }

    public async Task SendMessageToRfq(long rfqId, string message, decimal? proposedTotal)
    {
        var isStaff = Context.User?.IsInRole("Admin_Super") == true || Context.User?.IsInRole("Sales_Executive") == true;
        var senderName = Context.User?.Identity?.Name ?? (isStaff ? "Chuyên viên Kinh Doanh" : "Khách Hàng Doanh Nghiệp");
        var senderRole = isStaff ? "Sales_Executive" : "Buyer";

        var payload = new
        {
            RfqId = rfqId,
            Sender = senderName,
            SenderRole = senderRole,
            Message = message,
            ProposedTotal = proposedTotal,
            Timestamp = DateTime.UtcNow
        };

        var chatMessage = new
        {
            id = $"m_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}",
            sender = isStaff ? "SALES" : "BUYER",
            senderName,
            senderRole = isStaff ? "Chuyên viên Kinh doanh Quốc tế" : "Đại diện Thu mua (Buyer)",
            content = message,
            timestamp = DateTime.UtcNow.ToString("HH:mm")
        };

        SaveMessageToHistory(GetGroupName(rfqId), chatMessage);

        await Clients.Group(GetGroupName(rfqId)).SendAsync("ReceiveRfqMessage", payload);
        await Clients.Group(GetGroupName(rfqId)).SendAsync("ReceiveNegotiationMessage", chatMessage);
    }

    public async Task SendNegotiationMessage(long rfqId, string content, object? counterOffer = null, string? clientSender = null, string? clientSenderName = null)
    {
        var isStaff = Context.User?.IsInRole("Admin_Super") == true ||
                      Context.User?.IsInRole("Sales_Executive") == true ||
                      string.Equals(clientSender, "SALES", StringComparison.OrdinalIgnoreCase);

        var senderName = !string.IsNullOrWhiteSpace(clientSenderName)
            ? clientSenderName
            : (Context.User?.Identity?.Name ?? (isStaff ? "Chuyên viên Kinh doanh Quốc tế" : "Đại diện Thu mua (Buyer)"));

        var chatMessage = new
        {
            id = $"m_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}",
            sender = isStaff ? "SALES" : "BUYER",
            senderName,
            senderRole = isStaff ? "Chuyên viên Kinh doanh Quốc tế - Quang Tấn Hoàng" : "Đại diện Thu mua (Buyer)",
            content,
            counterOffer,
            timestamp = DateTime.UtcNow.ToString("HH:mm")
        };

        SaveMessageToHistory(GetGroupName(rfqId), chatMessage);

        await Clients.Group(GetGroupName(rfqId)).SendAsync("ReceiveNegotiationMessage", chatMessage);
        await Clients.Group(GetGroupName(rfqId)).SendAsync("ReceiveRfqMessage", new
        {
            RfqId = rfqId,
            Sender = senderName,
            Message = content,
            Timestamp = DateTime.UtcNow
        });
    }

    private static void SaveMessageToHistory(string groupName, object message)
    {
        var list = _chatHistories.GetOrAdd(groupName, _ => new List<object>());
        lock (list)
        {
            list.Add(message);
            if (list.Count > 100) list.RemoveAt(0); // Giới hạn 100 tin nhắn gần nhất
        }
    }

    private static string GetGroupName(long rfqId) => $"rfq_{rfqId}";
}
