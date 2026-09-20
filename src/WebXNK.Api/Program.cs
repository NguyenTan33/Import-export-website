using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using WebXNK.Api.Middlewares;
using WebXNK.Application;
using WebXNK.Infrastructure;
using WebXNK.Infrastructure.Persistence.Context;
using WebXNK.Infrastructure.Persistence.Seed;

var builder = WebApplication.CreateBuilder(args);

// 1. Đăng ký Application & Infrastructure Services theo Clean Architecture
builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices(builder.Configuration);

// 2. Cấu hình JWT Bearer Authentication (EXP-12)
var jwtSecret = builder.Configuration["JwtSettings:Secret"] 
    ?? "WebXNK_SuperSecretKey_ForJwtAuthentication_2026_Minimum32BytesLong!";
var jwtIssuer = builder.Configuration["JwtSettings:Issuer"] ?? "WebXNK.Api";
var jwtAudience = builder.Configuration["JwtSettings:Audience"] ?? "WebXNK.Client";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// 3. Controllers & Routing
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// 4. Cấu hình Swagger OpenAPI kèm Authorization Header [Bearer {token}]
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "WebXNK - Global Export & B2B/B2C E-Commerce API",
        Version = "v1",
        Description = "Nền tảng Web API Xuất Khẩu Quốc Tế & Thương Mại Điện Tử Hybrid B2B & B2C"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Nhập JWT Token của bạn theo dạng: Bearer {your_token}"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// 5. Cấu hình CORS cho Client Next.js / React
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowNextJsClient", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "https://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// 6. Pipeline: Global Exception Middleware
app.UseMiddleware<ExceptionHandlingMiddleware>();

// 7. Swagger UI
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "WebXNK API v1");
    c.RoutePrefix = string.Empty;
});

app.UseCors("AllowNextJsClient");

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

// 8. Auth Middlewares (Authentication trước Authorization)
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// 9. Khởi tạo và nạp dữ liệu mẫu (Seed Data)
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<WebXnkDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    await DbInitializer.InitializeAsync(context, logger);
}

app.Run();
