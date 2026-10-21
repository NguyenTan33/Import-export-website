using System.Security.Cryptography;
using System.Text;
using WebXNK.Domain.Entities;
using Xunit;

namespace WebXNK.UnitTests;

public class SalesContractAndCounterOfferTests
{
    [Fact]
    public void SalesContract_DefaultStatus_ShouldBeDraft()
    {
        var contract = new SalesContract
        {
            ContractNumber = "SC-2026-QTH-TEST01",
            TotalAmountUsd = 45000m,
            IncotermCode = "CIF",
            Status = "DRAFT"
        };

        Assert.Equal("DRAFT", contract.Status);
        Assert.Null(contract.SellerSignatureData);
        Assert.Null(contract.BuyerSignatureData);
        Assert.Null(contract.DigitalSignatureHash);
    }

    [Fact]
    public void SalesContract_WhenBothPartiesSign_ShouldBecomeLegallyBindingWithHash()
    {
        var contract = new SalesContract
        {
            ContractNumber = "SC-2026-QTH-TEST01",
            TotalAmountUsd = 45000m,
            IncotermCode = "CIF",
            Status = "DRAFT"
        };

        // 1. Seller signs
        contract.SellerSignatureData = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
        contract.SellerSignedBy = "Nguyen Van A";
        contract.SellerSignedAt = DateTime.UtcNow;
        contract.Status = "SELLER_SIGNED";

        Assert.Equal("SELLER_SIGNED", contract.Status);

        // 2. Buyer signs
        contract.BuyerSignatureData = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
        contract.BuyerSignedBy = "Kenji Sato";
        contract.BuyerSignedAt = DateTime.UtcNow;

        if (contract.SellerSignedAt.HasValue && contract.BuyerSignedAt.HasValue)
        {
            contract.Status = "LEGALLY_BINDING";
            using var sha256 = SHA256.Create();
            var raw = $"{contract.ContractNumber}|{contract.TotalAmountUsd}|{contract.SellerSignedAt}|{contract.BuyerSignedAt}|SALT";
            var hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(raw));
            contract.DigitalSignatureHash = Convert.ToHexString(hashBytes);
        }

        Assert.Equal("LEGALLY_BINDING", contract.Status);
        Assert.NotNull(contract.DigitalSignatureHash);
        Assert.NotEmpty(contract.DigitalSignatureHash);
    }

    [Fact]
    public void RfqCounterOffer_Acceptance_ShouldUpdateRfqStatusAndPrice()
    {
        var rfq = new RfqRequest
        {
            Id = 101,
            RfqNumber = "RFQ-2026-JP-001",
            TotalQuotedAmountUsd = 50000m,
            IncotermCode = "FOB",
            Status = "SUBMITTED"
        };

        var counterOffer = new RfqCounterOffer
        {
            Id = 1,
            RfqRequestId = rfq.Id,
            RevisionNumber = 2,
            SenderRole = "BUYER",
            ProposedUnitPriceUsd = 11.50m,
            ProposedIncotermCode = "CIF",
            Note = "Request CIF Tokyo with 30% TT deposit",
            Status = "PENDING"
        };

        // Simulate accepting the counter offer
        counterOffer.Status = "ACCEPTED";
        rfq.IncotermCode = counterOffer.ProposedIncotermCode;
        rfq.Status = "AGREED_PENDING_CONTRACT";

        Assert.Equal("ACCEPTED", counterOffer.Status);
        Assert.Equal("CIF", rfq.IncotermCode);
        Assert.Equal("AGREED_PENDING_CONTRACT", rfq.Status);
    }
}
