using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebXNK.Api.Controllers;
using WebXNK.Application.Common.Models;
using WebXNK.Application.DTOs;
using WebXNK.Domain.Entities;
using WebXNK.Infrastructure.Persistence.Context;

namespace WebXNK.Api.Controllers.V1;

[Authorize(Roles = "B2C_Customer,B2B_Buyer")]
public class CustomerAddressesController : BaseApiController
{
    private readonly WebXnkDbContext _db;

    public CustomerAddressesController(WebXnkDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetMine()
    {
        var userId = CurrentUserId();
        var rows = await _db.CustomerAddresses.AsNoTracking()
            .Where(address => address.UserId == userId)
            .OrderByDescending(address => address.IsDefault)
            .ThenByDescending(address => address.Id)
            .ToListAsync();
        var addresses = rows.Select(ToDto).ToList();
        return Ok(ApiResponse<List<CustomerAddressDto>>.Ok(addresses));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SaveCustomerAddressRequestDto request)
    {
        var userId = CurrentUserId();
        var hasAddresses = await _db.CustomerAddresses.AnyAsync(address => address.UserId == userId);
        var makeDefault = request.IsDefault || !hasAddresses;
        if (makeDefault) await ClearDefaultsAsync(userId);

        var address = new CustomerAddress { UserId = userId };
        Apply(address, request, makeDefault);
        _db.CustomerAddresses.Add(address);
        try
        {
            await _db.SaveChangesAsync();
            return CreatedAtAction(nameof(GetMine), null, ApiResponse<CustomerAddressDto>.Ok(ToDto(address), "Đã lưu địa chỉ."));
        }
        catch (DbUpdateException)
        {
            return Conflict(ApiResponse<object>.Fail(StatusCodes.Status409Conflict, "Không thể đặt địa chỉ mặc định cùng lúc. Vui lòng tải lại và thử lại."));
        }
    }

    [HttpPut("{id:long}")]
    public async Task<IActionResult> Update(long id, [FromBody] SaveCustomerAddressRequestDto request)
    {
        var userId = CurrentUserId();
        var address = await _db.CustomerAddresses.FirstOrDefaultAsync(item => item.Id == id && item.UserId == userId);
        if (address == null) return NotFound(ApiResponse<object>.Fail(StatusCodes.Status404NotFound, "Không tìm thấy địa chỉ."));

        var otherAddresses = await _db.CustomerAddresses
            .Where(item => item.UserId == userId && item.Id != id)
            .OrderBy(item => item.Id)
            .ToListAsync();
        var makeDefault = request.IsDefault || (address.IsDefault && otherAddresses.Count == 0);
        if (makeDefault)
        {
            await ClearDefaultsAsync(userId, id);
        }
        else if (address.IsDefault && otherAddresses.Count > 0)
        {
            address.IsDefault = false;
            otherAddresses[0].IsDefault = true;
        }

        Apply(address, request, makeDefault);
        try
        {
            await _db.SaveChangesAsync();
            return Ok(ApiResponse<CustomerAddressDto>.Ok(ToDto(address), "Đã cập nhật địa chỉ."));
        }
        catch (DbUpdateException)
        {
            return Conflict(ApiResponse<object>.Fail(StatusCodes.Status409Conflict, "Không thể cập nhật địa chỉ mặc định. Vui lòng tải lại và thử lại."));
        }
    }

    [HttpDelete("{id:long}")]
    public async Task<IActionResult> Delete(long id)
    {
        var userId = CurrentUserId();
        var address = await _db.CustomerAddresses.FirstOrDefaultAsync(item => item.Id == id && item.UserId == userId);
        if (address == null) return NotFound(ApiResponse<object>.Fail(StatusCodes.Status404NotFound, "Không tìm thấy địa chỉ."));

        var replacement = address.IsDefault
            ? await _db.CustomerAddresses.Where(item => item.UserId == userId && item.Id != id).OrderBy(item => item.Id).FirstOrDefaultAsync()
            : null;
        if (address.IsDefault)
        {
            address.IsDefault = false;
            await _db.SaveChangesAsync();
        }

        _db.CustomerAddresses.Remove(address);
        if (replacement != null) replacement.IsDefault = true;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private async Task ClearDefaultsAsync(long userId, long? exceptId = null)
    {
        var existingDefaults = await _db.CustomerAddresses
            .Where(item => item.UserId == userId && item.IsDefault && (!exceptId.HasValue || item.Id != exceptId.Value))
            .ToListAsync();
        if (existingDefaults.Count == 0) return;
        foreach (var item in existingDefaults) item.IsDefault = false;
        await _db.SaveChangesAsync();
    }

    private long CurrentUserId()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return long.TryParse(value, out var userId) ? userId : 0;
    }

    private static void Apply(CustomerAddress address, SaveCustomerAddressRequestDto request, bool isDefault)
    {
        address.RecipientName = request.RecipientName.Trim();
        address.PhoneNumber = request.PhoneNumber.Trim();
        address.Province = request.Province.Trim();
        address.District = request.District.Trim();
        address.Ward = request.Ward.Trim();
        address.AddressLine = request.AddressLine.Trim();
        address.CountryCode = string.IsNullOrWhiteSpace(request.CountryCode) ? "VNM" : request.CountryCode.Trim().ToUpperInvariant();
        address.PostalCode = request.PostalCode?.Trim() ?? string.Empty;
        address.IsDefault = isDefault;
        address.UpdatedAt = DateTime.UtcNow;
    }

    private static CustomerAddressDto ToDto(CustomerAddress address) => new()
    {
        Id = address.Id,
        RecipientName = address.RecipientName,
        PhoneNumber = address.PhoneNumber,
        Province = address.Province,
        District = address.District,
        Ward = address.Ward,
        AddressLine = address.AddressLine,
        CountryCode = address.CountryCode,
        PostalCode = address.PostalCode,
        IsDefault = address.IsDefault
    };
}
