using Microsoft.EntityFrameworkCore;
using WebXNK.Application.Common.Interfaces;
using WebXNK.Application.DTOs;
using WebXNK.Application.Interfaces;

namespace WebXNK.Application.Services;

public class CompanyManagementService : ICompanyManagementService
{
    private readonly IApplicationDbContext _context;

    public CompanyManagementService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<CompanyProfileDto>> GetPendingCompaniesAsync()
    {
        var companies = await _context.Companies
            .AsNoTracking()
            .Where(c => c.VerificationStatus == "PENDING")
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        return companies.Select(c => new CompanyProfileDto
        {
            Id = c.Id,
            CompanyName = c.CompanyName,
            TaxId = c.TaxId,
            CountryCode = c.CountryCode,
            VerificationStatus = c.VerificationStatus,
            Website = c.Website,
            BusinessLicenseUrl = c.BusinessLicenseUrl,
            CreditLimit = c.CreditLimit,
            DefaultPaymentTerms = c.DefaultPaymentTerms
        }).ToList();
    }

    public async Task<CompanyProfileDto> VerifyCompanyAsync(
        long companyId, 
        VerifyCompanyRequestDto request, 
        long verifiedByAdminId)
    {
        var company = await _context.Companies
            .FirstOrDefaultAsync(c => c.Id == companyId)
            ?? throw new KeyNotFoundException($"Không tìm thấy doanh nghiệp có ID = {companyId}");

        company.VerificationStatus = request.IsApproved ? "VERIFIED" : "REJECTED";
        company.VerifiedBy = verifiedByAdminId;
        company.VerifiedAt = DateTime.UtcNow;

        if (request.IsApproved && request.InitialCreditLimit.HasValue)
        {
            company.CreditLimit = Math.Max(0, request.InitialCreditLimit.Value);
        }

        await _context.SaveChangesAsync();

        return new CompanyProfileDto
        {
            Id = company.Id,
            CompanyName = company.CompanyName,
            TaxId = company.TaxId,
            CountryCode = company.CountryCode,
            VerificationStatus = company.VerificationStatus,
            Website = company.Website,
            BusinessLicenseUrl = company.BusinessLicenseUrl,
            CreditLimit = company.CreditLimit,
            DefaultPaymentTerms = company.DefaultPaymentTerms
        };
    }
}
