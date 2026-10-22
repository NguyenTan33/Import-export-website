using System.ComponentModel.DataAnnotations;

namespace WebXNK.Application.DTOs;

public class CustomerAddressDto
{
    public long Id { get; set; }
    public string RecipientName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Province { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public string Ward { get; set; } = string.Empty;
    public string AddressLine { get; set; } = string.Empty;
    public string CountryCode { get; set; } = "VNM";
    public string PostalCode { get; set; } = string.Empty;
    public bool IsDefault { get; set; }
}

public class SaveCustomerAddressRequestDto
{
    [Required, MaxLength(150)] public string RecipientName { get; set; } = string.Empty;
    [Required, MaxLength(30)] public string PhoneNumber { get; set; } = string.Empty;
    [Required, MaxLength(100)] public string Province { get; set; } = string.Empty;
    [Required, MaxLength(100)] public string District { get; set; } = string.Empty;
    [Required, MaxLength(100)] public string Ward { get; set; } = string.Empty;
    [Required, MaxLength(300)] public string AddressLine { get; set; } = string.Empty;
    [MaxLength(3)] public string CountryCode { get; set; } = "VNM";
    [MaxLength(20)] public string PostalCode { get; set; } = string.Empty;
    public bool IsDefault { get; set; }
}
