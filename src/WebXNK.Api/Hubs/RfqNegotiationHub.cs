using Microsoft.AspNetCore.SignalR;

namespace WebXNK.Api.Hubs;

/// <summary>
/// WebSocket SignalR Hub phục vụ kênh thương lượng báo giá thời gian thực giữa Sales và Khách nhập khẩu (EXP-53).
/// Tương thích 100% với cả frontend React/Next.js (/hubs/negotiation) và API backend chuẩn (/hubs/rfq-negotiation).
/// </summary>
public class RfqNegotiationHub : Hub
{
    public async Task JoinRfqGroup(long rfqId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, GetGroupName(rfqId));
        await Clients.Caller.SendAsync("JoinedRfqGroup", rfqId);
    }

    public async Task LeaveRfqGroup(long rfqId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, GetGroupName(rfqId));
        await Clients.Caller.SendAsync("LeftRfqGroup", rfqId);
    }

    // Tương thích với frontend invoke: connection.invoke("JoinRfqRoom", rfqId.toString())
    public async Task JoinRfqRoom(string rfqId)
    {
        if (long.TryParse(rfqId, out var id))
        {
            await JoinRfqGroup(id);
        }
        else
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"rfq_{rfqId}");
        }
    }

    public async Task LeaveRfqRoom(string rfqId)
    {
        if (long.TryParse(rfqId, out var id))
        {
            await LeaveRfqGroup(id);
        }
        else
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"rfq_{rfqId}");
        }
    }

    public async Task SendMessageToRfq(long rfqId, string message, decimal? proposedTotal)
    {
        var senderName = Context.User?.Identity?.Name ?? "User";
        var isStaff = Context.User?.IsInRole("Admin_Super") == true || Context.User?.IsInRole("Sales_Executive") == true;
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

        // Broadcast đến cả 2 kênh sự kiện để tương thích mọi client
        await Clients.Group(GetGroupName(rfqId)).SendAsync("ReceiveRfqMessage", payload);

        await Clients.Group(GetGroupName(rfqId)).SendAsync("ReceiveNegotiationMessage", new
        {
            id = $"m_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}",
            sender = isStaff ? "SALES" : "BUYER",
            senderName,
            senderRole = isStaff ? "Chuyên viên Kinh doanh Quốc tế" : "Đại diện Thu mua (Buyer)",
            content = message,
            timestamp = DateTime.UtcNow.ToString("HH:mm")
        });
    }

    public async Task SendNegotiationMessage(long rfqId, string content, object? counterOffer = null)
    {
        var senderName = Context.User?.Identity?.Name ?? "User";
        var isStaff = Context.User?.IsInRole("Admin_Super") == true || Context.User?.IsInRole("Sales_Executive") == true;

        var chatMessage = new
        {
            id = $"m_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}",
            sender = isStaff ? "SALES" : "BUYER",
            senderName,
            senderRole = isStaff ? "Chuyên viên Kinh doanh Quốc tế" : "Đại diện Thu mua (Buyer)",
            content,
            counterOffer,
            timestamp = DateTime.UtcNow.ToString("HH:mm")
        };

        await Clients.Group(GetGroupName(rfqId)).SendAsync("ReceiveNegotiationMessage", chatMessage);
        await Clients.Group(GetGroupName(rfqId)).SendAsync("ReceiveRfqMessage", new
        {
            RfqId = rfqId,
            Sender = senderName,
            Message = content,
            Timestamp = DateTime.UtcNow
        });
    }

    private static string GetGroupName(long rfqId) => $"rfq_{rfqId}";
}
