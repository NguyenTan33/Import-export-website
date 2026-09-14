using FluentValidation;
using WebXNK.Application.DTOs;

namespace WebXNK.Application.Validators;

public class RegisterB2cValidator : AbstractValidator<RegisterB2cRequestDto>
{
    public RegisterB2cValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email không được để trống.")
            .EmailAddress().WithMessage("Định dạng email không hợp lệ.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Mật khẩu không được để trống.")
            .MinimumLength(6).WithMessage("Mật khẩu phải có ít nhất 6 ký tự.");

        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Họ và tên không được để trống.")
            .MaximumLength(150).WithMessage("Họ và tên không được vượt quá 150 ký tự.");
    }
}

public class RegisterB2bValidator : AbstractValidator<RegisterB2bRequestDto>
{
    public RegisterB2bValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email doanh nghiệp không được để trống.")
            .EmailAddress().WithMessage("Định dạng email không hợp lệ.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Mật khẩu không được để trống.")
            .MinimumLength(6).WithMessage("Mật khẩu phải có ít nhất 6 ký tự.");

        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Họ tên người đại diện không được để trống.");

        RuleFor(x => x.CompanyName)
            .NotEmpty().WithMessage("Tên công ty / pháp nhân không được để trống.")
            .MaximumLength(255);

        RuleFor(x => x.TaxId)
            .NotEmpty().WithMessage("Mã số thuế / Tax ID / VAT không được để trống.")
            .MinimumLength(5).WithMessage("Mã số thuế phải có ít nhất 5 ký tự.");

        RuleFor(x => x.CountryCode)
            .NotEmpty().WithMessage("Mã quốc gia không được để trống.")
            .Length(3).WithMessage("Mã quốc gia phải chuẩn ISO-3 (gồm đúng 3 chữ cái, ví dụ: USA, DEU, VNM, JPN).");
    }
}

public class LoginValidator : AbstractValidator<LoginRequestDto>
{
    public LoginValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email không được để trống.")
            .EmailAddress().WithMessage("Định dạng email không hợp lệ.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Mật khẩu không được để trống.");
    }
}
