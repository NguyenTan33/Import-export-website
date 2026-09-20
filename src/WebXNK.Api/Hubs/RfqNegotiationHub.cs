using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace WebXNK.Api.Hubs;

[Authorize]
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

    public async Task SendMessageToRfq(long rfqId, string message, decimal? proposedTotal)
    {
        var senderName = Context.User?.Identity?.Name ?? "User";
        await Clients.Group(GetGroupName(rfqId)).SendAsync("ReceiveRfqMessage", new
        {
            RfqId = rfqId,
            Sender = senderName,
            Message = message,
            ProposedTotal = proposedTotal,
            Timestamp = DateTime.UtcNow
        });
    }

    private static string GetGroupName(long rfqId) => $"rfq_{rfqId}";
}
